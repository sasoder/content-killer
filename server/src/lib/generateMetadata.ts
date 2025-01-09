import { Metadata } from '@shared/types/api/schema';
import { downloadVideoMetadata } from './downloadVideo';

export const generateMetadata = async (url: string): Promise<Partial<Metadata>> => {
	return downloadVideoMetadata(url);
};
