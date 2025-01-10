import { Project } from '@shared/types/api/schema';
import { Template } from '@shared/types/options/template';

export const createDefaultProject = (id: string, template: Template): Project => {
	return {
		id,
		metadata: {
			createdAt: new Date().toISOString(),
		},
		description: undefined,
		commentary: undefined,
		audio: false,
		video: false,
		options: {
			description: template?.options.description,
			commentary: template?.options.commentary,
			video: template?.options.video,
		},
		pauseSoundFilename: template?.pauseSoundFilename || 'pause_default.wav',
	};
};
