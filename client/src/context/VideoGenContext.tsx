import { createContext, useContext } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type {
	TimestampText,
	Metadata,
	Project,
	DescriptionGenerationStep,
	VideoGenerationStep,
} from '@shared/types/api/schema';
import type { CommentaryOptions, DescriptionOptions, VideoOptions } from '@shared/types/options';
import { fetchProject } from '@/api/honoClient';

interface ProjectContext {
	id: string;
	description?: TimestampText[];
	commentary?: TimestampText[];
	metadata?: Metadata;
	options: {
		description?: DescriptionOptions;
		commentary?: CommentaryOptions;
		video?: VideoOptions;
	};
	isLoading: boolean;
	updateDescription: (description: TimestampText[]) => void;
	updateCommentary: (commentary: TimestampText[]) => void;
	updateMetadata: (metadata: Metadata) => void;
	updateDescriptionOptions: (options: DescriptionOptions) => void;
	updateCommentaryOptions: (options: CommentaryOptions) => void;
	updateVideoOptions: (options: VideoOptions) => void;
}

export function ProjectProvider({ id, children }: { id: string; children: React.ReactNode }) {
	const queryClient = useQueryClient();

	const { data: project, isLoading } = useQuery({
		queryKey: ['project', id],
		queryFn: () => fetchProject(id),
	});

	const value: ProjectContext = {
		id,
		description: project?.description,
		commentary: project?.commentary,
		metadata: project?.metadata,
		options: project?.options ?? {},
		isLoading,
		updateDescription: (description: TimestampText[]) => {
			queryClient.setQueryData(['project', id], (old: any) => ({
				...old,
				description,
			}));
		},
		updateCommentary: (commentary: TimestampText[]) => {
			queryClient.setQueryData(['project', id], (old: any) => ({
				...old,
				commentary,
			}));
		},
		updateMetadata: (metadata: Metadata) => {
			queryClient.setQueryData(['project', id], (old: any) => ({
				...old,
				metadata,
			}));
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
