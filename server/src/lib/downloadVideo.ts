import YTDlpWrap, { Progress } from 'yt-dlp-wrap';
import { Metadata } from '@content-killer/shared';
import dotenv from 'dotenv';
import path from 'path';
import { PROJECTS_DIR } from '@/db/storage';

dotenv.config();

const getYtDlp = () => {
	return new YTDlpWrap(process.env.YT_DLP_PATH);
};

export const downloadVideoMetadata = async (url: string): Promise<Partial<Metadata>> => {
	try {
		const ytDlp = getYtDlp();
		const result = await ytDlp.getVideoInfo(url);

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
		const ytDlp = getYtDlp();
		const outputPath = path.join(PROJECTS_DIR, projectId, 'video', 'source.mkv');

		let isDownloadingAudio = false;
		let lastReportedProgress = 0;
		let lastPercent = 0;

		const ytDlpEmitter = ytDlp.exec([
			url,
			'--format',
			'bv*+ba/b',
			'--output',
			outputPath,
			'--merge-output-format',
			'mkv',
			'--newline',
		]);

		ytDlpEmitter.on('progress', (progress: Progress) => {
			if (!onProgress || !progress.percent) return;

			const percent = progress.percent;

			if (lastPercent > 80 && percent < 20) {
				isDownloadingAudio = true;
			}
			lastPercent = percent;

			const scaledProgress = isDownloadingAudio ? 90 + percent * 0.05 : percent * 0.9;

			if (Math.abs(scaledProgress - lastReportedProgress) > 0.5) {
				lastReportedProgress = scaledProgress;
				onProgress(Math.round(scaledProgress));
			}
		});

		return new Promise((resolve, reject) => {
			ytDlpEmitter.on('close', () => {
				if (onProgress) {
					onProgress(100);
				}
				resolve(outputPath);
			});

			ytDlpEmitter.on('error', error => {
				reject(error);
			});
		});
	} catch (error) {
		console.error('Error downloading video:', error);
		if (error instanceof Error) {
			console.error('Error message:', error.message);
			console.error('Error stack:', error.stack);
		}
		throw error;
	}
};
