import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { router, RouterType } from './routes';
import { logger } from 'hono/logger';

const app = new Hono();

app.use('*', cors());
app.use('*', logger());
app.route('/api', router);

export type AppType = RouterType;
export default app;
