import { VideoGenState, TimestampText, VideoMetadata } from '@shared/types/api/schema';
import { OptionConfig } from '@shared/types/options/config';
import { CommentaryOptions, DescriptionOptions, VideoOptions, Voice } from '@shared/types/options';

const API_BASE = import.meta.env.VITE_APP_API_BASE;

export async function createProject(): Promise<VideoGenState> {
	const response = await fetch(`${API_BASE}/generate/project`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({}),
	});
	if (!response.ok) {
		throw new Error('Failed to create project');
	}
	return response.json();
}

export async function generateDescription(
	id: string,
	url: string,
	options: DescriptionOptions,
): Promise<TimestampText[]> {
	const response = await fetch(`${API_BASE}/generate/description/${id}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ url, options }),
	});
	if (!response.ok) {
		throw new Error('Failed to generate description');
	}
	return response.json();
}

export async function generateMetadata(id: string, url: string): Promise<VideoMetadata> {
	if (!url) {
		throw new Error('No URL provided');
	}
	const response = await fetch(`${API_BASE}/generate/metadata/${id}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ url }),
	});
	if (!response.ok) {
		throw new Error('Failed to generate metadata');
	}
	return response.json();
}

export async function generateCommentary(
	id: string,
	description: TimestampText[],
	options: CommentaryOptions,
): Promise<TimestampText[]> {
	const response = await fetch(`${API_BASE}/generate/commentary/${id}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ description, options }),
	});
	if (!response.ok) {
		throw new Error('Failed to generate commentary');
	}
	return response.json();
}

export async function generateVideo(
	id: string,
	commentary: TimestampText[],
	options: VideoOptions,
): Promise<{ videoId: string; audioIds: string[] }> {
	if (!commentary) {
		throw new Error('No commentary data provided');
	}
	const response = await fetch(`${API_BASE}/generate/video/${id}`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ commentary, options }),
	});
	if (!response.ok) {
		throw new Error('Failed to generate video');
	}
	return response.json();
}

export async function fetchVideoGenState(id: string): Promise<VideoGenState> {
	const response = await fetch(`${API_BASE}/fetch/videoGenState/${id}`);
	if (!response.ok) {
		throw new Error('Failed to fetch video gen state');
	}
	return response.json();
}

export async function fetchAllVideoGenStates(): Promise<VideoGenState[]> {
	const response = await fetch(`${API_BASE}/fetch/videoGenStates`);
	console.log('response', response);
	if (!response.ok) {
		throw new Error('Failed to fetch video gen states');
	}
	return response.json();
}

export async function fetchFile(fileName: string): Promise<File> {
	const response = await fetch(`${API_BASE}/fetch/file/${fileName}`);
	if (!response.ok) {
		throw new Error('Failed to fetch file');
	}
	const blob = await response.blob();
	return new File([blob], fileName, { type: blob.type });
}

export async function fetchFiles(fileNames: string[]): Promise<File[]> {
	const files = await Promise.all(fileNames.map(fileName => fetchFile(fileName)));
	return files;
}

export async function fetchOptionConfigs(): Promise<OptionConfig[]> {
	console.log('fetching configs');
	const response = await fetch(`${API_BASE}/fetch/optionConfigs`);
	if (!response.ok) {
		throw new Error('Failed to fetch option configs');
	}
	return response.json();
}

export async function fetchOptionConfig(id: string): Promise<OptionConfig> {
	const response = await fetch(`${API_BASE}/fetch/optionConfig/${id}`);
	if (!response.ok) {
		throw new Error('Failed to fetch option config');
	}
	return response.json();
}

export async function fetchVoices(): Promise<Voice[]> {
	const response = await fetch(`${API_BASE}/fetch/voices`);
	if (!response.ok) {
		throw new Error('Failed to fetch voices');
	}
	return response.json();
}

export async function createOptionConfig(config: Omit<OptionConfig, 'id' | 'createdAt'>): Promise<OptionConfig> {
	const newConfig: OptionConfig = {
		...config,
		id: crypto.randomUUID(),
		createdAt: new Date().toISOString(),
	};

	const response = await fetch(`${API_BASE}/fetch/optionConfig`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(newConfig),
	});

	if (!response.ok) {
		throw new Error('Failed to create option config');
	}

	return response.json();
}

export async function updateOptionConfig(config: OptionConfig): Promise<OptionConfig> {
	const response = await fetch(`${API_BASE}/update/optionConfig/${config.id}`, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(config),
	});

	if (!response.ok) {
		throw new Error('Failed to update option config');
	}

	return response.json();
}

export async function deleteOptionConfig(id: string): Promise<void> {
	const response = await fetch(`${API_BASE}/update/optionConfig/${id}`, {
		method: 'DELETE',
	});

	if (!response.ok) {
		throw new Error('Failed to delete option config');
	}
}

export async function uploadPauseSound(configId: string, file: File): Promise<string> {
	const formData = new FormData();
	formData.append('file', file);

	const response = await fetch(`${API_BASE}/update/optionConfig/${configId}/pauseSound`, {
		method: 'POST',
		body: formData,
		// Important: Do not set Content-Type header, let the browser set it with the boundary
	});

	if (!response.ok) {
		throw new Error('Failed to upload pause sound');
	}

	const data = await response.json();
	return data.fileName;
}

export async function createProjectWithConfig(configId: string): Promise<VideoGenState> {
	const response = await fetch(`${API_BASE}/generate/project`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ configId }),
	});

	if (!response.ok) {
		throw new Error('Failed to create project');
	}

	return response.json();
}

export async function downloadFile(id: string, type: 'video' | 'audio'): Promise<void> {
	const response = await fetch(`${API_BASE}/fetch/download/${id}/${type}`);
	if (!response.ok) {
		throw new Error(`Failed to download ${type}`);
	}

	// Get filename from Content-Disposition header or use a default
	const contentDisposition = response.headers.get('Content-Disposition');
	const filename = contentDisposition
		? contentDisposition.split('filename=')[1].replace(/"/g, '')
		: `${type}-${id}.${type === 'video' ? 'mp4' : 'mp3'}`;

	const blob = await response.blob();
	const url = window.URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	window.URL.revokeObjectURL(url);
	document.body.removeChild(a);
}
