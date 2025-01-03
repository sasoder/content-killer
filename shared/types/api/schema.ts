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
	PROCESSING_VIDEO = 'PROCESSING_VIDEO',
	TRANSCRIBING = 'TRANSCRIBING',
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
