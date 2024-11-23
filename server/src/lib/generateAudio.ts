import { VideoOptions } from '@shared/types/options';
import { TimestampText } from '@shared/types/api/schema';
import { ElevenLabsClient } from 'elevenlabs';
import { projectStorage } from '@/db/storage';

const client = new ElevenLabsClient({
	apiKey: process.env.ELEVENLABS_API_KEY,
});

const generateSingleAudio = async (text: string, options: VideoOptions['audio']): Promise<Buffer> => {
	try {
		const audio = await client.generate({
			voice: options.voiceId ?? 'nPczCjzI2devNBz1zQrb',
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
): Promise<string[]> => {
	try {
		const audioPromises = commentary.map(async entry => {
			const timestamp = entry.timestamp.replace(':', '');
			const filename = `${timestamp}.mp3`;

			const buffer = await generateSingleAudio(entry.text, options);

			await projectStorage.saveFile(id, filename, buffer);

			return filename;
		});

		const audioFilenames = await Promise.all(audioPromises);
		return audioFilenames;
	} catch (error) {
		console.error('Error generating audio files:', error);
		return [];
	}
};
