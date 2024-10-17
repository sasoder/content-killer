import { Hono } from 'hono';
import { projectStorage } from '@/database/projectStorage';

const fetchRouter = new Hono()
	.get('/videoIds', async c => {
		const videoIds = await projectStorage.getVideoIds();
		return c.json(videoIds);
	})
	.get('/videoGenState/:id', async c => {
		const id = c.req.param('id');
		const project = await projectStorage.getProject(id);
		if (!project) {
			return c.json({ message: 'Project not found' }, 404);
		}
		console.log('fetched video gen state for', id, project.state);
		return c.json(project.state);
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
