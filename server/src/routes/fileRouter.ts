import { Hono } from 'hono';
import { streamFile } from '@/lib/streamFile';
import { projectStorage } from '@/database/projectStorage';

const fileRouter = new Hono()
	.get('/:id/:fileName', async c => {
		const id = c.req.param('id');
		const fileName = c.req.param('fileName');

		try {
			const fileBuffer = await projectStorage.getFile(id, fileName);

			// Set appropriate headers based on file type
			const contentType = getContentType(fileName);
			c.header('Content-Type', contentType);
			c.header('Content-Disposition', `inline; filename="${fileName}"`);

			// Stream the file
			return streamFile(c, fileBuffer);
		} catch (error) {
			if (error instanceof Error && error.message === 'ENOENT') {
				return c.json({ message: 'File not found' }, 404);
			}
			console.error('Error fetching file:', error);
			return c.json({ message: 'Internal server error' }, 500);
		}
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

export { fileRouter };
