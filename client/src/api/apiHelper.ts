import { TimestampText, VideoGenState, VideoMetadata } from '@shared/types/api/schema';
import { CommentaryOptions, DescriptionOptions, VideoOptions } from '@shared/types/options';
import { hc } from 'hono/client';
import { AppType } from '@shared/server/index';

const client = hc<AppType>(import.meta.env.VITE_APP_HONO_API_URL);

export const createProject = async (): Promise<VideoGenState> => {
	const res = await client.api.generate.project.$post({
		json: {},
	});
	if (!res.ok) {
		throw new Error('Failed to create project');
	}
	const data = await res.json();
	return data as VideoGenState;
};

export const generateDescription = async (
	id: string,
	url: string,
	options: DescriptionOptions,
): Promise<TimestampText[]> => {
	const res = await client.api.generate.description[':id'].$post({
		param: {
			id,
		},
		json: { url: url.length > 0 ? url : 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', options },
	});
	if (!res.ok) {
		throw new Error(`${res.status} ${res.statusText}`);
	}
	return res.json() as Promise<TimestampText[]>;
};

export const generateMetadata = async (id: string, url: string): Promise<VideoMetadata> => {
	if (!url) {
		throw new Error('No URL provided');
	}
	const res = await client.api.generate.metadata[id].$post({
		json: { url },
	});
	if (!res.ok) {
		throw new Error(`${res.status} ${res.statusText}`);
	}
	return res.json() as Promise<VideoMetadata>;
};

export const generateCommentary = async (
	id: string,
	description: TimestampText[],
	options: CommentaryOptions,
): Promise<TimestampText[]> => {
	const res = await client.api.generate.commentary[':id'].$post({
		param: {
			id,
		},
		json: { description, options },
	});
	if (!res.ok) {
		throw new Error(`${res.status} ${res.statusText}`);
	}
	return res.json() as Promise<TimestampText[]>;
};

export const generateVideo = async (
	id: string,
	commentary: TimestampText[],
	options: VideoOptions,
): Promise<{ videoId: string; audioIds: string[] }> => {
	if (!commentary) {
		throw new Error('No commentary data provided');
	}
	const res = await client.api.generate.video[':id'].$post({
		param: {
			id,
		},
		json: { commentary, options },
	});
	if (!res.ok) {
		throw new Error(`${res.status} ${res.statusText}`);
	}
	const data = await res.json();
	console.log(data);
	return { videoId: data.videoId as string, audioIds: data.audioIds as string[] };
};

export const fetchVideoGenState = async (id: string): Promise<VideoGenState> => {
	const res = await client.api.fetch.videoGenState[':id'].$get({
		param: {
			id,
		},
	});
	if (!res.ok) {
		throw new Error(`${res.status} ${res.statusText}`);
	}
	return res.json() as Promise<VideoGenState>;
};

export const createVideoGenState = async (id: string): Promise<VideoGenState> => {
	const res = await client.api.createVideoGenState[':id'].$post({
		param: {
			id,
		},
		json: { id },
	});
	if (!res.ok) {
		throw new Error(`${res.status} ${res.statusText}`);
	}
	return res.json() as Promise<VideoGenState>;
};

export const fetchAllVideoGenStates = async (): Promise<VideoGenState[]> => {
	const res = await client.api.fetch.videoGenStates.$get({
		headers: { 'Content-Type': 'application/json' },
	});
	if (!res.ok) {
		throw new Error(`${res.status} ${res.statusText}`);
	}
	return res.json() as Promise<VideoGenState[]>;
};

export const fetchFile = async (id: string): Promise<Blob> => {
	const res = await client.api.fetch.file[':id'].$get({
		param: {
			id,
		},
	});
	if (!res.ok) {
		throw new Error(`${res.status} ${res.statusText}`);
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
