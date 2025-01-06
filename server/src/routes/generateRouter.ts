import { Hono } from 'hono';
import { generateDescription, getGenerationProgress } from '@/lib/generateDescription';
import { generateMetadata } from '@/lib/generateMetadata';
import { generateCommentary } from '@/lib/generateCommentary';
import { generateVideo } from '@/lib/generateVideo';
import { generateAudio } from '@/lib/generateAudio';
import { DescriptionOptions, CommentaryOptions, VideoOptions } from '@shared/types/options';
import { VideoGenerationStep, DescriptionGenerationStep, VideoGenState, VideoMetadata } from '@shared/types/api/schema';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { projectStorage, updateVideoGenerationState } from '@/db/storage';
import { generateProjectId } from '@/lib/util';
import { defaultProjectTemplate } from '@shared/types/options/defaultTemplates';

const DescriptionOptionsSchema = z.object({
	url: z.string(),
	options: z.custom<DescriptionOptions>(),
});

const CommentaryOptionsSchema = z.object({
	description: z.array(
		z.object({
			timestamp: z.string(),
			text: z.string(),
		}),
	),
	options: z.custom<CommentaryOptions>(),
});

const VideoOptionsSchema = z.object({
	commentary: z.array(
		z.object({
			timestamp: z.string(),
			text: z.string(),
		}),
	),
	options: z.custom<VideoOptions>(),
});

const ProjectOptionsSchema = z.object({
	templateId: z.string().optional(),
});

