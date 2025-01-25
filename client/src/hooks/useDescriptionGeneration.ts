import { useMutation, useQueryClient, useQuery, UseQueryOptions } from '@tanstack/react-query';
import { startDescriptionGeneration, createSSEConnection, getDescriptionGenerationStatus } from '@/api/honoClient';
import type { DescriptionOptions } from '@content-killer/shared';
import { DescriptionGenerationState, DescriptionGenerationStep } from '@content-killer/shared';
import { useEffect } from 'react';
import { getApiBaseUrl } from '@/lib/utils';

const inactiveStates = [
	DescriptionGenerationStep.IDLE,
	DescriptionGenerationStep.ERROR,
	DescriptionGenerationStep.COMPLETED,
];

export function useDescriptionGeneration(id: string) {
	const queryClient = useQueryClient();

	// query for initial state and polling updates
	const { data: state } = useQuery<DescriptionGenerationState, Error>({
		queryKey: ['descriptionGeneration', id],
		queryFn: async () => {
			const response = await getDescriptionGenerationStatus(id);
			return response;
		},
		// poll for all states after downloading until we reach an inactive state
		refetchInterval: query => {
			const currentState = query.state.data as DescriptionGenerationState | undefined;
			if (!currentState || inactiveStates.includes(currentState.currentStep)) return false;
			if (currentState.currentStep === DescriptionGenerationStep.DOWNLOADING) return false;

			return 1000;
		},

		refetchOnMount: false,
		refetchOnWindowFocus: false,
		staleTime: Infinity,
		select: (data: DescriptionGenerationState) => {
			if (data.currentStep === DescriptionGenerationStep.COMPLETED) {
				queryClient.invalidateQueries({ queryKey: ['project', id] });
			}
			return data;
		},
	} as UseQueryOptions<DescriptionGenerationState, Error>);

	// connect SSE only during downloading
	useEffect(() => {
		if (state?.currentStep !== DescriptionGenerationStep.DOWNLOADING) {
			return;
		}

		const connection = createSSEConnection(`${getApiBaseUrl()}/generate/description/${id}/status`, {
			onMessage: data => {
				queryClient.setQueryData(['descriptionGeneration', id], (prev: DescriptionGenerationState) => ({
					...prev,
					...data,
					progress: data.progress > (prev?.progress ?? 0) ? data.progress : (prev?.progress ?? 0),
				}));

				// if we get a state that indicates the download is complete, close the connection gracefully
				if (data.currentStep !== DescriptionGenerationStep.DOWNLOADING) {
					connection.close();
				}
			},
			onError: error => {
				// check if this is just a connection close (which is expected when transitioning states)
				const currentState = queryClient.getQueryData(['descriptionGeneration', id]) as DescriptionGenerationState;
				if (currentState?.currentStep !== DescriptionGenerationStep.DOWNLOADING) {
					// this is an expected closure, ignore it
					return;
				}

				// this is an unexpected error during downloading
				console.error('Error in description generation:', error);
				queryClient.setQueryData(['descriptionGeneration', id], (prev: DescriptionGenerationState) => ({
					...prev,
					currentStep: DescriptionGenerationStep.ERROR,
					error: {
						step: prev?.currentStep ?? DescriptionGenerationStep.ERROR,
						message: 'Connection failed',
					},
				}));
			},
			maxRetries: -1, // unlimited retries for active states
		});

		return () => connection.close();
	}, [id, queryClient, state?.currentStep]);

	// start generation mutation
	const mutation = useMutation({
		mutationFn: async ({ url, options }: { url: string; options: DescriptionOptions }) => {
			await startDescriptionGeneration(id, url, options);
		},
		onMutate: async () => {
			await queryClient.cancelQueries({ queryKey: ['descriptionGeneration', id] });

			// Optimistic update
			queryClient.setQueryData(['descriptionGeneration', id], {
				currentStep: DescriptionGenerationStep.PREPARING,
				completedSteps: [],
				progress: undefined,
			});
		},
		onError: error => {
			queryClient.setQueryData(['descriptionGeneration', id], {
				currentStep: DescriptionGenerationStep.ERROR,
				completedSteps: [],
				progress: undefined,
				error: {
					step: 'PREPARING',
					message: error instanceof Error ? error.message : 'Failed to start generation',
				},
			});
		},
	});

	return {
		generate: (url: string, options: DescriptionOptions, mutationOptions?: Parameters<typeof mutation.mutate>[1]) =>
			mutation.mutate({ url, options }, mutationOptions),
		isLoading: mutation.isPending || !inactiveStates.includes(state?.currentStep ?? DescriptionGenerationStep.IDLE),
		state: state ?? { currentStep: DescriptionGenerationStep.IDLE, completedSteps: [] },
	};
}
