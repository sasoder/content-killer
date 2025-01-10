import { DescriptionOptions, CommentaryOptions, VideoOptions } from '../options';

export type Voice = {
	id: string;
	name: string;
	previewUrl?: string;
};

export type TimestampText = {
	timestamp: string;
	text: string;
};

export type Metadata = {
	url?: string;
	title?: string;
	duration?: number;
	createdAt: string;
};

export enum VideoGenerationStep {
	IDLE = 'IDLE',
	PREPARING = 'PREPARING',
	GENERATING_AUDIO = 'GENERATING_AUDIO',
	SCALING_VIDEO = 'SCALING_VIDEO',
	TRANSCRIBING = 'TRANSCRIBING',
	PROCESSING_VIDEO = 'PROCESSING_VIDEO',
	FINALIZING = 'FINALIZING',
	COMPLETED = 'COMPLETED',
	ERROR = 'ERROR',
}

export enum DescriptionGenerationStep {
	PREPARING = 'PREPARING',
	DOWNLOADING = 'DOWNLOADING',
	UPLOADING = 'UPLOADING',
	PROCESSING = 'PROCESSING',
	GENERATING = 'GENERATING',
	COMPLETED = 'COMPLETED',
	ERROR = 'ERROR',
	IDLE = 'IDLE',
}

export interface VideoGenerationState {
	currentStep: VideoGenerationStep;
	completedSteps: VideoGenerationStep[];
	error?: {
		step: VideoGenerationStep;
		message: string;
	};
}

export interface DescriptionGenerationState {
	currentStep: DescriptionGenerationStep;
	completedSteps: DescriptionGenerationStep[];
	progress?: number;
	error?: {
		step: DescriptionGenerationStep;
		message: string;
	};
}

export type Project = {
	id: string;
	metadata: Metadata;
	description?: TimestampText[];
	commentary?: TimestampText[];
	audio: boolean;
	video: boolean;
	options: {
		description?: DescriptionOptions;
		commentary?: CommentaryOptions;
		video?: VideoOptions;
	};
	pauseSoundFilename: string;
};