const generateRouter = new Hono()
	.post('/project', zValidator('json', ProjectOptionsSchema), async c => {
		const { templateId } = c.req.valid('json');
		const id = generateProjectId();
		let optionTemplate = undefined;
		if (templateId) {
			const template = await projectStorage.getProjectTemplate(templateId);
			if (template) {
				optionTemplate = template;
			}
		}

		// Create project with template first
		const project = await projectStorage.createProject(id, optionTemplate);

		// Then initialize the generation states
		project.descriptionGenerationState = {
			currentStep: DescriptionGenerationStep.IDLE,
			completedSteps: [],
		};
		project.videoGenerationState = {
			currentStep: VideoGenerationStep.IDLE,
			completedSteps: [],
		};
		await projectStorage.updateProjectState(project);

		return c.json(project, 201);
	})
	.post('/projectTemplate', async c => {
		try {
			const template = {
				...defaultProjectTemplate,
				id: crypto.randomUUID(),
				createdAt: new Date().toISOString(),
				pauseSoundFilename: 'pause_default.wav',
			};

			await projectStorage.createProjectTemplate(template);

			// Copy the default pause sound to the new template
			const defaultPauseSound = await projectStorage.getProjectTemplateFile('default', 'pause_default.wav');
			await projectStorage.updateTemplatePauseSound(template.id, template.pauseSoundFilename, defaultPauseSound);

			return c.json(template, 201);
		} catch (error) {
			console.error('Error creating project template:', error);
			return c.json({ message: 'Failed to create project template' }, 500);
		}
	})
	.post('/metadata/:id', zValidator('json', z.object({ url: z.string() })), async c => {
		const { url } = c.req.valid('json');
		const id = c.req.param('id');
		const project = await projectStorage.getProject(id);
		if (project) {
			const metadata: Partial<VideoMetadata> = await generateMetadata(url);
			const fullMetadata = { ...metadata, url };
			project.metadata = { ...project.metadata, ...fullMetadata };
			await projectStorage.updateProjectState(project);
			return c.json(fullMetadata);
		}
		return c.json({ error: 'Project not found' }, 404);
	})
	.post('/commentary/:id', zValidator('json', CommentaryOptionsSchema), async c => {
		const { description, options } = c.req.valid('json');
		const id = c.req.param('id');
		const project = await projectStorage.getProject(id);
		const commentary = await generateCommentary(description, options);
		if (project) {
			project.commentary = commentary;
			project.description = description;
			project.options.commentary = options;
			await projectStorage.updateProjectState(project);
		}
		return c.json(commentary);
	})
	.post('/video/:id', zValidator('json', VideoOptionsSchema), async c => {
		const { commentary, options } = c.req.valid('json');
		const id = c.req.param('id');

		try {
			const project = await projectStorage.getProject(id);
			if (!project?.metadata?.url && !project?.metadata?.url) {
				return c.json({ error: 'No video URL found' }, 400);
			}

			project.commentary = commentary;
			project.options.video = options;
			await updateVideoGenerationState(project, VideoGenerationStep.PREPARING);
			await updateVideoGenerationState(project, VideoGenerationStep.GENERATING_AUDIO);
			// remove existing audio files
			await projectStorage.deleteProjectCommentary(id);
			await generateAudio(id, commentary, options.audio);
			await generateVideo(project, options, (step, error) => updateVideoGenerationState(project, step, error));
			await updateVideoGenerationState(project, VideoGenerationStep.COMPLETED);

			return c.json({ success: true });
		} catch (error) {
			// Update error state
			const project = await projectStorage.getProject(id);
			if (project) {
				await updateVideoGenerationState(project, VideoGenerationStep.ERROR, {
					step: VideoGenerationStep.FINALIZING,
					message: error instanceof Error ? error.message : 'Unknown error',
				});
			}
			console.error('Error generating video:', error);
			return c.json({ error: 'Failed to generate video' }, 500);
		}
	})
	.post('/description/:id/start', zValidator('json', DescriptionOptionsSchema), async c => {
		const { url, options } = c.req.valid('json');
		console.log('url', url);
		const id = c.req.param('id');

		try {
			const project = await projectStorage.getProject(id);
			if (!project) {
				return c.json({ error: 'Project not found' }, 404);
			}

			// Start the process in the background
			generateDescription(id, url, options, async (step, progress, error) => {
				const currentProject = await projectStorage.getProject(id);
				if (currentProject) {
					currentProject.descriptionGenerationState = {
						currentStep: step,
						completedSteps: [...(currentProject.descriptionGenerationState.completedSteps || [])],
						progress,
						...(error && { error }),
					};
					await projectStorage.updateProjectState(currentProject);
				}
			}).catch(error => {
				console.error('Error in description generation:', error);
			});

			return c.json({ message: 'Generation started' });
		} catch (error) {
			console.error('Error starting generation:', error);
			return c.json({ error: 'Failed to start generation' }, 500);
		}
	})
	.get('/description/:id/status', async c => {
		const id = c.req.param('id');

		// Set up SSE headers
		c.header('Content-Type', 'text/event-stream');
		c.header('Cache-Control', 'no-cache');
		c.header('Connection', 'keep-alive');

		// Create SSE stream
		const stream = new ReadableStream({
			async start(controller) {
				const sendProgress = () => {
					const progress = getGenerationProgress(id);
					console.log('progress', progress);
					if (!progress) return false;

					const data = JSON.stringify({
						type: 'progress',
						...progress,
					});
					controller.enqueue(`data: ${data}\n\n`);

					// If we're done or have an error, stop sending updates
					return (
						progress.step !== DescriptionGenerationStep.COMPLETED && progress.step !== DescriptionGenerationStep.ERROR
					);
				};

				// Send updates every second until complete
				while (sendProgress()) {
					await new Promise(resolve => setTimeout(resolve, 1000));
				}

				// Send final state
				const finalProgress = getGenerationProgress(id);
				if (finalProgress?.step === DescriptionGenerationStep.ERROR) {
					controller.enqueue(
						`data: ${JSON.stringify({
							type: 'error',
							error: finalProgress.error,
						})}\n\n`,
					);
				} else {
					controller.enqueue(
						`data: ${JSON.stringify({
							type: 'complete',
						})}\n\n`,
					);
				}

				controller.close();
			},
		});

		return new Response(stream);
	});

export { generateRouter };
