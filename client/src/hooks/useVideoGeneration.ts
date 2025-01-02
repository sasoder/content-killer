import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { generateVideo, fetchVideoGenState } from '@/api/apiHelper';
import type { VideoOptions } from '@shared/types/options';
import { VideoGenState, VideoGenStatus, AudioGenStatus } from '@shared/types/api/schema';
import type { TimestampText } from '@shared/types/api/schema';

const ACTIVE_STATUSES = [
	VideoGenStatus.STARTING,
	VideoGenStatus.GENERATING_COMMENTARY_AUDIO,
	VideoGenStatus.DOWNLOADING_SOURCE,
	VideoGenStatus.TRANSCRIBING_SOURCE,
	VideoGenStatus.GENERATING_VIDEO,
];

export function useVideoGeneration(id: string) {
	const queryClient = useQueryClient();

	const genStatus = useQuery({
		queryKey: ['videoGenState', id],
		queryFn: () => fetchVideoGenState(id),
		refetchInterval: query => {
			const data = query.state.data as VideoGenState | undefined;
			if (!data) return false;

			// Poll every second while in an active status
			return ACTIVE_STATUSES.includes(data.videoStatus) || data.audioStatus === AudioGenStatus.GENERATING
				? 1000
				: false;
		},
		retry: false,
	});

	const generateMutation = useMutation({
		mutationFn: ({ commentary, options }: { commentary: TimestampText[]; options: VideoOptions }) =>
			generateVideo(id, commentary, options),
		onMutate: async () => {
			await queryClient.cancelQueries({ queryKey: ['videoGenState', id] });
			const previousState = queryClient.getQueryData<VideoGenState>(['videoGenState', id]);

			// Optimistically update to STARTING status
			queryClient.setQueryData<VideoGenState>(['videoGenState', id], old => ({
				...(old as VideoGenState),
				videoStatus: VideoGenStatus.STARTING,
				audioStatus: AudioGenStatus.IDLE,
			}));

			return { previousState };
		},
		onError: (err, variables, context) => {
			if (context?.previousState) {
				queryClient.setQueryData(['videoGenState', id], context.previousState);
			}
			// Force a refetch to ensure we have the latest state
			queryClient.invalidateQueries({ queryKey: ['videoGenState', id] });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['videoGenState', id] });
		},
	});

	const status = genStatus.data?.videoStatus ?? VideoGenStatus.IDLE;
	const isGenerating = ACTIVE_STATUSES.includes(status) || genStatus.data?.audioStatus === AudioGenStatus.GENERATING;

	return {
		status,
		videoId: genStatus.data?.metadata?.url,
		audioIds: genStatus.data?.commentary?.map(c => c.timestamp) ?? [],
		isLoading: genStatus.isLoading || generateMutation.isPending,
		isGenerating,
		error: genStatus.error || generateMutation.error,
		generate: generateMutation.mutate,
	} as const;
}
