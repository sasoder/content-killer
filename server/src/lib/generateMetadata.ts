import { VideoMetadata } from '@shared/types/api/schema';
import youtubeDl, { create } from 'youtube-dl-exec';
import 'dotenv/config';

export const generateMetadata = async (url: string): Promise<Partial<VideoMetadata>> => {
	try {
		//check if there is a youtube-dl binary specified in the environment variables
		if (process.env.YT_DLP_PATH) {
			const result = (await create(process.env.YT_DLP_PATH as string)(url, {
				dumpSingleJson: true,
				noCheckCertificates: true,
				noWarnings: true,
				preferFreeFormats: true,
				addHeader: ['referer:youtube.com', 'user-agent:googlebot'],
			})) as any;
			return {
				title: result.title,
				duration: result.duration_string,
			};
		} else {
			const result = (await youtubeDl(url, {
				dumpSingleJson: true,
				noCheckCertificates: true,
				noWarnings: true,
				preferFreeFormats: true,
				addHeader: ['referer:youtube.com', 'user-agent:googlebot'],
			})) as any;
			return {
				title: result.title,
				duration: result.duration_string,
			};
		}
	} catch (error) {
		console.error('Error fetching video metadata:', error);
		if (error instanceof Error) {
			console.error('Error message:', error.message);
			console.error('Error stack:', error.stack);
		}
		throw error;
	}
};
