import { useMutation, useQueryClient } from '@tanstack/react-query';
import { generateDescription, generateMetadata } from '@/api/apiHelper';
import type { DescriptionOptions } from '@shared/types/options';
import type { TimestampText, VideoMetadata } from '@shared/types/api/schema';

type GenerateResult =
	| { metadata: VideoMetadata; description: TimestampText[] }
	| { metadata?: never; description: TimestampText[] };

export function useDescriptionGeneration(id: string) {
	const queryClient = useQueryClient();

	const metadataMutation = useMutation({
		mutationFn: async (url: string) => generateMetadata(id, url),
		onSuccess: data => {
			queryClient.setQueryData(['videoGenState', id], (old: any) => ({
				...old,
				metadata: data,
			}));
		},
	});

	const descriptionMutation = useMutation({
		mutationFn: async ({ url, options }: { url: string; options: DescriptionOptions }) =>
			generateDescription(id, url, options),
		onSuccess: data => {
			queryClient.setQueryData(['videoGenState', id], (old: any) => ({
				...old,
				description: data,
			}));
		},
	});

	const generate = async (url: string, options: DescriptionOptions): Promise<GenerateResult> => {
		const metadata = await metadataMutation.mutateAsync(url);
		const description = await descriptionMutation.mutateAsync({ url, options });
		return { metadata, description };
	};

	return {
		generate,
		isLoading: metadataMutation.isPending || descriptionMutation.isPending,
		error: metadataMutation.error || descriptionMutation.error,
	} as const;
}
