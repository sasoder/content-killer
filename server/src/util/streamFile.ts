import { Context } from 'hono';

export async function streamFile(c: Context, buffer: Buffer) {
	const stream = new ReadableStream({
		start(controller) {
			controller.enqueue(buffer);
			controller.close();
		},
	});

	return new Response(stream);
}
