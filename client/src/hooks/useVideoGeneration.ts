import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { generateVideo, getVideoGenerationStatus } from '@/api/honoClient';
import type { VideoOptions } from '@shared/types/options';
import { VideoGenerationStep, VideoGenerationState } from '@shared/types/api/schema';
import type { TimestampText } from '@shared/types/api/schema';

const ACTIVE_STEPS = [
	VideoGenerationStep.PREPARING,
	VideoGenerationStep.GENERATING_AUDIO,
	VideoGenerationStep.SCALING_VIDEO,
	VideoGenerationStep.PROCESSING_VIDEO,
	VideoGenerationStep.TRANSCRIBING,
	VideoGenerationStep.FINALIZING,
];

export function useVideoGeneration(id: string) {
	const queryClient = useQueryClient();

	const genStatus = useQuery({
		queryKey: ['videoGenerationStatus', id],
		queryFn: () => getVideoGenerationStatus(id),
		refetchInterval: query => {
			const currentStep = (query.state.data as VideoGenerationState | undefined)?.currentStep;
			return currentStep && ACTIVE_STEPS.includes(currentStep) ? 1000 : false;
		},
	});

	const generateMutation = useMutation({
		mutationFn: ({ commentary, options }: { commentary: TimestampText[]; options: VideoOptions }) =>
			generateVideo(id, commentary, options),
		onMutate: async () => {
			await queryClient.cancelQueries({ queryKey: ['videoGenerationStatus', id] });

			// Optimistic update
			queryClient.setQueryData(['videoGenerationStatus', id], {
				currentStep: VideoGenerationStep.PREPARING,
				completedSteps: [],
				progress: undefined,
			});
		},
		onError: error => {
			queryClient.setQueryData(['videoGenerationStatus', id], {
				currentStep: VideoGenerationStep.ERROR,
				completedSteps: [],
				progress: undefined,
				error: {
					step: VideoGenerationStep.PREPARING,
					message: error instanceof Error ? error.message : 'Failed to start generation',
				},
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['videoGenerationStatus', id] });
		},
	});

	const currentStep = genStatus.data?.currentStep ?? VideoGenerationStep.IDLE;
	const isGenerating = ACTIVE_STEPS.includes(currentStep);

	return {
		generate: (commentary: TimestampText[], options: VideoOptions) => generateMutation.mutate({ commentary, options }),
		isLoading: generateMutation.isPending || isGenerating,
		state: genStatus.data,
	} as const;
}
