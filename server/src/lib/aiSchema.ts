import { SchemaType } from '@google/generative-ai';
import { TimestampText } from '@shared/types/api/schema';

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
