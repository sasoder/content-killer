import { useMutation, useQueryClient } from '@tanstack/react-query';
import { generateCommentary } from '@/api/honoClient';
import type { CommentaryOptions } from '@shared/types/options';
import type { TimestampText } from '@shared/types/api/schema';

export function useCommentaryGeneration(id: string) {
	const queryClient = useQueryClient();

	const commentaryMutation = useMutation({
		mutationFn: async ({ description, options }: { description: TimestampText[]; options: CommentaryOptions }) =>
			generateCommentary(id, description, options),
		onSuccess: data => {
			// Update the videoGenState query data
			queryClient.setQueryData(['videoGenState', id], (old: any) => ({
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
