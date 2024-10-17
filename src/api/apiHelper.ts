import { TimestampTextList, VideoMetadata } from '@shared/types/api';
import { CommentaryOptions, DescriptionOptions } from '@shared/types/options';
import { hc } from 'hono/client';
import { AppType } from '@shared/server/index';

const client = hc<AppType>(import.meta.env.VITE_APP_HONO_API_URL);

export const generateDescription = async (url: string, options: DescriptionOptions): Promise<TimestampTextList> => {
	if (!url) {
		throw new Error('No URL provided');
	}
	const res = await client.api.generate.description.$post({
		json: { url, options },
	});
	if (!res.ok) {
		throw new Error(`HTTP error! status: ${res.status}`);
	}
	return res.json() as Promise<TimestampTextList>;
};

export const generateMetadata = async (url: string): Promise<VideoMetadata> => {
	if (!url) {
		throw new Error('No URL provided');
	}
	const res = await client.api.generate.metadata.$post({
		json: { url },
	});
	if (!res.ok) {
		throw new Error(`HTTP error! status: ${res.status}`);
	}
	return res.json() as Promise<VideoMetadata>;
};

export const generateCommentary = async (
	description: TimestampTextList | null,
	options: CommentaryOptions,
): Promise<TimestampTextList> => {
	if (!description) {
		throw new Error('No description provided');
	}
	const response = await fetch(`/api/generateCommentary`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ description, options }),
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

export const fetchVideoGenState = async (id: string): Promise<VideoGenState> => {
	const response = await fetch(`/api/fetchVideoGenState/${id}`, {
		method: 'GET',
		headers: { 'Content-Type': 'application/json' },
	});
	if (!response.ok) {
		throw new Error('Failed to fetch video gen state');
	}
	const data = await response.json();
	return data.videoGenState;
};

export const fetchVideoIds = async (): Promise<string[]> => {
	const response = await fetch(`/api/fetchVideoIds`, {
		method: 'GET',
		headers: { 'Content-Type': 'application/json' },
	});
	if (!response.ok) {
		throw new Error('Failed to fetch video ids');
	}
	return response.json();
};

export const fetchFiles = async (ids: string[] | null): Promise<Blob[]> => {
	if (!ids) {
		throw new Error('No fileids provided');
	}
	const responses = await Promise.all(ids.map(id => fetchFile(id)));
	return responses;
};
