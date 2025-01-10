import { hc } from 'hono/client';
import type { RouterType } from '@server/routes';
import type {
	DescriptionGenerationStep,
	Project,
	TimestampText,
	Metadata,
	Voice,
	VideoGenerationState,
	DescriptionGenerationState,
} from '@shared/types/api/schema';
import type { Template } from '@shared/types/options/template';
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

export const getVideoGenerationStatus = async (id: string) => {
	const response = await client.generate.video[':id'].status.$get({
		param: { id },
	});
	return handleResponse<VideoGenerationState>(response);
};

export const getDescriptionGenerationStatus = async (id: string) => {
	const response = await client.generate.description[':id'].status.$get({
		param: { id },
	});
	return handleResponse<DescriptionGenerationState>(response);
};

export const fetchTemplates = async (): Promise<Template[]> => {
	const response = await client.fetch.templates.$get();
	return handleResponse<Template[]>(response);
};

export const fetchTemplate = async (id: string): Promise<Template> => {
	const response = await client.fetch.template[':id'].$get({ param: { id } });
	return handleResponse<Template>(response);
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

export const generateCommentary = async (id: string, options: CommentaryOptions): Promise<TimestampText[]> => {
	const response = await client.generate.commentary[':id'].$post({
		param: { id },
		json: { options },
	});
	return handleResponse<TimestampText[]>(response);
};

export async function generateVideo(id: string, options: VideoOptions) {
	const response = await client.generate.video[':id'].start.$post({
		param: { id },
		json: { options },
	});
	return response.json();
}

export const createTemplate = async (params?: { name?: string; description?: string }): Promise<Template> => {
	const response = await client.generate.template.$post({
		json: params,
	});
	return handleResponse<Template>(response);
};

export const updateTemplate = async (template: Template): Promise<Template> => {
	const response = await client.update.template[':id'].$put({
		param: { id: template.id },
		json: template,
	});
	return handleResponse<Template>(response);
};

export const deleteTemplate = async (id: string): Promise<void> => {
	const response = await client.update.template[':id'].$delete({
		param: { id },
	});
	await handleResponse<{ success: true }>(response);
};

export const uploadPauseSound = async (templateId: string, file: File): Promise<{ filename: string }> => {
	const formData = new FormData();
	formData.append('file', file);

	const response = await client.update.template[':id'].pauseSound.$post({
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

export const updateProjectDescription = async (id: string, description: TimestampText[]): Promise<void> => {
	const response = await client.update.project[':id'].description.$put({
		param: { id },
		json: description,
	});
	return handleResponse<void>(response);
};

export const updateProjectCommentary = async (id: string, commentary: TimestampText[]): Promise<void> => {
	const response = await client.update.project[':id'].commentary.$put({
		param: { id },
		json: commentary,
	});
	return handleResponse<void>(response);
};

export const downloadFile = async (id: string, type: 'video' | 'audio'): Promise<void> => {
	const response = await (type === 'video'
		? client.fetch.project[':id'].download.video.$get({ param: { id } })
		: client.fetch.project[':id'].download.audio.$get({ param: { id } }));

	if (!response.ok) {
		throw new Error(`Failed to download ${type} file`);
	}

	const blob = await response.blob();
	const url = window.URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = `${type}-${id}.${type === 'video' ? 'mp4' : 'zip'}`;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	window.URL.revokeObjectURL(url);
};
