import { Project } from '@shared/types/api/schema';
import { ProjectTemplate } from '@shared/types/options/template';

export const createDefaultProject = (id: string, projectTemplate: ProjectTemplate): Project => {
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
			description: projectTemplate?.options.description,
			commentary: projectTemplate?.options.commentary,
			video: projectTemplate?.options.video,
		},
		pauseSoundFilename: projectTemplate?.pauseSoundFilename || 'pause_default.wav',
	};
};
