import { DescriptionOptions, CommentaryOptions, VideoOptions } from '../options';

export type TimestampText = {
	timestamp: string;
	text: string;
};

export type VideoMetadata = {
	url: string;
	title: string;
	duration: string;
	createdAt: string;
};

export enum GenerationStep {
	IDLE = 'IDLE',
	PREPARING = 'PREPARING',
	GENERATING_AUDIO = 'GENERATING_AUDIO',
	DOWNLOADING_VIDEO = 'DOWNLOADING_VIDEO',
	SCALING_VIDEO = 'SCALING_VIDEO',
	TRANSCRIBING = 'TRANSCRIBING',
	PROCESSING_VIDEO = 'PROCESSING_VIDEO',
	FINALIZING = 'FINALIZING',
	COMPLETED = 'COMPLETED',
	ERROR = 'ERROR',
}

export type GenerationState = {
	currentStep: GenerationStep;
	completedSteps: GenerationStep[];
	error?: {
		step: GenerationStep;
		message: string;
	};
};

export type VideoGenState = {
	id: string;
	description: TimestampText[];
	commentary: TimestampText[];
	generationState: GenerationState;
	options: {
		description: DescriptionOptions;
		commentary: CommentaryOptions;
		video: VideoOptions;
	};
	metadata: VideoMetadata;
	pauseSoundFilename: string;
};
