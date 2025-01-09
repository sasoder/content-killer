import { Hono } from 'hono';
import { projectStorage } from '@/db/storage';
import { Project } from '@shared/types/api/schema';

const fetchRouter = new Hono()
	.get('/projects', async c => {
		const projects = await projectStorage.getAllProjects();
		projects.sort((a: Project, b: Project) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
		return c.json(projects);
	})
	.get('/project/:id', async c => {
		const id = c.req.param('id');
		const project = await projectStorage.getProject(id);
		if (!project) {
			return c.json({ error: 'Project not found' }, 404);
		}
		return c.json(project);
	})
	.get('/projectTemplates', async c => {
		const templates = await projectStorage.getAllProjectTemplates();
		return c.json(templates);
	})
	.get('/projectTemplate/:id', async c => {
		const id = c.req.param('id');
		const template = await projectStorage.getProjectTemplate(id);
		if (!template) {
			return c.json({ error: 'Template not found' }, 404);
		}
		return c.json(template);
	})
	.get('/voices', async c => {
		const voices = await projectStorage.getVoices();
		return c.json(voices);
	});

export { fetchRouter };
