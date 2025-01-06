import { DescriptionOptions } from '@shared/types/options';
import { TimestampText, DescriptionGenerationStep } from '@shared/types/api/schema';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager, FileState } from '@google/generative-ai/server';
import { downloadVideo } from './downloadVideo';
import { projectStorage } from '@/db/storage';
import { DESCRIPTION_PROMPT } from './prompts';

const fileManager = new GoogleAIFileManager(process.env.GOOGLE_API_KEY!);
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

// Keep track of generation progress
const progressMap = new Map<
	string,
	{
		step: DescriptionGenerationStep;
		progress: number;
		error?: string;
	}
>();

export function getGenerationProgress(id: string) {
	return progressMap.get(id);
}

type StateUpdateCallback = (
	step: DescriptionGenerationStep,
	progress: number,
	error?: { step: DescriptionGenerationStep; message: string },
) => Promise<void>;

export async function generateDescription(
	id: string,
	url: string,
	options: DescriptionOptions,
	onStateUpdate: StateUpdateCallback,
) {
	try {
		console.log('Generating description for', id);
		// Download video
		progressMap.set(id, { step: DescriptionGenerationStep.DOWNLOADING, progress: 0 });
		await onStateUpdate(DescriptionGenerationStep.DOWNLOADING, 0);
		const videoPath = await downloadVideo(url, id, async (progress: number) => {
			console.log('Download progress:', progress);
			progressMap.set(id, { step: DescriptionGenerationStep.DOWNLOADING, progress });
			await onStateUpdate(DescriptionGenerationStep.DOWNLOADING, progress);
		});

		console.log('Video downloaded and saved to', videoPath);
		// Upload to Gemini File API
		progressMap.set(id, { step: DescriptionGenerationStep.UPLOADING, progress: 0 });
		await onStateUpdate(DescriptionGenerationStep.UPLOADING, 0);
		const uploadResponse = await fileManager.uploadFile(videoPath, {
			mimeType: 'video/mp4',
			displayName: `video-${id}`,
		});

		console.log('Video uploaded to Gemini File API', uploadResponse);

		// Wait for processing
		progressMap.set(id, { step: DescriptionGenerationStep.PROCESSING, progress: 0 });
		await onStateUpdate(DescriptionGenerationStep.PROCESSING, 0);
		let file = await fileManager.getFile(uploadResponse.file.name);
		while (file.state === FileState.PROCESSING) {
			await new Promise(resolve => setTimeout(resolve, 1000));
			file = await fileManager.getFile(uploadResponse.file.name);
		}

		console.log('Video processing completed');

		if (file.state === FileState.FAILED) {
			throw new Error('Video processing failed');
		}

		// Generate description
		progressMap.set(id, { step: DescriptionGenerationStep.GENERATING, progress: 0 });
		await onStateUpdate(DescriptionGenerationStep.GENERATING, 0);
		const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
		const result = await model.generateContent([
			{
				fileData: {
					mimeType: file.mimeType,
					fileUri: file.uri,
				},
			},
			{ text: DESCRIPTION_PROMPT },
		]);

		const description = JSON.parse(result.response.text());

		// Update project state
		const project = await projectStorage.getProject(id);
		if (project) {
			project.description = description;
			project.options.description = options;
			await projectStorage.updateProjectState(project);
		}

		progressMap.set(id, { step: DescriptionGenerationStep.COMPLETED, progress: 100 });
		await onStateUpdate(DescriptionGenerationStep.COMPLETED, 100);
	} catch (error) {
		console.error('Error in description generation:', error);
		const errorMsg = error instanceof Error ? error.message : 'Unknown error';
		progressMap.set(id, {
			step: DescriptionGenerationStep.ERROR,
			progress: 0,
			error: errorMsg,
		});
		await onStateUpdate(DescriptionGenerationStep.ERROR, 0, {
			step: DescriptionGenerationStep.ERROR,
			message: errorMsg,
		});
		throw error;
	}
}
