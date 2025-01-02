import * as ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs/promises';
import * as path from 'path';
import OpenAI from 'openai';
import youtubeDl, { create } from 'youtube-dl-exec';
import { VideoOptions } from '@shared/types/options';
import type { FfprobeData } from 'fluent-ffmpeg';
import { GenerationStep } from '@shared/types/api/schema';
import { projectStorage } from '@/db/storage';
import 'dotenv/config';

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

// Helper to update generation state
const updateState = async (id: string, step: GenerationStep, error?: { step: GenerationStep; message: string }) => {
	const project = await projectStorage.getProject(id);
	if (!project) throw new Error('Project not found');

	// Ensure completedSteps is an array
	if (!project.generationState.completedSteps) {
		project.generationState.completedSteps = [];
	}

	// Add previous step to completed steps if not error and not moving to error state
	if (!error && step !== GenerationStep.ERROR && project.generationState.currentStep !== GenerationStep.IDLE) {
		if (!project.generationState.completedSteps.includes(project.generationState.currentStep)) {
			project.generationState.completedSteps.push(project.generationState.currentStep);
		}
	}

	project.generationState = {
		currentStep: step,
		completedSteps: project.generationState.completedSteps,
		...(error && { error }),
	};

	await projectStorage.updateProjectState(project);
};

async function getMediaDuration(filepath: string): Promise<number> {
	return new Promise((resolve, reject) => {
		ffmpeg.ffprobe(filepath, (err: Error | null, metadata: FfprobeData) => {
			if (err) return reject(err);
			resolve(metadata.format.duration || 0);
		});
	});
}

const getScaleFilter = (size: string) => {
	switch (size) {
		case 'source':
			return '';
		case '720p':
			return ',scale=-2:720';
		case '1080p':
			return ',scale=-2:1080';
		case '1440p':
			return ',scale=-2:1440';
		case '4k':
			return ',scale=-2:2160';
		default:
			return '';
	}
};

async function extractAudio(videoPath: string, outputPath: string): Promise<string> {
	return new Promise((resolve, reject) => {
		ffmpeg()
			.input(videoPath)
			.toFormat('mp3')
			.output(outputPath)
			.on('end', () => resolve(outputPath))
			.on('error', (err: Error) => reject(err))
			.run();
	});
}

async function generateSubtitles(videoPath: string, srtPath: string): Promise<string> {
	console.log('Generating subtitles...');
	const audioPath = videoPath.replace(/\.[^/.]+$/, '.mp3');
	await extractAudio(videoPath, audioPath);

	const audioFile = await fs.readFile(audioPath);
	const audioBlob = new Blob([audioFile], { type: 'audio/mp3' });
	const file = new File([audioBlob], 'audio.mp3', { type: 'audio/mp3' });

	const transcript = await openai.audio.transcriptions.create({
		file: file,
		model: 'whisper-1',
		language: 'en',
		response_format: 'srt',
	});

	await fs.writeFile(srtPath, transcript);
	await fs.unlink(audioPath);

	return srtPath;
}

async function addSubtitles(videoPath: string, srtPath: string, outputPath: string, size: number): Promise<string> {
	return new Promise((resolve, reject) => {
		ffmpeg()
			.input(videoPath)
			.videoFilters([`subtitles=${srtPath}:force_style='FontSize=${size}'`])
			.outputOptions(['-c:v', 'libx264', '-c:a', 'copy'])
			.output(outputPath)
			.on('end', () => resolve(outputPath))
			.on('error', (err: Error) => reject(err))
			.run();
	});
}

