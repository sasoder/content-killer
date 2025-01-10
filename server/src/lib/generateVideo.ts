import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs/promises';
import path from 'path';
import OpenAI from 'openai';
import { ffprobe, type FfprobeData } from 'fluent-ffmpeg';
import { VideoOptions } from '@shared/types/options';
import { VideoGenerationStep, TimestampText, VideoGenerationState } from '@shared/types/api/schema';
import { downloadVideo } from './downloadVideo';
import dotenv from 'dotenv';
import { projectStorage } from '@/db/storage';
import { generateAudio } from './generateAudio';
import { PROJECTS_DIR } from '@/db/storage';

dotenv.config();

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

interface AudioOverlay {
	timestamp: string;
	timestampSeconds: number;
	duration: number;
	filepath: string;
}

function parseTimestamp(timestamp: string): number {
	const minutes = parseInt(timestamp.slice(0, 2), 10);
	const seconds = parseInt(timestamp.slice(2, 4), 10);
	return minutes * 60 + seconds;
}

async function getMediaDuration(filepath: string): Promise<number> {
	return new Promise((resolve, reject) => {
		ffprobe(filepath, (err: Error | null, metadata: FfprobeData) => {
			if (err) return reject(err);
			resolve(metadata.format.duration || 0);
		});
	});
}

async function findOverlayAudios(directory: string): Promise<AudioOverlay[]> {
	console.log('findOverlayAudios', directory);
	const files = await fs.readdir(directory);
	const overlays: AudioOverlay[] = [];

	for (const file of files) {
		if (file.match(/^\d{4}\.mp3$/)) {
			const timestamp = file.slice(0, 4);
			const filepath = path.join(directory, file);
			const duration = await getMediaDuration(filepath);
			const timestampSeconds = parseTimestamp(timestamp);
			overlays.push({
				timestamp,
				timestampSeconds,
				duration,
				filepath,
			});
		}
	}

	return overlays.sort((a, b) => a.timestampSeconds - b.timestampSeconds);
}

const getScaleFilter = (size: string) => {
	switch (size) {
		case 'source':
			return '';
		case '720p':
			return ',scale=-2:720';
		case '1080p':
			return ',scale=-2:1080';
		case '4k':
			return ',scale=-2:2160';
		default:
			return '';
	}
};

async function scaleVideo(inputPath: string, outputPath: string, size: string): Promise<string> {
	return new Promise((resolve, reject) => {
		const scaleFilter = getScaleFilter(size);
		if (!scaleFilter) {
			return resolve(inputPath);
		}

		ffmpeg(inputPath)
			.videoFilters([scaleFilter.substring(1)])
			.outputOptions(['-c:v', 'libx264', '-c:a', 'copy'])
			.output(outputPath)
			.on('end', () => resolve(outputPath))
			.on('error', err => reject(err))
			.run();
	});
}

async function extractAudio(videoPath: string, outputPath: string): Promise<string> {
	return new Promise((resolve, reject) => {
		ffmpeg(videoPath)
			.toFormat('mp3')
			.output(outputPath)
			.on('end', () => resolve(outputPath))
			.on('error', err => reject(err))
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
		model: process.env.OPENAI_TRANSCRIBE_MODEL || 'whisper-1',
		language: 'en',
		response_format: 'srt',
	});

	await fs.writeFile(srtPath, transcript);

	return srtPath;
}

async function addSubtitles(videoPath: string, srtPath: string, outputPath: string, size: number): Promise<string> {
	return new Promise((resolve, reject) => {
		ffmpeg(videoPath)
			.videoFilters([`subtitles=${srtPath}:force_style='FontSize=${size}'`])
			.output(outputPath)
			.on('end', () => resolve(outputPath))
			.on('error', err => reject(err))
			.run();
	});
}

