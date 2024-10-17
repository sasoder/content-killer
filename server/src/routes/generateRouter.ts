import { Hono } from 'hono';
import { generateDescription } from '@/util/generateDescription';
import { generateMetadata } from '@/util/generateMetadata';
import { generateCommentary } from '@/util/generateCommentary';
import { DescriptionOptions, CommentaryOptions } from '@shared/types/options';
import { TimestampTextList, VideoMetadata } from '@shared/types/api/schema';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const DescriptionOptionsSchema = z.object({
	url: z.string(),
	options: z.custom<DescriptionOptions>(),
});

const CommentaryOptionsSchema = z.object({
	description: z.custom<TimestampTextList>(),
	options: z.custom<CommentaryOptions>(),
});

const router = new Hono()
	.post('/description', zValidator('json', DescriptionOptionsSchema), async c => {
		const { url, options } = c.req.valid('json');
		const description = await generateDescription(url, options);
		return c.json(description);
	})
	.post(
		'/metadata',
		zValidator(
			'json',
			z.object({
				url: z.string(),
			}),
		),
		async c => {
			const { url } = c.req.valid('json');
			const metadata: VideoMetadata = await generateMetadata(url);
			return c.json(metadata);
		},
	)
	.post('/commentary', zValidator('json', CommentaryOptionsSchema), async c => {
		const { description, options } = c.req.valid('json');
		const commentary = await generateCommentary(description, options);
		return c.json(commentary);
	});
export { router as generateRouter };
