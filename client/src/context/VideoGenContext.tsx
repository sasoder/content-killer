import React, { createContext, useContext, ReactNode } from 'react';
import {
	TimestampText,
	VideoMetadata,
	VideoGenerationStep,
	DescriptionGenerationStep,
	VideoGenState,
} from '@shared/types/api/schema';
import { DescriptionOptions, CommentaryOptions, VideoOptions } from '@shared/types/options';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchVideoGenState } from '@/api/apiHelper';

interface VideoGenStateContext {
	id: string;
	metadata: VideoMetadata | null;
	description: TimestampText[];
	commentary: TimestampText[];
	videoGenerationState: {
		currentStep: VideoGenerationStep;
		completedSteps: VideoGenerationStep[];
		error?: {
			step: VideoGenerationStep;
			message: string;
		};
	};
	descriptionGenerationState: {
		currentStep: DescriptionGenerationStep;
		completedSteps: DescriptionGenerationStep[];
		progress?: number;
		error?: {
			step: DescriptionGenerationStep;
			message: string;
		};
	};
	options: {
		description: DescriptionOptions;
		commentary: CommentaryOptions;
		video: VideoOptions;
	};
	updateDescription: (data: TimestampText[]) => void;
	updateCommentary: (data: TimestampText[]) => void;
	updateMetadata: (data: VideoMetadata) => void;
	error: string | null;
	isLoading: boolean;
}

const VideoGenContext = createContext<VideoGenStateContext | undefined>(undefined);

export const VideoGenProvider = ({ children, id }: { children: ReactNode; id: string }) => {
	const queryClient = useQueryClient();
	const { data, isLoading, error } = useQuery({
		queryKey: ['videoGenState', id],
		queryFn: () => fetchVideoGenState(id),
	});

	console.log(data?.descriptionGenerationState);

	const value: VideoGenStateContext = {
		id,
		metadata: data?.metadata ?? null,
		description: data?.description ?? [],
		commentary: data?.commentary ?? [],
		videoGenerationState: data?.videoGenerationState ?? {
			currentStep: VideoGenerationStep.IDLE,
			completedSteps: [],
		},
		descriptionGenerationState: data?.descriptionGenerationState ?? {
			currentStep: DescriptionGenerationStep.IDLE,
			completedSteps: [],
			progress: 0,
		},
		options: data?.options ?? {
			description: {} as DescriptionOptions,
			commentary: {} as CommentaryOptions,
			video: {} as VideoOptions,
		},
		updateDescription: (newDescription: TimestampText[]) => {
			queryClient.setQueryData(['videoGenState', id], (old: any) => ({
				...old,
				description: newDescription,
			}));
		},
		updateCommentary: (newCommentary: TimestampText[]) => {
			queryClient.setQueryData(['videoGenState', id], (old: any) => ({
				...old,
				commentary: newCommentary,
			}));
		},
		updateMetadata: (newMetadata: VideoMetadata) => {
			queryClient.setQueryData(['videoGenState', id], (old: any) => ({
				...old,
				metadata: newMetadata,
			}));
		},
		error: error ? (error as Error).message : null,
		isLoading,
	};

	return <VideoGenContext.Provider value={value}>{children}</VideoGenContext.Provider>;
};

export const useVideoGen = (): VideoGenStateContext => {
	const context = useContext(VideoGenContext);
	if (!context) {
		throw new Error('useVideoGen must be used within a VideoGenProvider');
	}
	return context;
};

// Helper hooks for status checks
export const useIsVideoGenerating = () => {
	const { videoGenerationState } = useVideoGen();
	return (
		videoGenerationState.currentStep !== VideoGenerationStep.IDLE &&
		videoGenerationState.currentStep !== VideoGenerationStep.COMPLETED &&
		videoGenerationState.currentStep !== VideoGenerationStep.ERROR
	);
};

export const useIsDescriptionGenerating = () => {
	const { descriptionGenerationState } = useVideoGen();
	return (
		descriptionGenerationState.currentStep !== DescriptionGenerationStep.IDLE &&
		descriptionGenerationState.currentStep !== DescriptionGenerationStep.COMPLETED &&
		descriptionGenerationState.currentStep !== DescriptionGenerationStep.ERROR
	);
};

export const useVideoGenerationProgress = () => {
	const { videoGenerationState } = useVideoGen();
	return {
		step: videoGenerationState.currentStep,
		completedSteps: videoGenerationState.completedSteps,
		error: videoGenerationState.error,
		isComplete: videoGenerationState.currentStep === VideoGenerationStep.COMPLETED,
		isError: videoGenerationState.currentStep === VideoGenerationStep.ERROR,
	};
};

export const useDescriptionGenerationProgress = () => {
	const { descriptionGenerationState } = useVideoGen();
	return {
		step: descriptionGenerationState.currentStep,
		completedSteps: descriptionGenerationState.completedSteps,
		progress: descriptionGenerationState.progress,
		error: descriptionGenerationState.error,
		isComplete: descriptionGenerationState.currentStep === DescriptionGenerationStep.COMPLETED,
		isError: descriptionGenerationState.currentStep === DescriptionGenerationStep.ERROR,
	};
};
