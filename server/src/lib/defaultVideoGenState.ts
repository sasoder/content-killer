import { DescriptionGenerationStep, VideoGenerationStep, VideoGenState } from '@shared/types/api/schema';
import {
	defaultDescriptionOptions,
	defaultCommentaryOptions,
	defaultVideoOptions,
} from '@shared/types/options/defaultTemplates';
import { ProjectTemplate } from '@shared/types/options/template';

export const createDefaultVideoGenState = (id: string, projectTemplate?: ProjectTemplate): VideoGenState => {
	return {
		id,
		description: [],
		commentary: [],
		videoGenerationState: {
			currentStep: VideoGenerationStep.IDLE,
			completedSteps: [],
		},
		descriptionGenerationState: {
			currentStep: DescriptionGenerationStep.IDLE,
			progress: 0,
			completedSteps: [],
		},
		metadata: {
			title: 'New Project',
			createdAt: new Date().toISOString(),
		},
		options: projectTemplate?.options ?? {
			description: defaultDescriptionOptions,
			commentary: defaultCommentaryOptions,
			video: defaultVideoOptions,
		},
		pauseSoundFilename: projectTemplate?.pauseSoundFilename || '',
	};
};
