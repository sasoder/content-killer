import youtubedl, { create } from 'youtube-dl-exec';
import { Metadata } from '@shared/types/api/schema';
import dotenv from 'dotenv';
import path from 'path';
import { spawn } from 'child_process';
import { PROJECTS_DIR } from '@/db/storage';

dotenv.config();

const getYoutubeDl = () => {
	return process.env.YT_DLP_PATH ? create(process.env.YT_DLP_PATH) : youtubedl;
};

export const downloadVideoMetadata = async (url: string): Promise<Partial<Metadata>> => {
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
		const outputPath = path.join(PROJECTS_DIR, projectId, 'video', 'source.mp4');
		const ytDlPath = process.env.YT_DLP_PATH || 'yt-dlp';

		let isDownloadingAudio = false;
		let lastReportedProgress = 0;

		// Create subprocess using spawn directly
		const subprocess = spawn(ytDlPath, [
			url,
			'--format',
			'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
			'--output',
			outputPath,
			'--merge-output-format',
			'mp4',
			'--newline', // Force progress on new lines
		]);

		let buffer = '';
		const processLine = (line: string) => {
			// Check for audio download start
			if (line.includes('.m4a')) {
				isDownloadingAudio = true;
				lastReportedProgress = 90;
				if (onProgress) onProgress(90);
				return;
			}

			// Check for merger phase
			if (line.includes('[Merger]')) {
				if (onProgress) onProgress(100);
				return;
			}

			// Parse download progress
			const downloadMatch = line.match(/\[download\]\s+(\d+(?:\.\d+)?)%/);
			if (downloadMatch && onProgress) {
				const percent = parseFloat(downloadMatch[1]);
				const scaledProgress = isDownloadingAudio
					? 90 + percent * 0.05 // Scale audio progress from 90-95%
					: percent * 0.9; // Scale video progress from 0-90%

				if (Math.abs(scaledProgress - lastReportedProgress) > 0.5) {
					lastReportedProgress = scaledProgress;
					onProgress(Math.round(scaledProgress));
				}
			}
		};

		// Handle stdout for phase changes
		subprocess.stdout.on('data', (data: Buffer) => {
			const lines = data.toString().split('\n');
			lines.forEach(line => {
				if (line.trim()) processLine(line.trim());
			});
		});

		// Handle stderr for progress updates
		subprocess.stderr.on('data', (data: Buffer) => {
			buffer += data.toString();
			const lines = buffer.split('\n');

			// Keep the last incomplete line in the buffer
			buffer = lines.pop() || '';

			// Process complete lines
			lines.forEach(line => {
				if (line.trim()) processLine(line.trim());
			});
		});

		// Wait for process to complete
		return new Promise((resolve, reject) => {
			subprocess.on('close', (code: number | null) => {
				if (code === 0) {
					if (onProgress) {
						onProgress(100);
					}
					resolve(outputPath);
				} else {
					reject(new Error(`Process exited with code ${code}`));
				}
			});

			subprocess.on('error', (err: Error) => {
				reject(err);
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
