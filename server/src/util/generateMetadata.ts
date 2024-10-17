import { VideoMetadata } from '@shared/types/api/schema';
import YTDlpWrap from 'yt-dlp-wrap';

const ytDlpWrap = new YTDlpWrap();

export const generateMetadata = async (url: string): Promise<VideoMetadata> => {
	const info = await ytDlpWrap.getVideoInfo([url]);
	console.log(info);
	return {
		url,
		title: info.videoDetails.title,
		duration: info.videoDetails.duration,
	};
};
