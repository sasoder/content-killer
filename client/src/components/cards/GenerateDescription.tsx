import { useState, useEffect, FormEvent } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useVideoGen } from '@/context/VideoGenContext';
import { generateDescription, generateMetadata } from '@/api/apiHelper';
import { VideoMetadata } from '@shared/types/api/schema';
import { validateUrl } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import StepOptions from '@/components/cards/StepOptions';
import { descriptionOptionDefinitions } from '@/lib/options/optionDefinitions';
import { Icons } from '@/components/icons';
import { DescriptionOptions } from '@shared/types/options';

const GenerateDescription = () => {
	const { toast } = useToast();
	const { updateDescription, updateMetadata, metadata, id, options } = useVideoGen();
	const [url, setUrl] = useState<string>('');
	const [isLoading, setIsLoading] = useState(false);
	const [descriptionOptions, setDescriptionOptions] = useState<DescriptionOptions>(options.description);

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

		setIsLoading(true);
		try {
			if (url) {
				const fetchedMetadata: VideoMetadata = await generateMetadata(id, url);
				updateMetadata(fetchedMetadata);
			}
			const newData = await generateDescription(id, url, descriptionOptions);
			updateDescription(newData);
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
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className='flex h-full flex-col'>
			<div className='flex-grow'>
				<label htmlFor='url' className='block text-sm font-medium text-gray-700'>
					YouTube URL
				</label>
				<Input
					id='url'
					type='text'
					placeholder='https://www.example.com'
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
				<div className='flex flex-grow flex-col gap-2'>
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
