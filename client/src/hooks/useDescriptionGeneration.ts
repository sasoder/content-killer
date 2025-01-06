import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { startDescriptionGeneration, subscribeToDescriptionProgress, fetchVideoGenState } from '@/api/apiHelper';
import type { DescriptionOptions } from '@shared/types/options';
import { DescriptionGenerationStep, VideoGenState } from '@shared/types/api/schema';

export function useDescriptionGeneration(id: string) {
	const queryClient = useQueryClient();

	const genStatus = useQuery({
		queryKey: ['videoGenState', id],
		queryFn: () => fetchVideoGenState(id),
		refetchInterval: query => {
			const currentStep = (query.state.data as VideoGenState)?.descriptionGenerationState?.currentStep;
			return currentStep && currentStep !== DescriptionGenerationStep.IDLE ? 1000 : false;
		},
	});

	const updateGenerationState = (state: { step: DescriptionGenerationStep; progress: number }) => {
		queryClient.setQueryData(['videoGenState', id], (old: any) => ({
			...old,
			descriptionGenerationState: {
				currentStep: state.step,
				completedSteps: [...(old?.descriptionGenerationState?.completedSteps || []), state.step],
				progress: state.progress,
			},
		}));
	};

	const updateError = (error: { step: DescriptionGenerationStep; message: string }) => {
		queryClient.setQueryData(['videoGenState', id], (old: any) => ({
			...old,
			descriptionGenerationState: {
				...old?.descriptionGenerationState,
				error,
			},
		}));
	};

	const mutation = useMutation({
		mutationFn: async ({ url, options }: { url: string; options: DescriptionOptions }) => {
			try {
				await startDescriptionGeneration(id, url, options);

				return new Promise<void>((resolve, reject) => {
					const cleanup = subscribeToDescriptionProgress(id, data => {
						if (data.type === 'progress' && data.step) {
							updateGenerationState({
								step: data.step,
								progress: data.progress || 0,
							});
						} else if (data.type === 'complete') {
							cleanup();
							queryClient.invalidateQueries({ queryKey: ['videoGenState', id] });
							resolve();
						} else if (data.type === 'error') {
							cleanup();
							updateError({
								step: DescriptionGenerationStep.ERROR,
								message: data.error || 'Unknown error',
							});
							reject(new Error(data.error));
						}
					});
				});
			} catch (error) {
				console.error('Error in description generation:', error);
				updateError({
					step: DescriptionGenerationStep.ERROR,
					message: error instanceof Error ? error.message : 'Unknown error',
				});
				throw error;
			}
		},
		onMutate: async () => {
			await queryClient.cancelQueries({ queryKey: ['videoGenState', id] });

			const previousState = queryClient.getQueryData<VideoGenState>(['videoGenState', id]);

			queryClient.setQueryData<VideoGenState>(['videoGenState', id], old => ({
				...(old as VideoGenState),
				descriptionGenerationState: {
					currentStep: DescriptionGenerationStep.PREPARING,
					completedSteps: [],
					progress: 0,
				},
			}));

			return { previousState };
		},
		onError: (err, variables, context) => {
			// If the mutation fails, use the context returned from onMutate to roll back
			if (context?.previousState) {
				queryClient.setQueryData(['videoGenState', id], context.previousState);
			}
			queryClient.invalidateQueries({ queryKey: ['videoGenState', id] });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['videoGenState', id] });
		},
	});

	const currentStep = genStatus.data?.descriptionGenerationState?.currentStep ?? DescriptionGenerationStep.IDLE;
	const isGenerating =
		currentStep !== DescriptionGenerationStep.IDLE && currentStep !== DescriptionGenerationStep.ERROR;

	return {
		generate: (url: string, options: DescriptionOptions) => mutation.mutate({ url, options }),
		isLoading: genStatus.isLoading || mutation.isPending,
		isGenerating,
		currentStep,
	};
}
