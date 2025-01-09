import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { startDescriptionGeneration, createSSEConnection, client } from '@/api/honoClient';
import type { DescriptionOptions } from '@shared/types/options';
import { DescriptionGenerationState, DescriptionGenerationStep } from '@shared/types/api/schema';
import { useEffect } from 'react';

const inactiveStates = [
	DescriptionGenerationStep.IDLE,
	DescriptionGenerationStep.ERROR,
	DescriptionGenerationStep.COMPLETED,
];

export function useDescriptionGeneration(id: string) {
	const queryClient = useQueryClient();

	// Query for initial state and SSE updates
	const { data: state } = useQuery({
		queryKey: ['descriptionGeneration', id],
		queryFn: async () => {
			const response = await client.generate.description[':id'].status.$get({ param: { id } });
			return response.json() as Promise<DescriptionGenerationState>;
		},
		staleTime: 30000,
	});

	// Connect SSE when state is active
	useEffect(() => {
		if (inactiveStates.includes(state?.currentStep ?? DescriptionGenerationStep.IDLE)) {
			return;
		}

		const connection = createSSEConnection(`${import.meta.env.VITE_APP_API_BASE}/generate/description/${id}/status`, {
			onMessage: data => {
				queryClient.setQueryData(['descriptionGeneration', id], (prev: DescriptionGenerationState) => ({
					...prev,
					...data,
					progress: data.progress > (prev?.progress ?? 0) ? data.progress : (prev?.progress ?? 0),
				}));

				// Invalidate the project data when complete
				if (data.currentStep === DescriptionGenerationStep.COMPLETED) {
					queryClient.invalidateQueries({ queryKey: ['videoGenState', id] });
				}
			},
			onError: () => {
				queryClient.setQueryData(['descriptionGeneration', id], (prev: DescriptionGenerationState) => ({
					...prev,
					currentStep: DescriptionGenerationStep.ERROR,
					error: {
						step: prev?.currentStep ?? DescriptionGenerationStep.ERROR,
						message: 'Connection failed',
					},
				}));
			},
			maxRetries: -1, // Unlimited retries for active states
		});

		return () => connection.close();
	}, [id, queryClient, state?.currentStep]);

	// Start generation mutation
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
		state,
	};
}
