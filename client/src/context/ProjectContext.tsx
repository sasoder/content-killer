import { createContext, useContext } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { TimestampText, Metadata, Project } from '@shared/types/api/schema';
import type { CommentaryOptions, DescriptionOptions, VideoOptions } from '@shared/types/options';
import { fetchProject, updateProjectDescription, updateProjectCommentary, generateMetadata } from '@/api/honoClient';

interface ProjectContext {
	id: string;
	description: TimestampText[];
	commentary: TimestampText[];
	metadata?: Metadata;
	options: {
		description: DescriptionOptions;
		commentary: CommentaryOptions;
		video: VideoOptions;
	};
	isLoading: boolean;
	error: Error | null;
	updateDescription: (description: TimestampText[]) => void;
	updateCommentary: (commentary: TimestampText[]) => void;
	updateMetadata: (url: string) => void;
	updateDescriptionOptions: (options: DescriptionOptions) => void;
	updateCommentaryOptions: (options: CommentaryOptions) => void;
	updateVideoOptions: (options: VideoOptions) => void;
}

export function ProjectProvider({ id, children }: { id: string; children: React.ReactNode }) {
	const queryClient = useQueryClient();

	const {
		data: project,
		isLoading,
		error,
	} = useQuery({
		queryKey: ['project', id],
		queryFn: () => fetchProject(id),
		staleTime: Infinity,
		refetchOnWindowFocus: false,
		refetchOnMount: false,
		refetchOnReconnect: false,
	});

	const descriptionMutation = useMutation({
		mutationFn: (description: TimestampText[]) => updateProjectDescription(id, description),
		onSuccess: (_, description) => {
			queryClient.setQueryData(['project', id], (old: any) => ({
				...old,
				description,
			}));
		},
	});

	const commentaryMutation = useMutation({
		mutationFn: (commentary: TimestampText[]) => updateProjectCommentary(id, commentary),
		onSuccess: (_, commentary) => {
			queryClient.setQueryData(['project', id], (old: any) => ({
				...old,
				commentary,
			}));
		},
	});

	const metadataMutation = useMutation({
		mutationFn: (url: string) => generateMetadata(id, url),
		onSuccess: data => {
			queryClient.setQueryData(['project', id], (old: any) => ({
				...old,
				metadata: data,
			}));
		},
	});

	const value: ProjectContext = {
		id,
		description: project?.description ?? [],
		commentary: project?.commentary ?? [],
		metadata: project?.metadata,
		options: project?.options as {
			description: DescriptionOptions;
			commentary: CommentaryOptions;
			video: VideoOptions;
		},
		isLoading,
		error,
		updateDescription: (description: TimestampText[]) => {
			descriptionMutation.mutate(description);
		},
		updateCommentary: (commentary: TimestampText[]) => {
			commentaryMutation.mutate(commentary);
		},
		updateMetadata: (url: string) => {
			metadataMutation.mutate(url);
		},
		updateDescriptionOptions: (options: DescriptionOptions) => {
			queryClient.setQueryData(['project', id], (old: any) => ({
				...old,
				options: {
					...old.options,
					description: options,
				},
			}));
		},
		updateCommentaryOptions: (options: CommentaryOptions) => {
			queryClient.setQueryData(['project', id], (old: any) => ({
				...old,
				options: {
					...old.options,
					commentary: options,
				},
			}));
		},
		updateVideoOptions: (options: VideoOptions) => {
			queryClient.setQueryData(['project', id], (old: any) => ({
				...old,
				options: {
					...old.options,
					video: options,
				},
			}));
		},
	};

	return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

const ProjectContext = createContext<ProjectContext | undefined>(undefined);

export const useProject = (): ProjectContext => {
	const context = useContext(ProjectContext);
	if (!context) {
		throw new Error('useProject must be used within a ProjectProvider');
	}
	return context;
};
