import { TimestampTextList, VideoOptions, VideoMetadata, DescriptionOptions } from '@/lib/schema';

export const generateDescription = async (url: string, options: DescriptionOptions): Promise<TimestampTextList> => {
	if (!url) {
		throw new Error('No URL provided');
	}
	const response = await fetch(`/api/generateDescription`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ url, options }),
	});
	if (!response.ok) {
		throw new Error('Failed to generate description');
	}
	const data = await response.json();

	return data.description;
};

export const generateCommentary = async (description: TimestampTextList | null): Promise<TimestampTextList> => {
	if (!description) {
		throw new Error('No description provided');
	}
	const response = await fetch(`/api/generateCommentary`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ description }),
	});
	if (!response.ok) {
		throw new Error('Failed to generate commentary');
	}
	const data = await response.json();
	return data.commentary;
};

export const generateVideo = async (
	commentaryData: TimestampTextList | null,
	audioData: string[] | null,
	options: VideoOptions,
): Promise<string> => {
	if (!commentaryData || !audioData) {
		throw new Error('No commentary or audio data provided');
	}
	const response = await fetch(`/api/generateVideo`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			commentaryData,
			audioData,
			options,
		}),
	});
	if (!response.ok) {
		throw new Error('Failed to generate video');
	}
	const data = await response.json();
	return data.videoUrl;
};

export const generateVideoMetadata = async (url: string): Promise<VideoMetadata> => {
	const response = await fetch(`/api/getVideoMetadata/${url}`, {
		method: 'GET',
		headers: { 'Content-Type': 'application/json' },
	});
	if (!response.ok) {
		throw new Error('Failed to generate video metadata');
	}
	const data = await response.json();
	return data.metadata;
};

export const fetchFile = async (id: string): Promise<Blob> => {
	const response = await fetch(`/api/fetchFile/${id}`, {
		method: 'GET',
		headers: { 'Content-Type': 'application/json' },
	});
	if (!response.ok) {
		throw new Error('Failed to fetch file');
	}
	return response.blob();
};

export const fetchFiles = async (ids: string[] | null): Promise<Blob[]> => {
	if (!ids) {
		throw new Error('No fileids provided');
	}
	const responses = await Promise.all(ids.map(id => fetchFile(id)));
	return responses;
};
