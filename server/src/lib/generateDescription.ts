import { DescriptionOptions } from '@shared/types/options';
import { TimestampText, DescriptionGenerationStep, DescriptionGenerationState } from '@shared/types/api/schema';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager, FileState } from '@google/generative-ai/server';
import { downloadVideo } from './downloadVideo';
import { projectStorage } from '@/db/storage';
import { DESCRIPTION_PROMPT } from './prompts';
import { timestampTextSchema } from './serverSchema';

const fileManager = new GoogleAIFileManager(process.env.GOOGLE_API_KEY!);
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

const progressMap = new Map<string, DescriptionGenerationState>();

export function updateProgress(id: string, update: Partial<DescriptionGenerationState>) {
	const current = progressMap.get(id) || {
		currentStep: DescriptionGenerationStep.IDLE,
		completedSteps: [],
		progress: undefined,
	};

	const newState = {
		...current,
		...update,
	};

	// Add completed step if moving to next step
	if (update.currentStep && update.currentStep !== current.currentStep) {
		// Only add non-IDLE steps to completedSteps
		if (current.currentStep !== DescriptionGenerationStep.IDLE) {
			newState.completedSteps = [...current.completedSteps, current.currentStep];
		}
	}

	progressMap.set(id, newState);
}

const resetProgress = (id: string) => {
	progressMap.delete(id);
};

export function getGenerationProgress(id: string) {
	return progressMap.get(id);
}

export async function generateDescription(id: string, url: string, options: DescriptionOptions) {
	try {
		// Download video
		resetProgress(id);
		updateProgress(id, {
			currentStep: DescriptionGenerationStep.PREPARING,
			progress: undefined,
		});

		updateProgress(id, {
			currentStep: DescriptionGenerationStep.DOWNLOADING,
			progress: 0,
		});

		const videoPath = await downloadVideo(url, id, (progress: number) => {
			updateProgress(id, { progress });
		});

		// Upload to Gemini File API
		updateProgress(id, {
			currentStep: DescriptionGenerationStep.UPLOADING,
			progress: undefined,
		});
		const uploadResponse = await fileManager.uploadFile(videoPath, {
			mimeType: 'video/mp4',
			displayName: `video-${id}`,
		});

		// console.log('Video uploaded to Gemini File API', uploadResponse);

		// Wait for processing
		updateProgress(id, {
			currentStep: DescriptionGenerationStep.PROCESSING,
			progress: undefined,
		});
		let file = await fileManager.getFile(uploadResponse.file.name);
		while (file.state === FileState.PROCESSING) {
			await new Promise(resolve => setTimeout(resolve, 1000));
			file = await fileManager.getFile(uploadResponse.file.name);
		}

		if (file.state === FileState.FAILED) {
			throw new Error('Video processing failed');
		}

		// Generate description
		updateProgress(id, {
			currentStep: DescriptionGenerationStep.GENERATING,
			progress: undefined,
		});
		const model = genAI.getGenerativeModel({
			model: 'gemini-1.5-pro',
			generationConfig: { responseMimeType: 'application/json', responseSchema: timestampTextSchema },
		});
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

		updateProgress(id, {
			currentStep: DescriptionGenerationStep.COMPLETED,
		});
	} catch (error) {
		console.error('Error in description generation:', error);
		const errorMsg = error instanceof Error ? error.message : 'Unknown error';
		updateProgress(id, {
			currentStep: DescriptionGenerationStep.ERROR,
			progress: undefined,
			error: {
				step: DescriptionGenerationStep.ERROR,
				message: errorMsg,
			},
		});
		throw error;
	}
}
