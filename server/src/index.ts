import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { generateRouter } from '@/routes/generateRouter';
import { cors } from 'hono/cors';
import { fileRouter } from '@/routes/fileRouter';
import { fetchRouter } from '@/routes/fetchRouter';
const app = new Hono().use(logger()).use(cors());

app.get('/', c => {
	return c.text('Hello Hono!');
});

const apiRoutes = app
	.basePath('/api')
	.route('/generate', generateRouter)
	.route('/file', fileRouter)
	.route('/fetch', fetchRouter);

export type AppType = typeof apiRoutes;
export default app;
