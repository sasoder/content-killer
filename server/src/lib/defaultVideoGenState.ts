import { GenerationStep, VideoGenState } from '@shared/types/api/schema';
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
		options: projectTemplate?.options ?? {
			description: defaultDescriptionOptions,
			commentary: defaultCommentaryOptions,
			video: defaultVideoOptions,
		},
		pauseSoundFilename: projectTemplate?.pauseSoundFilename || '',
	};
};
