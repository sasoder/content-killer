import { useState, useEffect, FormEvent } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useProject } from '@/context/ProjectContext';
import { validateUrl } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import StepOptions from '@/components/cards/StepOptions';
import { descriptionOptionDefinitions } from '@/lib/options/optionDefinitions';
import { Icons } from '@/components/icons';
import { useDescriptionGeneration } from '@/hooks/useDescriptionGeneration';
import { DescriptionGenerationStep } from '@shared/types/api/schema';

const GenerateDescription = () => {
	const { toast } = useToast();
	const { metadata, id, options, updateMetadata } = useProject();
	const [url, setUrl] = useState(metadata?.url ?? '');
	const [descriptionOptions, setDescriptionOptions] = useState(options?.description ?? {});
	const { generate, isLoading, state } = useDescriptionGeneration(id);

	const step = state?.currentStep || DescriptionGenerationStep.IDLE;
	const completedSteps = state?.completedSteps || [];
	const progress = state?.progress;
	const error = state?.error;

	useEffect(() => {
		if (metadata?.url) {
			setUrl(metadata.url);
		}
	}, [metadata]);

	const getStepDetails = (step: DescriptionGenerationStep) => {
		switch (step) {
			case DescriptionGenerationStep.PREPARING:
				return {
					label: 'Sending generation request',
					icon: <Icons.loader className='h-4 w-4 animate-spin' />,
				};
			case DescriptionGenerationStep.DOWNLOADING:
				return {
					label: 'Downloading video',
					icon: <Icons.upload className='h-4 w-4 animate-pulse' />,
				};
			case DescriptionGenerationStep.UPLOADING:
				return {
					label: 'Uploading video to Gemini',
					icon: <Icons.upload className='h-4 w-4 animate-pulse' />,
				};
			case DescriptionGenerationStep.PROCESSING:
				return {
					label: 'File API processing video',
					icon: <Icons.bot className='h-4 w-4 animate-pulse' />,
				};
			case DescriptionGenerationStep.GENERATING:
				return {
					label: 'Generating description',
					icon: <Icons.pencil className='h-4 w-4 animate-pulse' />,
				};
			default:
				return { label: '', icon: null };
		}
	};

	const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		if (!validateUrl(url)) {
			toast({
				title: 'Invalid URL',
				description: 'Please enter a valid URL.',
				variant: 'destructive',
			});
			return;
		}

		try {
			// First update metadata so we have the video info
			updateMetadata(url);

			// Then start the description generation
			generate(url, descriptionOptions, {
				onSuccess: () => {
					toast({
						title: 'Success',
						description: 'Description generation started.',
					});
				},
				onError: error => {
					console.error('Error generating content:', error);
					const errorMessage =
						error instanceof Error ? error.message : 'Failed to generate description. Please try again.';

					toast({
						title: 'Error',
						description: errorMessage,
						variant: 'destructive',
					});
				},
			});
		} catch (error) {
			console.error('Error updating metadata:', error);
			toast({
				title: 'Error',
				description: 'Failed to update video metadata. Please try again.',
				variant: 'destructive',
			});
		}
	};

	return (
		<form onSubmit={handleSubmit} className='flex h-full flex-col'>
			<div className='flex-grow pb-2'>
				<label htmlFor='url' className='text-muted-foreground block text-sm font-medium'>
					YouTube URL
				</label>
				<Input
					id='url'
					type='text'
					placeholder='https://youtu.be/dQw4w9WgXcQ'
					value={url}
					onChange={e => setUrl(e.target.value)}
					className='placeholder:text-muted-foreground/50 mt-1'
				/>
				<p className='mt-2 text-sm text-gray-500'>
					Enter the URL of the YouTube video you want to generate a video for.
				</p>
				{metadata?.title && metadata?.duration && (
					<div className='mt-4'>
						<Separator />
						<p className='text-sm text-gray-500'>Title: {metadata.title}</p>
						<p className='text-sm text-gray-500'>
							Length: {Math.floor(metadata.duration / 60)}:{(metadata.duration % 60).toString().padStart(2, '0')}
						</p>
					</div>
				)}
			</div>

			<div className='flex justify-center'>
				<div className='flex flex-grow flex-col gap-4'>
					<div className='flex w-full flex-col gap-2'>
						{/* Completed steps */}
						{completedSteps.map((completedStep: DescriptionGenerationStep) => (
							<div key={completedStep} className='text-muted-foreground flex items-center gap-2 text-sm'>
								<Icons.checkbox className='h-4 w-4 text-green-500' />
								<span>{getStepDetails(completedStep).label}</span>
							</div>
						))}

						{/* Current step */}
						<div className='space-y-2'>
							<div className='flex items-center justify-between text-sm'>
								<div className='flex items-center gap-2'>
									{getStepDetails(step).icon}
									<span className='text-muted-foreground'>{getStepDetails(step).label}</span>
								</div>
								{step === DescriptionGenerationStep.DOWNLOADING && progress !== undefined && (
									<span className='text-muted-foreground'>{Math.round(progress)}%</span>
								)}
							</div>
							{step === DescriptionGenerationStep.DOWNLOADING && progress !== undefined && (
								<Progress value={progress} className='w-full' />
							)}
						</div>

						{/* Error state */}
						{error && (
							<div className='text-destructive flex items-center gap-2 text-sm'>
								<Icons.alertTriangle className='h-4 w-4' />
								<span>{error.message}</span>
							</div>
						)}
					</div>

					<StepOptions
						options={descriptionOptions}
						onOptionChange={setDescriptionOptions}
						optionDefinitions={descriptionOptionDefinitions}
						type='description'
					/>

					<div className='flex justify-center'>
						<Button type='submit' disabled={isLoading}>
							{isLoading ? (
								<>
									<Icons.loader className='mr-2 h-4 w-4 animate-spin' />
									Processing...
								</>
							) : (
								'Generate Description'
							)}
						</Button>
					</div>
				</div>
			</div>
		</form>
	);
};

export default GenerateDescription;
