import { VideoOptions } from '@shared/types/options';
import { TimestampText } from '@shared/types/api/schema';
import { ElevenLabsClient } from 'elevenlabs';
import * as path from 'path';
import * as fs from 'fs/promises';
import { PROJECTS_DIR } from '@/db/storage';
import ffmpeg from 'fluent-ffmpeg';

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

const adjustAudioTempo = (inputPath: string, outputPath: string, tempo: number): Promise<string> => {
	return new Promise((resolve, reject) => {
		console.log(`Adjusting audio tempo: Input=${inputPath}, Output=${outputPath}, Tempo=${tempo}`);

		const command = ffmpeg();

		command
			.input(inputPath)
			.audioFilters(`atempo=${tempo}`)
			.toFormat('mp3')
			.outputOptions(['-c:a', 'libmp3lame', '-b:a', '128k', '-ar', '44100', '-ac', '1'])
			.on('end', () => {
				console.log('FFmpeg process completed successfully');
				resolve(outputPath);
			})
			.save(outputPath);
	});
};

export const generateAudio = async (
	id: string,
	commentary: TimestampText[],
	options: VideoOptions['audio'],
): Promise<void> => {
	try {
		const projectDir = path.join(PROJECTS_DIR, id);
		const audioDir = path.join(projectDir, 'audio');
		await fs.mkdir(audioDir, { recursive: true });

		const audioPromises = commentary.map(async entry => {
			const timestamp = entry.timestamp.replace(':', '');
			const filename = `${timestamp}.mp3`;
			const tempPath = path.join(audioDir, `temp_${filename}`);
			const finalPath = path.join(audioDir, filename);

			const buffer = await generateSingleAudio(entry.text, options);
			await fs.writeFile(tempPath, buffer);

			if (options.speedMultiplier !== 1) {
				await adjustAudioTempo(tempPath, finalPath, options.speedMultiplier);
				await fs.unlink(tempPath);
			} else {
				await fs.rename(tempPath, finalPath);
			}

			return filename;
		});

		await Promise.all(audioPromises);
	} catch (error) {
		console.error('Error generating audio files:', error);
		throw error;
	}
};
