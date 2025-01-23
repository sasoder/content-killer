import { Project } from '@content-killer/shared/api/schema';
import { Template } from '@content-killer/shared/options/template';

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
