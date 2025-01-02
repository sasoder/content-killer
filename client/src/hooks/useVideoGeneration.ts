import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { generateVideo, fetchVideoGenState } from '@/api/apiHelper';
import type { VideoOptions } from '@shared/types/options';
import { VideoGenState, GenerationStep } from '@shared/types/api/schema';
import type { TimestampText } from '@shared/types/api/schema';

const ACTIVE_STEPS = [
	GenerationStep.PREPARING,
	GenerationStep.GENERATING_AUDIO,
	GenerationStep.DOWNLOADING_VIDEO,
	GenerationStep.PROCESSING_VIDEO,
	GenerationStep.TRANSCRIBING,
	GenerationStep.FINALIZING,
];

export function useVideoGeneration(id: string) {
	const queryClient = useQueryClient();

	const genStatus = useQuery({
		queryKey: ['videoGenState', id],
		queryFn: () => fetchVideoGenState(id),
		refetchInterval: query => {
			const currentStep = (query.state.data as VideoGenState | undefined)?.generationState?.currentStep;
			return currentStep && ACTIVE_STEPS.includes(currentStep) ? 1000 : false;
		},
	});

	const generateMutation = useMutation({
		mutationFn: ({ commentary, options }: { commentary: TimestampText[]; options: VideoOptions }) =>
			generateVideo(id, commentary, options),
		onMutate: async () => {
			await queryClient.cancelQueries({ queryKey: ['videoGenState', id] });
			const previousState = queryClient.getQueryData<VideoGenState>(['videoGenState', id]);

			queryClient.setQueryData<VideoGenState>(['videoGenState', id], old => ({
				...(old as VideoGenState),
				generationState: {
					currentStep: GenerationStep.PREPARING,
					progress: { current: 0, total: 100 },
				},
			}));

			return { previousState };
		},
		onError: (err, variables, context) => {
			if (context?.previousState) {
				queryClient.setQueryData(['videoGenState', id], context.previousState);
			}
			queryClient.invalidateQueries({ queryKey: ['videoGenState', id] });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['videoGenState', id] });
		},
	});

	const currentStep = genStatus.data?.generationState?.currentStep ?? GenerationStep.IDLE;
	const isGenerating = ACTIVE_STEPS.includes(currentStep);

	return {
		status: currentStep,
		videoId: genStatus.data?.metadata?.url,
		audioIds: genStatus.data?.commentary?.map(c => c.timestamp) ?? [],
		isLoading: genStatus.isLoading || generateMutation.isPending,
		isGenerating,
		error: genStatus.error || generateMutation.error,
		generate: generateMutation.mutate,
	} as const;
}