async function downloadVideo(url: string, outputPath: string, size: string = 'source'): Promise<void> {
	try {
		// Only filter resolution during download if we're downscaling
		// For upscaling, we want the best quality source
		const heightFilter =
			size === '720p' ? 720 : size === '1080p' ? 1080 : size === '1440p' ? 1440 : size === '4k' ? 2160 : null;
		const formatFilter = heightFilter
			? `bestvideo[height<=${heightFilter}]+bestaudio/best[height<=${heightFilter}]`
			: 'bestvideo+bestaudio/best'; // Always get best quality for potential upscaling

		const ytDlOptions = {
			format: formatFilter,
			output: outputPath,
			noCheckCertificates: true,
			noWarnings: true,
			preferFreeFormats: true,
			addHeader: ['referer:youtube.com', 'user-agent:googlebot'],
			mergeOutputFormat: 'mkv',
		};

		if (process.env.YT_DLP_PATH) {
			await create(process.env.YT_DLP_PATH as string)(url, ytDlOptions);
		} else {
			await youtubeDl(url, ytDlOptions);
		}
	} catch (error) {
		console.error('Error downloading video:', error);
		throw error;
	}
}

async function scaleVideo(inputPath: string, outputPath: string, size: string): Promise<string> {
	return new Promise((resolve, reject) => {
		const scaleFilter = getScaleFilter(size);
		if (!scaleFilter) {
			// If no scaling needed, just copy the file
			fs.copyFile(inputPath, outputPath)
				.then(() => resolve(outputPath))
				.catch(reject);
			return;
		}

		ffmpeg()
			.input(inputPath)
			.videoFilters([scaleFilter.substring(1)]) // remove leading comma
			.outputOptions(['-c:v', 'libx264', '-c:a', 'copy'])
			.output(outputPath)
			.on('end', () => resolve(outputPath))
			.on('error', (err: Error) => reject(err))
			.run();
	});
}

