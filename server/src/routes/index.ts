import { Hono } from 'hono';
import { fetchRouter } from './fetchRouter';
import { generateRouter } from './generateRouter';
import { updateRouter } from './updateRouter';

const router = new Hono()
	.route('/fetch', fetchRouter)
	.route('/generate', generateRouter)
	.route('/update', updateRouter);

export type RouterType = typeof router;
export { router };
