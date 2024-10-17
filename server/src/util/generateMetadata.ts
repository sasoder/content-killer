import { VideoMetadata } from '@shared/types/api/schema';
import youtubeDl, { create } from 'youtube-dl-exec';

require('dotenv').config();

const ytDl = create(process.env.YT_DLP_PATH || 'yt-dlp');

export const generateMetadata = async (url: string): Promise<VideoMetadata> => {
	try {
		console.log('Fetching metadata for URL:', url);

		const result = await ytDl(url, {
			dumpSingleJson: true,
			noCheckCertificates: true,
			noWarnings: true,
			preferFreeFormats: true,
			addHeader: ['referer:youtube.com', 'user-agent:googlebot'],
		});

		return {
			url,
			title: result.title as string,
			duration: result.duration_string as string,
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
