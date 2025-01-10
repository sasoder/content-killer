import { downloadVideoMetadata } from './downloadVideo';
import { projectStorage } from '@/db/storage';

export const generateMetadata = async (id: string, url: string) => {
	const metadata = await downloadVideoMetadata(url);

	const project = await projectStorage.getProject(id);
	if (project) {
		const fullMetadata = {
			...project.metadata,
			...metadata,
			url,
		};
		project.metadata = fullMetadata;
		await projectStorage.updateProjectState(project);
		return fullMetadata;
	}
	return metadata;
};
