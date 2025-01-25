import dotenv from 'dotenv';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs/promises';
import OpenAI from 'openai';

dotenv.config();

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

async function extractAudio(videoPath: string, outputPath: string): Promise<string> {
	return new Promise((resolve, reject) => {
		ffmpeg(videoPath)
			.toFormat('mp3')
			.output(outputPath)
			.on('end', () => resolve(outputPath))
			.on('error', err => reject(err))
			.run();
	});
}

export async function generateSubtitles(videoPath: string, srtPath: string): Promise<string> {
	console.log('Generating subtitles...');
	const audioPath = videoPath.replace(/\.[^/.]+$/, '.mp3');
	await extractAudio(videoPath, audioPath);

	const audioFile = await fs.readFile(audioPath);
	const audioBlob = new Blob([audioFile], { type: 'audio/mp3' });
	const file = new File([audioBlob], 'audio.mp3', { type: 'audio/mp3' });

	const transcript = await openai.audio.transcriptions.create({
		file: file,
		model: process.env.OPENAI_TRANSCRIBE_MODEL || 'whisper-1',
		language: 'en',
		response_format: 'srt',
	});

	await fs.writeFile(srtPath, transcript);

	return srtPath;
}

export async function addSubtitles(
	videoPath: string,
	srtPath: string,
	outputPath: string,
	size: number,
): Promise<string> {
	return new Promise((resolve, reject) => {
		ffmpeg(videoPath)
			.videoFilters([`subtitles=${srtPath}:force_style='FontSize=${size}'`])
			.output(outputPath)
			.on('end', () => resolve(outputPath))
			.on('error', err => reject(err))
			.run();
	});
}
