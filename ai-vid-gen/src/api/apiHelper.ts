import {
	TimestampTextList,
	DescriptionOptions,
	CommentaryOptions,
	AudioOptions,
	FileResponse,
	VideoOptions,
} from '@/lib/schema';
import JSZip from 'jszip';
import saveAs from 'file-saver';
import { GeneratedDataType } from '@/lib/types';

const FASTAPI_URL = import.meta.env.VITE_FASTAPI_URL || 'http://localhost:8000';

export const generateDescription = async (
	url: string,
	options?: DescriptionOptions,
): Promise<TimestampTextList> => {
	const response = await fetch(`${FASTAPI_URL}/api/generate_description`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ url, options }),
	});

	if (!response.ok) {
		throw new Error('Failed to generate description');
	}

	const data = await response.json();
	return data as TimestampTextList;
};

export const generateCommentary = async (
	items: TimestampTextList,
	options?: CommentaryOptions,
): Promise<TimestampTextList> => {
	const response = await fetch(`${FASTAPI_URL}/api/generate_commentary`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ items, options }),
	});

	if (!response.ok) {
		throw new Error('Failed to generate commentary');
	}

	const data = await response.json();
	return data as TimestampTextList;
};

export const generateAudio = async (
	items: TimestampTextList,
	options?: AudioOptions,
): Promise<FileResponse> => {
	const response = await fetch(`${FASTAPI_URL}/api/generate_audio`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ items, options }),
	});

	if (!response.ok) {
		throw new Error('Failed to generate audio');
	}

	const data = await response.json();
	return data as FileResponse;
};

// New Video Generation Function
export const generateVideo = async (
	items: TimestampTextList,
	options: VideoOptions,
): Promise<VideoOptions> => {
	const response = await fetch(`${FASTAPI_URL}/api/generate_video`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ items, options }),
	});

	if (!response.ok) {
		throw new Error('Failed to generate video');
	}

	const data = await response.json();
	return data as VideoOptions;
};

export const fetchExistingData = async (type: GeneratedDataType) => {
	const response = await fetch(`${FASTAPI_URL}/api/get_${type}`);
	if (!response.ok) {
		throw new Error('Failed to fetch data');
	}
	return response.json();
};

export const getAudioClip = async (filename: string): Promise<Blob> => {
	const response = await fetch(
		`${FASTAPI_URL}/api/get_audio_clip/${filename}`,
		{
			method: 'GET',
		},
	);

	if (!response.ok) {
		throw new Error('Failed to fetch audio clip');
	}

	return response.blob();
};

export const downloadAll = async (files: FileResponse) => {
	const audioClips = await Promise.all(
		files.items.map(file => getAudioClip(file)),
	);
	const zip = new JSZip();
	audioClips.forEach((clip, index) => {
		zip.file(`audio_${index}.mp3`, clip);
	});
	const blob = await zip.generateAsync({ type: 'blob' });
	saveAs(blob, 'audio.zip');
};
