import { useState, useEffect, FormEvent } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useVideoGen } from '@/context/VideoGenContext';
import { validateUrl } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import StepOptions from '@/components/cards/StepOptions';
import { descriptionOptionDefinitions } from '@/lib/options/optionDefinitions';
import { Icons } from '@/components/icons';
import { DescriptionOptions } from '@shared/types/options';
import { useDescriptionGeneration } from '@/hooks/useDescriptionGeneration';

const GenerateDescription = () => {
	const { toast } = useToast();
	const { updateDescription, updateMetadata, metadata, id, options } = useVideoGen();
	const [url, setUrl] = useState<string>('');
	const [descriptionOptions, setDescriptionOptions] = useState<DescriptionOptions>(options.description);
	const { generate, isLoading, error } = useDescriptionGeneration(id);

	useEffect(() => {
		if (metadata?.url) {
			setUrl(metadata.url);
		}
	}, [metadata]);

	const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		if (!validateUrl(url) && !descriptionOptions.sample) {
			toast({
				title: 'Invalid URL',
				description: 'Please enter a valid URL.',
				variant: 'destructive',
			});
			return;
		}

		try {
			const result = await generate(url, descriptionOptions);
			updateDescription(result.description);

			if ('metadata' in result && result.metadata) {
				updateMetadata(result.metadata);
			}

			toast({
				title: 'Success',
				description: 'Description generated successfully.',
			});
		} catch (error) {
			console.error('Error generating content:', error);
			toast({
				title: 'Error',
				description: 'Failed to generate description. Please try again.',
				variant: 'destructive',
			});
		}
	};

	return (
		<form onSubmit={handleSubmit} className='flex h-full flex-col'>
			<div className='flex-grow'>
				<label htmlFor='url' className='text-muted-foreground block text-sm font-medium'>
					YouTube URL
				</label>
				<Input
					id='url'
					type='text'
					placeholder='https://youtu.be/dQw4w9WgXcQ'
					value={url}
					onChange={e => setUrl(e.target.value)}
					className='mt-1'
				/>
				<p className='mt-2 text-sm text-gray-500'>
					Enter the URL of the YouTube video you want to generate a description for.
				</p>
				{metadata?.title && metadata?.duration && (
					<div className='mt-4'>
						<Separator />
						<p className='text-sm text-gray-500'>Title: {metadata.title}</p>
						<p className='text-sm text-gray-500'>Duration: {metadata.duration}</p>
					</div>
				)}
			</div>
			<div className='flex justify-center'>
				<div className='flex flex-grow flex-col gap-4'>
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
									<Icons.loader className='mr-2 h-[1.2rem] w-[1.2rem] animate-spin' />
									Generating...
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
