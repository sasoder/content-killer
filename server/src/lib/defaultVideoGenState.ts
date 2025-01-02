import { GenerationStep, VideoGenState } from '@shared/types/api/schema';
import { DescriptionOptions, CommentaryOptions, VideoOptions } from '@shared/types/options';
import {
	defaultDescriptionOptions,
	defaultCommentaryOptions,
	defaultVideoOptions,
} from '@shared/types/options/defaultOptions';
import { OptionConfig } from '@shared/types/options/config';

export const createDefaultVideoGenState = (id: string, optionConfig?: OptionConfig): VideoGenState => {
	return {
		id,
		description: [],
		commentary: [],
		generationState: {
			currentStep: GenerationStep.IDLE,
		},
		metadata: {
			url: '',
			title: 'New Project',
			duration: '',
			createdAt: new Date().toISOString(),
		},
		options: optionConfig?.options ?? {
			description: defaultDescriptionOptions,
			commentary: defaultCommentaryOptions,
			video: defaultVideoOptions,
		},
	};
};
