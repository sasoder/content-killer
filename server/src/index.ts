import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { router, RouterType } from './routes';
import { projectStorage } from './db/storage';

const app = new Hono();
app.use(
	'*',
	cors({
		origin: '*',
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
		await projectStorage.ensureDefaultConfigExists();
		console.log('Default project configuration initialized');
	} catch (error) {
		console.error('Failed to initialize default project configuration:', error);
	}
};

initServer();

export default app;
