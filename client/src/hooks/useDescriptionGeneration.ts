import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { startDescriptionGeneration } from '@/api/apiHelper';
import type { DescriptionOptions } from '@shared/types/options';
import { DescriptionGenerationState, DescriptionGenerationStep } from '@shared/types/api/schema';
import { useEffect, useRef } from 'react';

const inactiveStates = [
	DescriptionGenerationStep.IDLE,
	DescriptionGenerationStep.ERROR,
	DescriptionGenerationStep.COMPLETED,
];

export function useDescriptionGeneration(id: string) {
	const queryClient = useQueryClient();
	const sseRef = useRef<EventSource | null>(null);
	const retryTimeoutRef = useRef<NodeJS.Timeout>();

	// Query for initial state
	const { data: state } = useQuery({
		queryKey: ['descriptionGeneration', id],
		queryFn: async () => {
			const res = await fetch(`${import.meta.env.VITE_APP_API_BASE}/generate/description/${id}/status`);
			return res.json() as Promise<DescriptionGenerationState>;
		},
		staleTime: 30000,
	});

	// Connect SSE when state is active
	useEffect(() => {
		if (inactiveStates.includes(state?.currentStep ?? DescriptionGenerationStep.IDLE)) {
			sseRef.current?.close();
			sseRef.current = null;
			if (retryTimeoutRef.current) {
				clearTimeout(retryTimeoutRef.current);
			}
			return;
		}

		const connectSSE = () => {
			if (sseRef.current) return;

			const sse = new EventSource(`${import.meta.env.VITE_APP_API_BASE}/generate/description/${id}/status`, {
				withCredentials: true,
			});

			sseRef.current = sse;

			sse.onmessage = event => {
				try {
					const data = JSON.parse(event.data);
					queryClient.setQueryData(['descriptionGeneration', id], (prev: DescriptionGenerationState) => ({
						...prev,
						...data,
						progress: prev ? Math.max(prev.progress ?? 0, data.progress ?? 0) : (data.progress ?? 0),
					}));

					// Add explicit handling for connection close
					if (
						data.currentStep === DescriptionGenerationStep.COMPLETED ||
						data.currentStep === DescriptionGenerationStep.ERROR ||
						data.currentStep === DescriptionGenerationStep.IDLE
					) {
						console.log('Closing SSE connection due to final state:', data.currentStep);
						// Invalidate the project data to trigger a fresh fetch when complete
						if (data.currentStep === DescriptionGenerationStep.COMPLETED) {
							queryClient.invalidateQueries({ queryKey: ['videoGenState', id] });
						}
						sse.close();
						sseRef.current = null;
					}
				} catch (error) {
					console.error('Error processing SSE message:', error);
					sse.close();
					sseRef.current = null;
				}
			};

			// Add onopen handler
			sse.onopen = () => {
				console.log('SSE connection opened');
			};

			sse.onerror = () => {
				sse.close();
				sseRef.current = null;

				// Retry connection after delay if still in active state
				if (retryTimeoutRef.current) {
					clearTimeout(retryTimeoutRef.current);
				}
				retryTimeoutRef.current = setTimeout(connectSSE, 1000);
			};
		};

		connectSSE();

		return () => {
			if (retryTimeoutRef.current) {
				clearTimeout(retryTimeoutRef.current);
			}
			sseRef.current?.close();
			sseRef.current = null;
		};
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
				progress: 0,
			});
		},
		onError: error => {
			queryClient.setQueryData(['descriptionGeneration', id], {
				currentStep: DescriptionGenerationStep.ERROR,
				completedSteps: [],
				progress: 0,
				error: {
					step: 'PREPARING',
					message: error instanceof Error ? error.message : 'Failed to start generation',
				},
			});
		},
	});

	return {
		generate: (url: string, options: DescriptionOptions) => mutation.mutate({ url, options }),
		isLoading: mutation.isPending || !inactiveStates.includes(state?.currentStep ?? DescriptionGenerationStep.IDLE),
		state,
	};
}
