import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs/promises';
import path from 'path';
import OpenAI from 'openai';
import youtubeDl, { create } from 'youtube-dl-exec';
import { VideoOptions } from '@shared/types/options';
import type { FfprobeData } from 'fluent-ffmpeg';
import 'dotenv/config';
import { VideoGenStatus } from '@shared/types/api/schema';

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

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
			.output(outputPath)
			.on('end', () => resolve(outputPath))
			.on('error', (err: Error) => reject(err))
			.run();
	});
}

async function downloadVideo(url: string, outputPath: string): Promise<void> {
	try {
		const ytDlOptions = {
			format: 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4',
			output: outputPath,
			noCheckCertificates: true,
			noWarnings: true,
			preferFreeFormats: true,
			addHeader: ['referer:youtube.com', 'user-agent:googlebot'],
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

export async function generateVideo(id: string, url: string, audioIds: string[], options: VideoOptions): Promise<void> {
	console.log('Starting video generation process...');
	const projectDir = path.join('data', id);

	// ensure project directory exists
	await fs.mkdir(projectDir, { recursive: true });

	const sourceVideoPath = path.join(projectDir, 'source.mp4');
	const pauseAudioPath = path.join(projectDir, 'pause.mp3');
	const outputPath = path.join(projectDir, 'output.mp4');

	try {
		// First download the video
		console.log('Downloading source video...');
		await downloadVideo(url, sourceVideoPath);

		// Then process video with existing video processing logic
		console.log('Processing video...');
		await processVideo(sourceVideoPath, audioIds, outputPath, pauseAudioPath, options.video);
		console.log('Video generation completed successfully');
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
