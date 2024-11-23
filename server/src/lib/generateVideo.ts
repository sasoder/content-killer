import { VideoOptions } from '@shared/types/options';
import { TimestampText } from '@shared/types/api/schema';
import { create } from 'youtube-dl-exec';
import ffmpeg from 'fluent-ffmpeg';
import { projectStorage } from '@/db/storage';
import path from 'path';

const ytDl = create(process.env.YT_DLP_PATH || 'yt-dlp');

export const generateVideo = async (
	id: string,
	commentary: TimestampText[],
	audioIds: string[],
	options: VideoOptions['video'],
	url: string,
): Promise<string> => {
	const videoPath = path.join('data', id, 'source.mp4');
	await ytDl(url, {
		output: videoPath,
		format: 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4',
		mergeOutputFormat: 'mp4',
	});

	let filterComplex = '[0:v]';
	let segments = '';

	const sortedCommentary = [...commentary].sort((a, b) => timeToSeconds(a.timestamp) - timeToSeconds(b.timestamp));

	// filter segments for each pause point
	for (let i = 0; i < sortedCommentary.length; i++) {
		const { timestamp } = sortedCommentary[i];
		const audioFile = `${timestamp.replace(':', '')}.mp3`;

		if (!audioIds.includes(audioFile)) continue;

		const seconds = timeToSeconds(timestamp);
		const audioPath = path.join('data', id, audioFile);
		const audioDuration = await getAudioDuration(audioPath);

		// split at timestamp, freeze frame, apply b&w if needed
		segments += `split[main${i}][freeze${i}];`;
		segments += `[freeze${i}]freeze,`;
		if (options.bw) {
			segments += `hue=s=0,`;
		}
		segments += `setpts=PTS-STARTPTS+${seconds}/TB[frozen${i}];`;

		// prepare for next iteration
		filterComplex += segments;
		filterComplex += `[main${i}]`;
		segments = '';
	}

	const outputPath = path.join('data', id, 'output.mp4');

	return new Promise((resolve, reject) => {
		const command = ffmpeg(videoPath);

		// add audio inputs
		audioIds.forEach(audioId => {
			command.input(path.join('data', id, audioId));
		});

		command
			.complexFilter(filterComplex)
			.outputOptions(['-c:v libx264', '-c:a aac'])
			.output(outputPath)
			.on('end', () => resolve('output.mp4'))
			.on('error', err => reject(err))
			.run();
	});
};

// convert timestamp (MM:SS) to seconds
function timeToSeconds(timestamp: string): number {
	const [minutes, seconds] = timestamp.split(':').map(Number);
	return minutes * 60 + seconds;
}

// get audio duration using ffprobe
function getAudioDuration(filepath: string): Promise<number> {
	return new Promise((resolve, reject) => {
		ffmpeg.ffprobe(filepath, (err, metadata) => {
			if (err) reject(err);
			resolve(metadata.format.duration || 0);
		});
	});
}