export async function generateVideo(id: string, url: string, options: VideoOptions): Promise<void> {
	try {
		console.log('Preparing to generate video...');
		await updateState(id, GenerationStep.PREPARING);

		const projectDir = path.join('data', id);
		const videoDir = path.join(projectDir, 'video');
		const miscDir = path.join(projectDir, 'misc');

		await fs.mkdir(videoDir, { recursive: true });
		await fs.mkdir(miscDir, { recursive: true });

		// convert audio IDs to absolute paths (they're in the commentary dir)
		const audioFiles = await fs.readdir(path.join(projectDir, 'commentary'));

		const sourceVideoPath = path.join(videoDir, 'source.mkv');
		const scaledVideoPath = path.join(videoDir, 'scaled.mkv');
		const subtitledVideoPath = path.join(videoDir, 'subtitled.mkv');
		const pauseAudioPath = path.join(miscDir, 'pause.mp3');
		const outputPath = path.join(videoDir, 'output.mp4');

		try {
			console.log('Downloading video...');
			await updateState(id, GenerationStep.DOWNLOADING_VIDEO);
			await downloadVideo(url, sourceVideoPath, options.video.size);
			console.log('Downloaded video');
		} catch (error) {
			await updateState(id, GenerationStep.ERROR, {
				step: GenerationStep.DOWNLOADING_VIDEO,
				message: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}

		// Scale video to target resolution
		await updateState(id, GenerationStep.PROCESSING_VIDEO);
		await scaleVideo(sourceVideoPath, scaledVideoPath, options.video.size);
		console.log('Scaled video');

		let videoToProcess = scaledVideoPath;

		// Add subtitles if enabled (after scaling)
		if (options.video.subtitlesEnabled) {
			console.log('Transcribing source...');
			await updateState(id, GenerationStep.TRANSCRIBING);
			try {
				const srtPath = path.join(projectDir, 'subtitles.srt');
				await generateSubtitles(sourceVideoPath, srtPath);
				await addSubtitles(scaledVideoPath, srtPath, subtitledVideoPath, options.video.subtitlesSize);
				videoToProcess = subtitledVideoPath;
			} catch (error) {
				await updateState(id, GenerationStep.ERROR, {
					step: GenerationStep.TRANSCRIBING,
					message: error instanceof Error ? error.message : 'Unknown error',
				});
				throw error;
			}
		}

		console.log('Processing final video...');
		await updateState(id, GenerationStep.PROCESSING_VIDEO);
		try {
			await processVideo(videoToProcess, audioFiles, outputPath, pauseAudioPath, options.video);
		} catch (error) {
			await updateState(id, GenerationStep.ERROR, {
				step: GenerationStep.PROCESSING_VIDEO,
				message: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}

		// Cleanup intermediate files
		await Promise.all([
			fs.unlink(sourceVideoPath),
			fs.unlink(scaledVideoPath),
			options.video.subtitlesEnabled ? fs.unlink(subtitledVideoPath) : Promise.resolve(),
		]).catch(console.error); // Don't fail if cleanup fails

		await updateState(id, GenerationStep.COMPLETED);
		console.log('Video generation complete');
	} catch (error) {
		console.error('Error in video generation:', error);
		throw error;
	}
}

async function processVideo(
	sourceVideo: string,
	audioIds: string[],
	outputPath: string,
	pauseAudio: string,
	options: VideoOptions['video'],
): Promise<void> {
	console.log('Processing video...');
	const originalVideoLength = await getMediaDuration(sourceVideo);

	return new Promise((resolve, reject) => {
		const command = ffmpeg();
		command.input(sourceVideo);

		// add all overlay audio files as inputs
		audioIds.forEach(audioId => command.input(audioId));

		// add pause sound as last input if enabled
		if (options.playSound) {
			command.input(pauseAudio);
		}

		const filterComplex: string[] = [];
		const streams: string[] = [];
		const pauseInputIndex = audioIds.length + 1;

		// get scale filter based on size option
		const scaleFilter = getScaleFilter(options.size || 'source');

		// initial segment before first overlay (if there is one)
		if (audioIds.length > 0) {
			filterComplex.push(`[0:v]trim=0:0.04,setpts=PTS-STARTPTS${scaleFilter}[v0]`);
			filterComplex.push(`[0:a]atrim=0:0.04,asetpts=PTS-STARTPTS[a0]`);
			streams.push('[v0][a0]');
		}

		// process each overlay and segment after it
		audioIds.forEach((_, i) => {
			// freeze frame
			filterComplex.push(
				`[0:v]trim=${i * 0.04}:${(i + 1) * 0.04},setpts=PTS-STARTPTS,` +
					`tpad=stop_mode=clone:stop_duration=${options.playSound ? 1.5 : 1.0}` +
					`${options.bw ? ',hue=s=0:b=0' : ''}${scaleFilter}[vf${i}]`,
			);

			if (options.playSound) {
				// pause sound
				filterComplex.push(`[${pauseInputIndex}:a]asetpts=PTS-STARTPTS[pause${i}]`);
				// overlay audio delayed by pause sound duration
				filterComplex.push(`[${i + 1}:a]asetpts=PTS-STARTPTS,adelay=500|500[delay${i}]`);
				// mix pause sound and delayed overlay audio
				filterComplex.push(`[pause${i}][delay${i}]amix=inputs=2:duration=longest[af${i}]`);
			} else {
				// just use overlay audio directly if no pause sound
				filterComplex.push(`[${i + 1}:a]asetpts=PTS-STARTPTS[af${i}]`);
			}

			streams.push(`[vf${i}][af${i}]`);

			// next segment if not last overlay
			if (i < audioIds.length - 1) {
				filterComplex.push(
					`[0:v]trim=${(i + 1) * 0.04}:${(i + 2) * 0.04},setpts=PTS-STARTPTS${scaleFilter}[v${i + 1}]`,
				);
				filterComplex.push(`[0:a]atrim=${(i + 1) * 0.04}:${(i + 2) * 0.04},asetpts=PTS-STARTPTS[a${i + 1}]`);
				streams.push(`[v${i + 1}][a${i + 1}]`);
			}
		});

		// concatenate all segments
		filterComplex.push(`${streams.join('')}concat=n=${streams.length}:v=1:a=1[outv][outa]`);

		command
			.complexFilter(filterComplex, ['outv', 'outa'])
			.outputOptions(['-c:v', 'libx264', '-c:a', 'aac', '-vsync', '1', '-y'])
			.output(outputPath)
			.on('end', () => resolve())
			.on('error', (err: Error) => reject(err))
			.run();
	});
}
