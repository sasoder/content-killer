import { VideoOptions } from '@shared/types/options';
import { TimestampText } from '@shared/types/api/schema';
import { create } from 'youtube-dl-exec';
import ffmpeg from 'fluent-ffmpeg';
import { projectStorage } from '@/db/storage';
import path from 'path';

const ytDl = create(process.env.YT_DLP_PATH || 'yt-dlp');

/*
Video Processor with Timed Audio Pauses

Input Files:
- source.mp4: Silent source video
- audio.m4a: Main audio track for the source video
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
		ffmpeg.ffprobe(filepath, (err, metadata) => {
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

async function generateVideo(
	sourceVideo: string,
	outputPath: string,
	pauseAudio: string,
	options: { bw: boolean; playSound: boolean; size: '720p' | '1080p' | 'source' },
) {
	const directory = path.dirname(sourceVideo);
	const overlays = await findOverlayAudios(directory);
	const originalVideoLength = await getMediaDuration(sourceVideo);

	return new Promise<string>((resolve, reject) => {
		const command = ffmpeg();
		command.input(sourceVideo);
		overlays.forEach(o => command.input(o.filepath));

		const filterComplex: string[] = [];
		const streams: string[] = [];

		// output video size based on option
		const scaleFilter = getScaleFilter(options.size);

		// initial segment before first overlay (if there is one)
		if (overlays[0].timestampSeconds > 0) {
			filterComplex.push(`[0:v]trim=0:${overlays[0].timestampSeconds},setpts=PTS-STARTPTS${scaleFilter}[v0]`);
			filterComplex.push(`[0:a]atrim=0:${overlays[0].timestampSeconds},asetpts=PTS-STARTPTS[a0]`);
			streams.push('[v0][a0]');
		}

		// process each overlay and segment after it
		overlays.forEach((overlay, i) => {
			// freeze frame with overlay audio
			filterComplex.push(
				`[0:v]trim=${overlay.timestampSeconds}:${overlay.timestampSeconds + 0.04},setpts=PTS-STARTPTS,` +
					`tpad=stop_mode=clone:stop_duration=${overlay.duration}` +
					`${options.bw ? ',hue=s=0:b=0' : ''}${scaleFilter}[vf${i}]`,
			);
			filterComplex.push(`[${i + 1}:a]asetpts=PTS-STARTPTS[af${i}]`);
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
		const output = await generateVideo('source.mp4', 'output.mp4', 'pause.wav', {
			bw: true,
			playSound: true,
			size: '720p',
		});
		console.log('Done:', output);
	} catch (err) {
		console.error('Failed:', err);
	}
}

main();
