import youtubedl, { create } from 'youtube-dl-exec';
import { VideoMetadata } from '@shared/types/api/schema';
import dotenv from 'dotenv';
import path from 'path';
import { projectStorage } from '@/db/storage';

const DATA_DIR = './data';

dotenv.config();

const getYoutubeDl = () => {
	return process.env.YT_DLP_PATH ? create(process.env.YT_DLP_PATH) : youtubedl;
};

export const downloadVideoMetadata = async (url: string): Promise<Partial<VideoMetadata>> => {
	try {
		const ytDl = getYoutubeDl();
		const result = (await ytDl(url, {
			dumpSingleJson: true,
			noCheckCertificates: true,
			noWarnings: true,
			preferFreeFormats: true,
			addHeader: ['referer:youtube.com', 'user-agent:googlebot'],
		})) as any;

		return {
			title: result.title,
			duration: result.duration,
		};
	} catch (error) {
		console.error('Error fetching video metadata:', error);
		if (error instanceof Error) {
			console.error('Error message:', error.message);
			console.error('Error stack:', error.stack);
		}
		throw error;
	}
};

export const downloadVideo = async (
	url: string,
	projectId: string,
	onProgress?: (progress: number) => void,
): Promise<string> => {
	try {
		const ytDl = getYoutubeDl();
		const outputPath = path.join(DATA_DIR, projectId, 'source.mp4');

		// Create subprocess
		const subprocess = ytDl.exec(url, {
			format: 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
			output: outputPath,
			mergeOutputFormat: 'mp4',
		});

		// Parse progress from stderr
		subprocess.stderr?.on('data', (data: Buffer) => {
			const line = data.toString();
			const match = line.match(/\[download\]\s+(\d+\.?\d*)%/);
			if (match && onProgress) {
				const percent = parseFloat(match[1]);
				onProgress(percent);
			}
		});

		// Wait for process to complete
		await subprocess;
		return outputPath;
	} catch (error) {
		console.error('Error downloading video:', error);
		if (error instanceof Error) {
			console.error('Error message:', error.message);
			console.error('Error stack:', error.stack);
		}
		throw error;
	}
};
