import { hc } from 'hono/client';
import type { RouterType } from '@server/routes';
import type { DescriptionGenerationStep, Project, TimestampText, Metadata, Voice } from '@shared/types/api/schema';
import type { ProjectTemplate } from '@shared/types/options/template';
import type { CommentaryOptions, DescriptionOptions, VideoOptions } from '@shared/types/options';

const API_BASE = import.meta.env.VITE_APP_API_BASE;
export const client = hc<RouterType>(API_BASE);

async function handleResponse<T>(response: Response): Promise<T> {
	const data = await response.json();
	if ('error' in data) {
		throw new Error(data.error);
	}
	return data as T;
}

export const fetchProjects = async (): Promise<Project[]> => {
	const response = await client.fetch.projects.$get();
	return handleResponse<Project[]>(response);
};

export const fetchProject = async (id: string): Promise<Project> => {
	const response = await client.fetch.project[':id'].$get({ param: { id } });
	return handleResponse<Project>(response);
};

export async function getVideoGenerationStatus(id: string) {
	const response = await client.generate.video[':id'].status.$get({
		param: { id },
	});
	return response.json();
}

export const fetchProjectTemplates = async (): Promise<ProjectTemplate[]> => {
	const response = await client.fetch.projectTemplates.$get();
	return handleResponse<ProjectTemplate[]>(response);
};

export const fetchProjectTemplate = async (id: string): Promise<ProjectTemplate> => {
	const response = await client.fetch.projectTemplate[':id'].$get({ param: { id } });
	return handleResponse<ProjectTemplate>(response);
};

export const fetchVoices = async (): Promise<Voice[]> => {
	const response = await client.fetch.voices.$get();
	return handleResponse<Voice[]>(response);
};

export const startDescriptionGeneration = async (
	id: string,
	url: string,
	options: DescriptionOptions,
): Promise<void> => {
	const response = await client.generate.description[':id'].start.$post({
		param: { id },
		json: { url, options },
	});
	await handleResponse<{ success: true }>(response);
};

// SSE Helper Types
type SSEOptions = {
	withCredentials?: boolean;
	onMessage?: (data: any) => void;
	onError?: (error: any) => void;
	onOpen?: () => void;
	retryInterval?: number;
	maxRetries?: number;
};

type SSEConnection = {
	close: () => void;
	isConnected: () => boolean;
};

export function createSSEConnection(url: string, options: SSEOptions = {}): SSEConnection {
	const { withCredentials = true, onMessage, onError, onOpen, retryInterval = 1000, maxRetries = 5 } = options;

	let eventSource: EventSource | null = null;
	let retryCount = 0;
	let retryTimeout: NodeJS.Timeout | null = null;
	let isClosed = false;

	const connect = () => {
		if (isClosed || (maxRetries !== -1 && retryCount >= maxRetries)) {
			return;
		}

		eventSource = new EventSource(url, { withCredentials });

		eventSource.onmessage = event => {
			try {
				const data = JSON.parse(event.data);
				onMessage?.(data);
			} catch (error) {
				console.error('Error parsing SSE message:', error);
				onError?.(error);
			}
		};

		eventSource.onopen = () => {
			retryCount = 0;
			onOpen?.();
		};

		eventSource.onerror = error => {
			eventSource?.close();
			eventSource = null;

			if (!isClosed) {
				onError?.(error);
				retryCount++;

				if (maxRetries === -1 || retryCount < maxRetries) {
					retryTimeout = setTimeout(connect, retryInterval);
				}
			}
		};
	};

	connect();

	return {
		close: () => {
			isClosed = true;
			if (retryTimeout) {
				clearTimeout(retryTimeout);
			}
			eventSource?.close();
			eventSource = null;
		},
		isConnected: () => eventSource?.readyState === EventSource.OPEN,
	};
}

// Update the existing subscribeToDescriptionProgress to use the new helper
export function subscribeToDescriptionProgress(
	id: string,
	onProgress: (data: {
		type: 'progress' | 'complete' | 'error';
		step?: DescriptionGenerationStep;
		progress?: number;
		error?: string;
	}) => void,
): () => void {
	const connection = createSSEConnection(`${API_BASE}/generate/description/${id}/status`, {
		onMessage: data => onProgress(data),
		onError: error => onProgress({ type: 'error', error: 'EventSource connection failed' }),
		maxRetries: -1, // Unlimited retries
	});

	return () => connection.close();
}

export const generateMetadata = async (id: string, url: string): Promise<Metadata> => {
	const response = await client.generate.metadata[':id'].$post({
		param: { id },
		json: { url },
	});
	return handleResponse<Metadata>(response);
};

export const generateCommentary = async (
	id: string,
	description: TimestampText[],
	options: CommentaryOptions,
): Promise<TimestampText[]> => {
	const response = await client.generate.commentary[':id'].$post({
		param: { id },
		json: { description, options },
	});
	return handleResponse<TimestampText[]>(response);
};

export async function generateVideo(id: string, commentary: TimestampText[], options: VideoOptions) {
	const response = await client.generate.video[':id'].start.$post({
		param: { id },
		json: { commentary, options },
	});
	return response.json();
}

export const createProjectTemplate = async (params?: {
	name?: string;
	description?: string;
}): Promise<ProjectTemplate> => {
	const response = await client.generate.projectTemplate.$post({
		json: params,
	});
	return handleResponse<ProjectTemplate>(response);
};

export const updateProjectTemplate = async (template: ProjectTemplate): Promise<ProjectTemplate> => {
	const response = await client.update.projectTemplate[':id'].$put({
		param: { id: template.id },
		json: template,
	});
	return handleResponse<ProjectTemplate>(response);
};

export const deleteProjectTemplate = async (id: string): Promise<void> => {
	const response = await client.update.projectTemplate[':id'].$delete({
		param: { id },
	});
	await handleResponse<{ success: true }>(response);
};

export const uploadPauseSound = async (templateId: string, file: File): Promise<{ filename: string }> => {
	const formData = new FormData();
	formData.append('file', file);

	const response = await client.update.projectTemplate[':id'].pauseSound.$post({
		param: { id: templateId },
		form: { file },
	});
	return handleResponse<{ filename: string }>(response);
};

export const createProjectWithTemplate = async (templateId: string): Promise<Project> => {
	const response = await client.generate.project.$post({
		json: { templateId },
	});
	return handleResponse<Project>(response);
};

export const updateData = async (id: string, data: any): Promise<void> => {
	const response = await client.update.project[':id'].$put({
		param: { id },
		json: { data },
	});
	await handleResponse<{ success: true }>(response);
};

export const downloadFile = async (id: string, type: 'video' | 'audio'): Promise<Blob> => {
	const response = await client.fetch.project[':id'].download[':type'].$get({
		param: { id, type },
	});
	return response.blob();
};
