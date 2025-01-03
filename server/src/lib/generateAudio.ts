import { VideoOptions } from '@shared/types/options';
import { TimestampText } from '@shared/types/api/schema';
import { ElevenLabsClient } from 'elevenlabs';
import * as path from 'path';
import * as fs from 'fs/promises';

const client = new ElevenLabsClient({
	apiKey: process.env.ELEVENLABS_API_KEY,
});

const generateSingleAudio = async (text: string, options: VideoOptions['audio']): Promise<Buffer> => {
	try {
		const audio = await client.generate({
			voice: options.voiceId,
			model_id: 'eleven_turbo_v2',
			text,
			voice_settings: {
				stability: options.stability,
				similarity_boost: 0.8,
				style: 0.0,
				use_speaker_boost: true,
			},
		});

		const chunks: Buffer[] = [];
		for await (const chunk of audio) {
			chunks.push(Buffer.from(chunk));
		}
		return Buffer.concat(chunks);
	} catch (error) {
		console.error('Error generating audio:', error);
		throw error;
	}
};

export const generateAudio = async (
	id: string,
	commentary: TimestampText[],
	options: VideoOptions['audio'],
): Promise<void> => {
	try {
		const projectDir = path.join('data', id);
		const commentaryDir = path.join(projectDir, 'commentary');
		await fs.mkdir(commentaryDir, { recursive: true });

		const audioPromises = commentary.map(async entry => {
			const timestamp = entry.timestamp.replace(':', '');
			const filename = `${timestamp}.mp3`;
			const filePath = path.join(commentaryDir, filename);

			const buffer = await generateSingleAudio(entry.text, options);
			await fs.writeFile(filePath, buffer);

			return filename;
		});

		await Promise.all(audioPromises);
	} catch (error) {
		console.error('Error generating audio files:', error);
		throw error;
	}
};
