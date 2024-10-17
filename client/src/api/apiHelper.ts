import { TimestampTextList, VideoGenState, VideoMetadata } from '@shared/types/api/schema';
import { CommentaryOptions, DescriptionOptions, VideoOptions } from '@shared/types/options';
import { hc } from 'hono/client';
import { AppType } from '@shared/server/index';

const client = hc<AppType>(import.meta.env.VITE_APP_HONO_API_URL);

export const generateDescription = async (
	id: string,
	url: string,
	options: DescriptionOptions,
): Promise<TimestampTextList> => {
	const res = await client.api.generate.description[id].$post({
		json: { url: url.length > 0 ? url : 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', options },
	});
	if (!res.ok) {
		throw new Error(`HTTP error! status: ${res.status}`);
	}
	return res.json() as Promise<TimestampTextList>;
};

export const generateMetadata = async (id: string, url: string): Promise<VideoMetadata> => {
	if (!url) {
		throw new Error('No URL provided');
	}
	const res = await client.api.generate.metadata[id].$post({
		json: { url },
	});
	if (!res.ok) {
		throw new Error(`HTTP error! status: ${res.status}`);
	}
	return res.json() as Promise<VideoMetadata>;
};

export const generateCommentary = async (
	id: string,
	description: TimestampTextList,
	options: CommentaryOptions,
): Promise<TimestampTextList> => {
	const res = await client.api.generate.commentary[id].$post({
		json: { description, options },
	});
	if (!res.ok) {
		throw new Error(`HTTP error! status: ${res.status}`);
	}
	return res.json() as Promise<TimestampTextList>;
};

export const generateVideo = async (
	id: string,
	commentaryData: TimestampTextList,
	options: VideoOptions,
): Promise<string> => {
	if (!commentaryData) {
		throw new Error('No commentary data provided');
	}
	const res = await client.api.generate.video[id].$post({
		json: { commentaryData, options },
	});
	if (!res.ok) {
		throw new Error(`HTTP error! status: ${res.status}`);
	}
	return res.json() as Promise<string>;
};

export const fetchVideoGenState = async (id: string): Promise<VideoGenState> => {
	const res = await client.api.fetch.videoGenState[id].$get({
		query: { id },
	});
	if (!res.ok) {
		throw new Error('Failed to fetch video gen state');
	}
	return res.json() as Promise<VideoGenState>;
};

export const createVideoGenState = async (id: string): Promise<VideoGenState> => {
	const res = await client.api.createVideoGenState[id].$post({
		json: { id },
	});
	if (!res.ok) {
		throw new Error('Failed to create video gen state');
	}
	return res.json() as Promise<VideoGenState>;
};

export const fetchVideoIds = async (): Promise<string[]> => {
	const res = await client.api.fetch.videoIds.$get({
		headers: { 'Content-Type': 'application/json' },
	});
	if (!res.ok) {
		throw new Error('Failed to fetch video ids');
	}
	return res.json() as Promise<string[]>;
};

export const fetchFile = async (id: string): Promise<Blob> => {
	const res = await client.api.fetchFile.$get({
		query: { id },
	});
	if (!res.ok) {
		throw new Error('Failed to fetch file');
	}
	return res.blob();
};

export const fetchFiles = async (ids: string[] | null): Promise<Blob[]> => {
	if (!ids) {
		throw new Error('No fileids provided');
	}
	const responses = await Promise.all(ids.map(id => fetchFile(id)));
	return responses;
};
