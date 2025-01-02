import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs/promises';
import path from 'path';
import OpenAI from 'openai';
import youtubeDl, { create } from 'youtube-dl-exec';
import { TimestampText } from '@shared/types/api/schema';
import { VideoOptions } from '@shared/types/options';
import type { FfprobeData } from 'fluent-ffmpeg';
import 'dotenv/config';

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

/*
Video Processor with Timed Audio Pauses

Input Files:
- source.mp4: source video
- XXXX.mp3: Audio files where XXXX is timestamp in seconds (e.g., 0000.mp3 plays at 0:00)

Processing Logic:
1. Video plays synchronized with audio.m4a until reaching a timestamp marked by XXXX.mp3
2. At each XXXX timestamp:
  - Video frame pauses (stays visible) and main audio pauses
  - XXXX.mp3 plays completely over the paused frame
  - Video and main audio resume from paused position
3. Timestamps refer to original video time - if 0003.mp3 is 2s long and 0004.mp3 is 1s:
  - Video plays 0:00-0:03
  - Pauses for 2s for 0003.mp3
  - Plays 1s more (reaching 0:04 in original time)
  - Pauses for 1s for 0004.mp3
  - Continues to end

Output:
output.mp4 with duration = original_length + sum(overlay_audio_lengths)

Assumptions: 4-digit timestamp naming convention, valid audio files
*/

interface AudioOverlay {
	timestamp: string;
	timestampSeconds: number;
	duration: number;
	filepath: string;
}

function parseTimestamp(timestamp: string): number {
	return parseInt(timestamp, 10);
}

async function getMediaDuration(filepath: string): Promise<number> {
	return new Promise((resolve, reject) => {
		ffmpeg.ffprobe(filepath, (err: Error | null, metadata: FfprobeData) => {
			if (err) return reject(err);
			resolve(metadata.format.duration || 0);
		});
	});
}

async function findOverlayAudios(directory: string): Promise<AudioOverlay[]> {
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
	// first extract audio from video
	const audioPath = videoPath.replace(/\.[^/.]+$/, '.mp3');
	await extractAudio(videoPath, audioPath);

	// read the audio file
	const audioFile = await fs.readFile(audioPath);

	// create a file object from the audio buffer
	const audioBlob = new Blob([audioFile], { type: 'audio/mp3' });
	const file = new File([audioBlob], 'audio.mp3', { type: 'audio/mp3' });

	// call whisper api with srt format
	const transcript = await openai.audio.transcriptions.create({
		file: file,
		model: 'whisper-1',
		language: 'en',
		response_format: 'srt',
	});

	// write srt file
	await fs.writeFile(srtPath, transcript);

	// clean up temporary audio file
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

export async function generateVideo(id: string, audioIds: string[], options: VideoOptions): Promise<void> {
	console.log('Starting video generation process...');
	const projectDir = path.join('data', id);

	// ensure project directory exists
	await fs.mkdir(projectDir, { recursive: true });

	// Download source video if URL is provided in metadata
	const sourceVideoPath = path.join(projectDir, 'source.mp4');
	const pauseAudioPath = path.join(projectDir, 'pause.mp3');
	const outputPath = path.join(projectDir, 'output.mp4');

	try {
		// Process video with existing video processing logic
		await processVideo(sourceVideoPath, audioIds, outputPath, pauseAudioPath, options.video);

		console.log('Video generation completed successfully');
	} catch (error) {
		console.error('Error in video generation:', error);
		throw error;
	}
}

// Rename the old generateVideo to processVideo since it handles the actual processing
async function processVideo(
	sourceVideo: string,
	audioIds: string[],
	outputPath: string,
	pauseAudio: string,
	options: VideoOptions['video'],
) {
	console.log('Generating video...');
	const directory = path.dirname(sourceVideo);
	const overlays = await findOverlayAudios(directory);
	const originalVideoLength = await getMediaDuration(sourceVideo);

	return new Promise<string>((resolve, reject) => {
		const command = ffmpeg();
		command.input(sourceVideo);

		// add all overlay audio files as inputs
		overlays.forEach(o => command.input(o.filepath));

		// add pause sound as last input if enabled
		if (options.playSound) {
			command.input(pauseAudio);
		}

		const filterComplex: string[] = [];
		const streams: string[] = [];
		const pauseInputIndex = overlays.length + 1;

		// get scale filter based on size option
		const scaleFilter = getScaleFilter(options.size);

		// initial segment before first overlay (if there is one)
		if (overlays[0].timestampSeconds > 0) {
			filterComplex.push(`[0:v]trim=0:${overlays[0].timestampSeconds},setpts=PTS-STARTPTS${scaleFilter}[v0]`);
			filterComplex.push(`[0:a]atrim=0:${overlays[0].timestampSeconds},asetpts=PTS-STARTPTS[a0]`);
			streams.push('[v0][a0]');
		}

		// process each overlay and segment after it
		overlays.forEach((overlay, i) => {
			// freeze frame
			filterComplex.push(
				`[0:v]trim=${overlay.timestampSeconds}:${overlay.timestampSeconds + 0.04},setpts=PTS-STARTPTS,` +
					`tpad=stop_mode=clone:stop_duration=${overlay.duration + (options.playSound ? 0.5 : 0)}` +
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
			const nextTs = i < overlays.length - 1 ? overlays[i + 1].timestampSeconds : originalVideoLength;
			if (nextTs > overlay.timestampSeconds + 0.04) {
				filterComplex.push(
					`[0:v]trim=${overlay.timestampSeconds + 0.04}:${nextTs},setpts=PTS-STARTPTS${scaleFilter}[v${i + 1}]`,
				);
				filterComplex.push(`[0:a]atrim=${overlay.timestampSeconds + 0.04}:${nextTs},asetpts=PTS-STARTPTS[a${i + 1}]`);
				streams.push(`[v${i + 1}][a${i + 1}]`);
			}
		});

		// concatenate all segments
		filterComplex.push(`${streams.join('')}concat=n=${streams.length}:v=1:a=1[outv][outa]`);

		command
			.complexFilter(filterComplex, ['outv', 'outa'])
			.outputOptions(['-c:v', 'libx264', '-c:a', 'aac', '-vsync', '1', '-y'])
			.output(outputPath)
			.on('end', () => resolve(outputPath))
			.on('error', err => reject(err))
			.run();
	});
}
async function main() {
	try {
		const srtPath = 'subtitles.srt';
		const subtitledVideoPath = 'subtitled.mp4';

		// generate subtitles with whisper
		await generateSubtitles('source.mp4', srtPath);

		// add subtitles to video
		await addSubtitles('source.mp4', srtPath, subtitledVideoPath, 26);

		// continue with existing pause/overlay processing
		const output = await generateVideo(subtitledVideoPath, 'output.mp4', {
			bw: true,
			playSound: true,
			size: '720p',
			subtitlesEnabled: false,
		});

		// clean up intermediate files
		await fs.unlink(srtPath);
		await fs.unlink(subtitledVideoPath);
	} catch (err) {
		console.error('Failed:', err);
	}
}