async function processVideoWithOverlays(
	sourceVideo: string,
	outputPath: string,
	commentaryDir: string,
	pauseAudio: string,
	options: VideoOptions['video'],
): Promise<string> {
	console.log('Processing video with overlays...');
	const overlays = await findOverlayAudios(commentaryDir);
	const originalVideoDuration = await getMediaDuration(sourceVideo);
	console.log('overlays', overlays);
	console.log('originalVideoDuration', originalVideoDuration);
	console.log('pauseAudio', pauseAudio);
	console.log('directory', commentaryDir);

	const pauseAudioExt = path.extname(pauseAudio).toLowerCase();
	if (!pauseAudioExt.match(/\.(mp3|wav|m4a|aac)$/)) {
		throw new Error('Unsupported pause audio format');
	}

	return new Promise<string>(async (resolve, reject) => {
		const command = ffmpeg(sourceVideo);

		overlays.forEach(o => command.input(o.filepath));

		if (options.playSound) {
			command.input(pauseAudio);
		}

		// Get pause audio duration early
		const pauseDuration = await getMediaDuration(pauseAudio);
		const delayMs = Math.max(0, (pauseDuration - 0.2) * 1000); // 200ms before end

		const filterComplex: string[] = [];
		const streams: string[] = [];
		const pauseInputIndex = overlays.length + 1;

		const scaleFilter = getScaleFilter(options.size);

		if (overlays[0]?.timestampSeconds > 0) {
			filterComplex.push(`[0:v]trim=0:${overlays[0].timestampSeconds},setpts=PTS-STARTPTS${scaleFilter}[v0]`);
			filterComplex.push(`[0:a]atrim=0:${overlays[0].timestampSeconds},asetpts=PTS-STARTPTS[a0]`);
			streams.push('[v0][a0]');
		}

		overlays.forEach((overlay, i) => {
			filterComplex.push(
				`[0:v]trim=${overlay.timestampSeconds}:${overlay.timestampSeconds + 0.04},setpts=PTS-STARTPTS,` +
					`tpad=stop_mode=clone:stop_duration=${overlay.duration + (options.playSound ? 0.5 : 0)}` +
					`${options.bw ? ',hue=s=0:b=0' : ''}${scaleFilter}[vf${i}]`,
			);

			if (options.playSound) {
				filterComplex.push(`[${pauseInputIndex}:a]asetpts=PTS-STARTPTS[pause${i}]`);
				filterComplex.push(`[${i + 1}:a]asetpts=PTS-STARTPTS,adelay=${delayMs}|${delayMs}[delay${i}]`);
				filterComplex.push(`[pause${i}][delay${i}]amix=inputs=2:duration=longest[af${i}]`);
			} else {
				filterComplex.push(`[${i + 1}:a]asetpts=PTS-STARTPTS[af${i}]`);
			}

			streams.push(`[vf${i}][af${i}]`);

			const nextTs = i < overlays.length - 1 ? overlays[i + 1].timestampSeconds : originalVideoDuration;
			if (nextTs > overlay.timestampSeconds + 0.04) {
				filterComplex.push(
					`[0:v]trim=${overlay.timestampSeconds + 0.04}:${nextTs},setpts=PTS-STARTPTS${scaleFilter}[v${i + 1}]`,
				);
				filterComplex.push(`[0:a]atrim=${overlay.timestampSeconds + 0.04}:${nextTs},asetpts=PTS-STARTPTS[a${i + 1}]`);
				streams.push(`[v${i + 1}][a${i + 1}]`);
			}
		});

		if (streams.length > 0) {
			filterComplex.push(`${streams.join('')}concat=n=${streams.length}:v=1:a=1[outv][outa]`);

			command
				.complexFilter(filterComplex, ['outv', 'outa'])
				.outputOptions(['-c:v', 'libx264', '-c:a', 'aac', '-vsync', '1', '-y'])
				.output(outputPath)
				.on('end', () => resolve(outputPath))
				.on('error', err => reject(err))
				.run();
		} else {
			command
				.videoFilters(scaleFilter ? [scaleFilter.substring(1)] : [])
				.outputOptions(['-c:v', 'libx264', '-c:a', 'aac', '-y'])
				.output(outputPath)
				.on('end', () => resolve(outputPath))
				.on('error', err => reject(err))
				.run();
		}
	});
}

const progressMap = new Map<string, VideoGenerationState>();

export function updateVideoProgress(id: string, update: Partial<VideoGenerationState>) {
	const current = progressMap.get(id) || {
		currentStep: VideoGenerationStep.IDLE,
		completedSteps: [],
	};

	const newState = {
		...current,
		...update,
	};

	// Add completed step if moving to next step
	if (update.currentStep && update.currentStep !== current.currentStep) {
		// Only add non-IDLE steps to completedSteps
		if (current.currentStep !== VideoGenerationStep.IDLE) {
			newState.completedSteps = [...current.completedSteps, current.currentStep];
		}
	}

	progressMap.set(id, newState);
}

