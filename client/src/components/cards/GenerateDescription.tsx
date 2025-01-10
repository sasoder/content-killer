import { useState, useEffect, FormEvent, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useProject } from '@/context/ProjectContext';
import { validateUrl } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import StepOptions from '@/components/cards/StepOptions';
import { descriptionOptionDefinitions } from '@/lib/options/optionDefinitions';
import { Icons } from '@/components/icons';
import { useDescriptionGeneration } from '@/hooks/useDescriptionGeneration';
import { DescriptionGenerationStep } from '@shared/types/api/schema';
import StepProgress from '@/components/cards/StepProgress';

const GenerateDescription = () => {
	const { toast } = useToast();
	const { metadata, id, options, updateMetadata } = useProject();
	const [url, setUrl] = useState(metadata?.url ?? '');
	const [descriptionOptions, setDescriptionOptions] = useState(options?.description ?? {});
	const { generate, isLoading, state } = useDescriptionGeneration(id);

	const steps = useMemo(
		() => [
			{ id: DescriptionGenerationStep.PREPARING, label: 'Sending generation request' },
			{
				id: DescriptionGenerationStep.DOWNLOADING,
				label: 'Downloading video',
				showProgress: true,
			},
			{ id: DescriptionGenerationStep.UPLOADING, label: 'Uploading video to Gemini' },
			{ id: DescriptionGenerationStep.PROCESSING, label: 'File API processing video' },
			{ id: DescriptionGenerationStep.GENERATING, label: 'Generating description' },
		],
		[],
	);

	useEffect(() => {
		if (metadata?.url) {
			setUrl(metadata.url);
		}
	}, [metadata]);

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
					<StepProgress steps={steps} state={state} />

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
