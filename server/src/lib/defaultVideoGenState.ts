import { GenerationStep, VideoGenState } from '@shared/types/api/schema';
import { DescriptionOptions, CommentaryOptions, VideoOptions } from '@shared/types/options';
import {
	defaultDescriptionOptions,
	defaultCommentaryOptions,
	defaultVideoOptions,
} from '@shared/types/options/defaultConfigs';
import { ProjectConfig } from '@shared/types/options/config';

export const createDefaultVideoGenState = (id: string, projectConfig?: ProjectConfig): VideoGenState => {
	return {
		id,
		description: [],
		commentary: [],
		generationState: {
			currentStep: GenerationStep.IDLE,
			completedSteps: [],
		},
		metadata: {
			url: '',
			title: 'New Project',
			duration: '',
			createdAt: new Date().toISOString(),
		},
		options: projectConfig?.options ?? {
			description: defaultDescriptionOptions,
			commentary: defaultCommentaryOptions,
			video: defaultVideoOptions,
		},
	};
};
