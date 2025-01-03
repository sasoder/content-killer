import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { router, RouterType } from './routes';
import { logger } from 'hono/logger';

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

export default app;
