import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs/promises';
import path from 'path';
import OpenAI from 'openai';
import youtubedl, { create } from 'youtube-dl-exec';
import { ffprobe, type FfprobeData } from 'fluent-ffmpeg';
import { VideoOptions } from '@shared/types/options';
import { GenerationStep, VideoGenState } from '@shared/types/api/schema';
import dotenv from 'dotenv';

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
	options: {
		bw: boolean;
		playSound: boolean;
		size: string;
		subtitlesEnabled: boolean;
	},
): Promise<string> {
	console.log('Processing video with overlays...');
	const overlays = await findOverlayAudios(commentaryDir);
	const originalVideoLength = await getMediaDuration(sourceVideo);
	console.log('overlays', overlays);
	console.log('originalVideoLength', originalVideoLength);
	console.log('pauseAudio', pauseAudio);
	console.log('directory', commentaryDir);

	const pauseAudioExt = path.extname(pauseAudio).toLowerCase();
	if (!pauseAudioExt.match(/\.(mp3|wav|m4a|aac)$/)) {
		throw new Error('Unsupported pause audio format');
	}

	return new Promise<string>((resolve, reject) => {
		const command = ffmpeg(sourceVideo);

		overlays.forEach(o => command.input(o.filepath));

		if (options.playSound) {
			command.input(pauseAudio);
		}

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
				filterComplex.push(`[${i + 1}:a]asetpts=PTS-STARTPTS,adelay=500|500[delay${i}]`);
				filterComplex.push(`[pause${i}][delay${i}]amix=inputs=2:duration=longest[af${i}]`);
			} else {
				filterComplex.push(`[${i + 1}:a]asetpts=PTS-STARTPTS[af${i}]`);
			}

			streams.push(`[vf${i}][af${i}]`);

			const nextTs = i < overlays.length - 1 ? overlays[i + 1].timestampSeconds : originalVideoLength;
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

async function downloadVideo(url: string, outputPath: string, size: string): Promise<void> {
	const ytDl = process.env.YT_DLP_PATH ? create(process.env.YT_DLP_PATH) : youtubedl;
	await ytDl(url, {
		format: 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
		output: outputPath,
		mergeOutputFormat: 'mkv',
	});
}

export async function generateVideo(
	project: VideoGenState,
	options: VideoOptions,
	updateState: (step: GenerationStep, error?: { step: GenerationStep; message: string }) => Promise<void>,
): Promise<void> {
	try {
		const projectDir = path.join('data', project.id);
		const videoDir = path.join(projectDir, 'video');
		const miscDir = path.join(projectDir, 'misc');
		const commentaryDir = path.join(projectDir, 'commentary');

		await fs.mkdir(videoDir, { recursive: true });
		await fs.mkdir(miscDir, { recursive: true });
		await fs.mkdir(commentaryDir, { recursive: true });

		const sourceVideoPath = path.join(videoDir, 'source.mkv');
		const scaledVideoPath = path.join(videoDir, 'scaled.mkv');
		const subtitledVideoPath = path.join(videoDir, 'subtitled.mkv');
		const pauseAudioPath = path.join(miscDir, project.pauseSoundFilename);
		const outputPath = path.join(videoDir, 'output.mp4');

		try {
			console.log('Downloading video...');
			await updateState(GenerationStep.DOWNLOADING_VIDEO);
			await downloadVideo(project.metadata.url, sourceVideoPath, options.video.size);
			console.log('Downloaded video');
		} catch (error) {
			await updateState(GenerationStep.ERROR, {
				step: GenerationStep.DOWNLOADING_VIDEO,
				message: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}

		const needsScaling = options.video.size !== 'source';
		try {
			await updateState(GenerationStep.SCALING_VIDEO);
			if (needsScaling) {
				await scaleVideo(sourceVideoPath, scaledVideoPath, options.video.size);
			}
		} catch (error) {
			await updateState(GenerationStep.ERROR, {
				step: GenerationStep.SCALING_VIDEO,
				message: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}

		let videoToProcess = needsScaling ? scaledVideoPath : sourceVideoPath;

		if (options.video.subtitlesEnabled) {
			console.log('Transcribing source...');
			await updateState(GenerationStep.TRANSCRIBING);
			try {
				const srtPath = path.join(miscDir, 'subtitles.srt');
				await generateSubtitles(videoToProcess, srtPath);
				await addSubtitles(videoToProcess, srtPath, subtitledVideoPath, options.video.subtitlesSize);
				videoToProcess = subtitledVideoPath;
			} catch (error) {
				await updateState(GenerationStep.ERROR, {
					step: GenerationStep.TRANSCRIBING,
					message: error instanceof Error ? error.message : 'Unknown error',
				});
				throw error;
			}
		}

		await updateState(GenerationStep.PROCESSING_VIDEO);
		try {
			await processVideoWithOverlays(videoToProcess, outputPath, commentaryDir, pauseAudioPath, {
				bw: options.video.bw,
				playSound: options.video.playSound,
				size: options.video.size,
				subtitlesEnabled: options.video.subtitlesEnabled,
			});
		} catch (error) {
			await updateState(GenerationStep.ERROR, {
				step: GenerationStep.PROCESSING_VIDEO,
				message: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}

		console.log('Finalizing...');
		await updateState(GenerationStep.FINALIZING);

		try {
			await fs.unlink(sourceVideoPath);
			if (options.video.size !== 'source') {
				await fs.unlink(scaledVideoPath);
			}
			if (options.video.subtitlesEnabled) {
				await fs.unlink(subtitledVideoPath);
			}
		} catch (error) {
			console.error('Error cleaning up files:', error);
		}

		await updateState(GenerationStep.COMPLETED);
		console.log('Video generation completed successfully');
	} catch (error) {
		console.error('Video generation failed:', error);
		if (error instanceof Error) {
			await updateState(GenerationStep.ERROR, {
				step: GenerationStep.PROCESSING_VIDEO,
				message: error.message,
			}).catch(e => {
				console.error('Failed to update error state:', e);
			});
		}
		throw error;
	}
}
