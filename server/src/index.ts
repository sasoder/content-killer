import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { router, RouterType } from './routes';
import { projectStorage } from './db/storage';

const app = new Hono();
app.use(
	'*',
	cors({
		origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
		exposeHeaders: ['Content-Disposition', 'Content-Type'],
		allowHeaders: ['Content-Type'],
		allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
		maxAge: 86400,
		credentials: true,
	}),
);
app.use('*', logger());
app.route('/api', router);

const initServer = async () => {
	try {
		await projectStorage.ensureDefaultTemplateExists();
		console.log('Default project template initialized');
	} catch (error) {
		console.error('Failed to initialize default project template:', error);
	}
};

initServer();

export type AppType = RouterType;
export default {
	port: 3000,
	fetch: app.fetch,
};
