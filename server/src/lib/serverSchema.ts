import { SchemaType } from '@google/generative-ai';
import { CommentaryOptions, DescriptionOptions, VideoOptions } from '@content-killer/shared';
import { z } from 'zod';

export const timestampTextSchema = {
	description: 'Text with a timestamp',
	type: SchemaType.ARRAY,
	items: {
		type: SchemaType.OBJECT,
		properties: {
			timestamp: { type: SchemaType.STRING, description: 'Timestamp of the text', nullable: false },
			text: { type: SchemaType.STRING, description: 'Text to be displayed', nullable: false },
		},
		required: ['timestamp', 'text'],
	},
};

export const TimestampTextSchema = z.array(
	z.object({
		timestamp: z.string(),
		text: z.string(),
	}),
);

export const DescriptionOptionsSchema = z.object({
	url: z.string(),
	options: z.custom<DescriptionOptions>(),
});

export const CommentaryOptionsSchema = z.object({
	options: z.custom<CommentaryOptions>(),
});

export const VideoOptionsSchema = z.object({
	options: z.custom<VideoOptions>(),
});

export const ProjectOptionsSchema = z.object({
	templateId: z.string().optional(),
});
