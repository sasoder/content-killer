import { Hono } from 'hono';
import { projectStorage } from '@/db/storage';

const fetchRouter = new Hono()
	.get('/videoGenStates', async c => {
		const videoGenStates = await projectStorage.getAllVideoGenStates();
		const sortedVideoGenStates = videoGenStates.sort((a, b) => {
			return new Date(b.metadata.createdAt).getTime() - new Date(a.metadata.createdAt).getTime();
		});
		return c.json(sortedVideoGenStates);
	})
	.get('/videoGenState/:id', async c => {
		const id = c.req.param('id');
		const project = await projectStorage.getProject(id);
		if (!project) {
			return c.json({ message: 'Project not found' }, 404);
		}
		return c.json(project);
	})
	.post('/:id/:fileName', async c => {
		const id = c.req.param('id');
		const fileName = c.req.param('fileName');

		try {
			const formData = await c.req.formData();
			const file = formData.get('file') as File;

			if (!file) {
				return c.json({ message: 'No file uploaded' }, 400);
			}

			const buffer = await file.arrayBuffer();
			await projectStorage.saveFile(id, fileName, Buffer.from(buffer));

			return c.json({ message: 'File uploaded successfully' }, 201);
		} catch (error) {
			console.error('Error uploading file:', error);
			return c.json({ message: 'Internal server error' }, 500);
		}
	});

function getContentType(fileName: string): string {
	const extension = fileName.split('.').pop()?.toLowerCase();
	switch (extension) {
		case 'mp4':
			return 'video/mp4';
		case 'mp3':
			return 'audio/mpeg';
		case 'wav':
			return 'audio/wav';
		default:
			return 'application/octet-stream';
	}
}

export { fetchRouter };
