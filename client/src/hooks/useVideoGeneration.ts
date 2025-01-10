import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { generateVideo, getVideoGenerationStatus } from '@/api/honoClient';
import type { VideoOptions } from '@shared/types/options';
import { VideoGenerationStep, VideoGenerationState } from '@shared/types/api/schema';

const ACTIVE_STEPS = [
	VideoGenerationStep.PREPARING,
	VideoGenerationStep.GENERATING_AUDIO,
	VideoGenerationStep.SCALING_VIDEO,
	VideoGenerationStep.PROCESSING_VIDEO,
	VideoGenerationStep.TRANSCRIBING,
	VideoGenerationStep.FINALIZING,
];

const POLL_INTERVAL = 1000; // 1 second

export function useVideoGeneration(id: string) {
	const queryClient = useQueryClient();

	const genStatus = useQuery({
		queryKey: ['videoGenerationStatus', id],
		queryFn: () => getVideoGenerationStatus(id),
		refetchInterval: query => {
			const data = query.state.data as VideoGenerationState | undefined;
			if (!data) return false;
			return ACTIVE_STEPS.includes(data.currentStep) ? POLL_INTERVAL : false;
		},
		retry: (failureCount, error) => {
			// Only retry if it's not a 404 error (which means generation hasn't started)
			if (error instanceof Error && error.message.includes('404')) {
				return false;
			}
			return failureCount < 3;
		},
	});

	const generateMutation = useMutation({
		mutationFn: ({ options }: { options: VideoOptions }) => generateVideo(id, options),
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
			queryClient.setQueryData(['project', id], (old: any) => ({
				...old,
				video: {
					status: 'completed',
				},
			}));
		},
	});

	return {
		generate: (options: VideoOptions, mutationOptions?: Parameters<typeof generateMutation.mutate>[1]) =>
			generateMutation.mutate({ options }, mutationOptions),
		isLoading:
			generateMutation.isPending || ACTIVE_STEPS.includes(genStatus.data?.currentStep ?? VideoGenerationStep.IDLE),
		state: genStatus.data ?? { currentStep: VideoGenerationStep.IDLE, completedSteps: [] },
	} as const;
}
