import React, { createContext, useContext, ReactNode } from 'react';
import { TimestampText, VideoMetadata, GenerationState, GenerationStep } from '@shared/types/api/schema';
import { DescriptionOptions, CommentaryOptions, VideoOptions } from '@shared/types/options';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchVideoGenState } from '@/api/apiHelper';

interface VideoGenStateContext {
	id: string;
	metadata: VideoMetadata | null;
	description: TimestampText[];
	commentary: TimestampText[];
	generationState: GenerationState;
	updateDescription: (data: TimestampText[]) => void;
	updateCommentary: (data: TimestampText[]) => void;
	updateMetadata: (data: VideoMetadata) => void;
	options: {
		description: DescriptionOptions;
		commentary: CommentaryOptions;
		video: VideoOptions;
	};
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

	const value: VideoGenStateContext = {
		id,
		metadata: data?.metadata ?? null,
		description: data?.description ?? [],
		commentary: data?.commentary ?? [],
		generationState: data?.generationState ?? { currentStep: GenerationStep.IDLE },
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
		options: data?.options ?? {
			description: {} as DescriptionOptions,
			commentary: {} as CommentaryOptions,
			video: {} as VideoOptions,
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
export const useIsGenerating = () => {
	const { generationState } = useVideoGen();
	return (
		generationState.currentStep !== GenerationStep.IDLE &&
		generationState.currentStep !== GenerationStep.COMPLETED &&
		generationState.currentStep !== GenerationStep.ERROR
	);
};

export const useGenerationProgress = () => {
	const { generationState } = useVideoGen();
	return {
		step: generationState.currentStep,
		progress: generationState.progress,
		error: generationState.error,
		isComplete: generationState.currentStep === GenerationStep.COMPLETED,
		isError: generationState.currentStep === GenerationStep.ERROR,
	};
};
