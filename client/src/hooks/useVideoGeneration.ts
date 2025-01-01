import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { generateVideo, fetchVideoGenState } from '@/api/apiHelper';
import type { VideoOptions } from '@shared/types/options';
import type { VideoGenState } from '@shared/types/api/schema';
import type { TimestampText } from '@shared/types/api/schema';

export type VideoGenStatus = 'idle' | 'generating' | 'completed' | 'error';

export function useVideoGeneration(id: string) {
	const queryClient = useQueryClient();

	const genStatus = useQuery({
		queryKey: ['videoGenState', id],
		queryFn: () => fetchVideoGenState(id),
		refetchInterval: query => {
			const data = query.state.data as VideoGenState | undefined;
			const status: VideoGenStatus = !data?.videoId && data?.audioIds?.length ? 'generating' : 'completed';
			return status === 'generating' ? 1000 : false;
		},
	});

	const generateMutation = useMutation({
		mutationFn: ({ commentary, options }: { commentary: TimestampText[]; options: VideoOptions }) =>
			generateVideo(id, commentary, options),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['videoGenState', id] });
		},
	});

	const status: VideoGenStatus =
		!genStatus.data?.videoId && genStatus.data?.audioIds?.length
			? 'generating'
			: genStatus.data?.videoId
				? 'completed'
				: generateMutation.isPending
					? 'generating'
					: 'idle';

	return {
		status,
		videoId: genStatus.data?.videoId,
		audioIds: genStatus.data?.audioIds || [],
		isLoading: genStatus.isLoading || generateMutation.isPending,
		error: genStatus.error || generateMutation.error,

		generate: generateMutation.mutate,
	} as const;
}
