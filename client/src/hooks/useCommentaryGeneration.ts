import { useMutation, useQueryClient } from '@tanstack/react-query';
import { generateCommentary } from '@/api/honoClient';
import type { CommentaryOptions } from '@shared/types/options';

export function useCommentaryGeneration(id: string) {
	const queryClient = useQueryClient();

	const commentaryMutation = useMutation({
		mutationFn: async ({ options }: { options: CommentaryOptions }) => generateCommentary(id, options),
		onSuccess: data => {
			// Update the project query data with the new commentary
			queryClient.setQueryData(['project', id], (old: any) => ({
				...old,
				commentary: data,
			}));
		},
	});

	return {
		generate: commentaryMutation.mutate,
		isLoading: commentaryMutation.isPending,
		error: commentaryMutation.error,
	} as const;
}
