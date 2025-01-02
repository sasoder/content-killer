import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { generateVideo, fetchVideoGenState } from '@/api/apiHelper';
import type { VideoOptions } from '@shared/types/options';
import type { VideoGenState, VideoGenStatus } from '@shared/types/api/schema';
import type { TimestampText } from '@shared/types/api/schema';

export function useVideoGeneration(id: string) {
	const queryClient = useQueryClient();

	const genStatus = useQuery({
		queryKey: ['videoGenState', id],
		queryFn: () => fetchVideoGenState(id),
		refetchInterval: query => {
			const data = query.state.data as VideoGenState | undefined;
			if (!data) return false;

			return ['generating commentary audio', 'downloading source', 'transcribing source', 'generating video'].includes(
				data.videoStatus,
			)
				? 1000
				: false;
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
		genStatus.data?.videoStatus ?? (generateMutation.isPending ? 'generating video' : 'idle');

	return {
		status,
		videoId: genStatus.data?.metadata?.url,
		audioIds: genStatus.data?.commentary?.map(c => c.timestamp) ?? [],
		isLoading: genStatus.isLoading || generateMutation.isPending,
		error: genStatus.error || generateMutation.error,
		generate: generateMutation.mutate,
	} as const;
}