const resetProgress = (id: string) => {
	progressMap.delete(id);
};

export function getVideoGenerationProgress(id: string) {
	return progressMap.get(id);
}

export async function generateVideo(id: string, commentary: TimestampText[], options: VideoOptions) {
	try {
		resetProgress(id);
		const project = await projectStorage.getProject(id);
		if (!project) {
			throw new Error('Project not found');
		}

		// Update project state
		project.commentary = commentary;
		project.options.video = options;
		project.video = false;
		project.audio = false;
		await projectStorage.updateProjectState(project);

		updateVideoProgress(id, {
			currentStep: VideoGenerationStep.PREPARING,
		});

		// Create necessary directories
		const projectDir = path.join(PROJECTS_DIR, id);
		const videoDir = path.join(projectDir, 'video');
		const miscDir = path.join(projectDir, 'misc');
		const audioDir = path.join(projectDir, 'audio');
		console.log('projectDir', projectDir);
		console.log('videoDir', videoDir);
		console.log('miscDir', miscDir);
		console.log('audioDir', audioDir);

		await fs.mkdir(videoDir, { recursive: true });
		await fs.mkdir(miscDir, { recursive: true });
		await fs.mkdir(audioDir, { recursive: true });

		const sourceVideoPath = path.join(videoDir, 'source.mkv');
		const scaledVideoPath = path.join(videoDir, 'scaled.mkv');
		const subtitledVideoPath = path.join(videoDir, 'subtitled.mkv');
		const pauseAudioPath = path.join(miscDir, project.pauseSoundFilename);
		const outputPath = path.join(videoDir, 'output.mp4');

		await downloadVideo(project.metadata.url ?? '', id);

		updateVideoProgress(id, {
			currentStep: VideoGenerationStep.GENERATING_AUDIO,
		});

		// Remove existing audio files
		await projectStorage.deleteProjectAudio(id);
		await generateAudio(id, commentary, options.audio);

		// Scale video if needed
		let videoToProcess = sourceVideoPath;
		const needsScaling = options.video.size !== 'source';

		if (needsScaling) {
			updateVideoProgress(id, {
				currentStep: VideoGenerationStep.SCALING_VIDEO,
			});
			await scaleVideo(sourceVideoPath, scaledVideoPath, options.video.size);
			videoToProcess = scaledVideoPath;
		}

		// Generate subtitles if enabled
		if (options.video.subtitlesEnabled) {
			updateVideoProgress(id, {
				currentStep: VideoGenerationStep.TRANSCRIBING,
			});
			const srtPath = path.join(miscDir, 'subtitles.srt');
			await generateSubtitles(videoToProcess, srtPath);
			await addSubtitles(videoToProcess, srtPath, subtitledVideoPath, options.video.subtitlesSize);
			videoToProcess = subtitledVideoPath;
		}

		// Process video with overlays
		updateVideoProgress(id, {
			currentStep: VideoGenerationStep.PROCESSING_VIDEO,
		});

		await processVideoWithOverlays(videoToProcess, outputPath, audioDir, pauseAudioPath, {
			bw: options.video.bw,
			playSound: options.video.playSound,
			size: options.video.size,
			subtitlesEnabled: options.video.subtitlesEnabled,
		});

		updateVideoProgress(id, {
			currentStep: VideoGenerationStep.FINALIZING,
		});

		// cleanup temporary files
		try {
			await fs.unlink(sourceVideoPath);
			if (needsScaling) {
				await fs.unlink(scaledVideoPath);
			}
			if (options.video.subtitlesEnabled) {
				await fs.unlink(subtitledVideoPath);
			}
		} catch (error) {
			console.error('Error cleaning up files:', error);
		}

		updateVideoProgress(id, {
			currentStep: VideoGenerationStep.COMPLETED,
		});

		project.video = true;
		project.audio = true;
		await projectStorage.updateProjectState(project);
	} catch (error) {
		console.error('Error in video generation:', error);
		const errorMsg = error instanceof Error ? error.message : 'Unknown error';
		updateVideoProgress(id, {
			currentStep: VideoGenerationStep.ERROR,
			error: {
				step: VideoGenerationStep.ERROR,
				message: errorMsg,
			},
		});
		throw error;
	}
}
