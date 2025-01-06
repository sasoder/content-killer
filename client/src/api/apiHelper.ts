import { VideoGenState, TimestampText, VideoMetadata, DescriptionGenerationStep } from '@shared/types/api/schema';
import { ProjectTemplate } from '@shared/types/options/template';
import { CommentaryOptions, DescriptionOptions, VideoOptions, Voice } from '@shared/types/options';
import { saveAs } from 'file-saver';

const API_BASE = import.meta.env.VITE_APP_API_BASE;

interface DescriptionGenerationProgress {
	type: 'progress' | 'complete' | 'error';
	step?: DescriptionGenerationStep;
	progress?: number;
	error?: string;
}

export async function startDescriptionGeneration(id: string, url: string, options: DescriptionOptions): Promise<void> {
	const response = await fetch(`${API_BASE}/generate/description/${id}/start`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ url, options }),
	});

	if (!response.ok) {
		throw new Error('Failed to start description generation');
	}
}

export function subscribeToDescriptionProgress(
	id: string,
	onProgress: (data: DescriptionGenerationProgress) => void,
): () => void {
	const eventSource = new EventSource(`${API_BASE}/generate/description/${id}/status`);

	eventSource.onmessage = event => {
		const data = JSON.parse(event.data);
		onProgress(data);
	};

	eventSource.onerror = () => {
		eventSource.close();
		onProgress({ type: 'error', error: 'EventSource connection failed' });
	};

	// Return cleanup function
	return () => eventSource.close();
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
		body: JSON.stringify({
			commentary,
			options,
		}),
	});
	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(errorData.error || 'Failed to generate video');
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

export async function fetchProjectTemplates(): Promise<ProjectTemplate[]> {
	const response = await fetch(`${API_BASE}/fetch/projectTemplates`);
	if (!response.ok) {
		throw new Error('Failed to fetch project templates');
	}
	return response.json();
}

export async function fetchProjectTemplate(id: string): Promise<ProjectTemplate> {
	const response = await fetch(`${API_BASE}/fetch/projectTemplate/${id}`);
	if (!response.ok) {
		throw new Error('Failed to fetch project template');
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

export async function createProjectTemplate(params?: {
	name?: string;
	description?: string;
}): Promise<ProjectTemplate> {
	const response = await fetch(`${API_BASE}/generate/projectTemplate`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(params || {}),
	});

	if (!response.ok) {
		throw new Error('Failed to create project template');
	}

	return response.json();
}

export async function updateProjectTemplate(template: ProjectTemplate): Promise<ProjectTemplate> {
	const response = await fetch(`${API_BASE}/update/projectTemplate/${template.id}`, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(template),
	});

	if (!response.ok) {
		throw new Error('Failed to update project template');
	}

	return response.json();
}

export async function deleteProjectTemplate(id: string): Promise<void> {
	const response = await fetch(`${API_BASE}/update/projectTemplate/${id}`, {
		method: 'DELETE',
	});

	if (!response.ok) {
		throw new Error('Failed to delete project template');
	}
}

export async function uploadPauseSound(templateId: string, file: File): Promise<{ filename: string }> {
	const formData = new FormData();
	formData.append('file', file);

	const response = await fetch(`${API_BASE}/update/projectTemplate/${templateId}/pauseSound`, {
		method: 'POST',
		body: formData,
	});

	if (!response.ok) {
		throw new Error('Failed to upload pause sound');
	}

	return response.json();
}

export async function createProjectWithTemplate(templateId: string): Promise<VideoGenState> {
	const response = await fetch(`${API_BASE}/generate/project`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ templateId }),
	});

	if (!response.ok) {
		throw new Error('Failed to create project');
	}

	return response.json();
}

export async function downloadFile(id: string, type: 'video' | 'audio'): Promise<void> {
	try {
		const response = await fetch(`${API_BASE}/fetch/download/${id}/${type}`);
		if (!response.ok) {
			throw new Error(`Failed to download ${type}: ${response.status} ${response.statusText}`);
		}

		const blob = await response.blob();
		const contentDisposition = response.headers.get('Content-Disposition');
		const filenameMatch = contentDisposition?.match(/filename="(.+?)"/);
		const filename = filenameMatch?.[1] || (type === 'video' ? `${id}.mp4` : `commentary-${id}.zip`);

		saveAs(blob, filename);
	} catch (error) {
		console.error('Download error:', error);
		throw error;
	}
}
