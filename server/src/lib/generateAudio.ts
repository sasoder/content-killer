import { VideoOptions } from '@shared/types/options';
import { TimestampText, AudioGenStatus } from '@shared/types/api/schema';
import { ElevenLabsClient } from 'elevenlabs';
import { projectStorage } from '@/db/storage';
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
	onStatusUpdate: (status: AudioGenStatus, errorStep?: AudioGenStatus) => Promise<void>,
): Promise<string[]> => {
	try {
		const projectDir = path.join('data', id);
		const commentaryDir = path.join(projectDir, 'commentary');
		await fs.mkdir(commentaryDir, { recursive: true });

		const audioPromises = commentary.map(async entry => {
			const filename = `${entry.timestamp.replace(':', '')}.mp3`;
			const filePath = path.join(commentaryDir, filename);

			const buffer = await generateSingleAudio(entry.text, options);
			await fs.writeFile(filePath, buffer);

			return filename;
		});

		const audioFilenames = await Promise.all(audioPromises);
		await onStatusUpdate(AudioGenStatus.COMPLETED);
		return audioFilenames;
	} catch (error) {
		console.error('Error generating audio files:', error);
		await onStatusUpdate(AudioGenStatus.ERROR, AudioGenStatus.GENERATING);
		return [];
	}
};
