import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { router, RouterType } from './routes';

const app = new Hono();

app.use('*', cors());
app.route('/api', router);

export type AppType = RouterType;
export default app;
