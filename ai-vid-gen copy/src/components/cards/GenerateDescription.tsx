import { useState, FormEvent } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { generateDescription, generateVideoMetadata } from '@/api/apiHelper';
import { Icons } from '@/components/icons';
import { Separator } from '@/components/ui/separator';
import { useVideoGen } from '@/context/VideoGenContext';
import { defaultDescriptionOptions } from '@/lib/defaultOptions';
import StepOptions from '@/components/cards/StepOptions';
import { DescriptionOptions } from '@/lib/schema';
export default function GenerateDescription() {
	const { toast } = useToast();
	const [url, setUrl] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const { updateDescription, updateMetadata, metadata } = useVideoGen();
	const [options, setOptions] = useState<DescriptionOptions>(defaultDescriptionOptions);

	const validateUrl = (input: string): boolean => {
		try {
			new URL(input);
			return true;
		} catch {
			return false;
		}
	};

	const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		if (!validateUrl(url)) {
			toast({
				title: 'Invalid URL',
				description: 'Please enter a valid URL',
				variant: 'destructive',
			});
			return;
		}

		setIsLoading(true);
		try {
			const newData = await generateDescription(url, options);
			const metadata = await generateVideoMetadata(url);
			updateMetadata(metadata);
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
				{metadata && (
					<div>
						<Separator />
						<p className='text-sm text-gray-500'>{metadata.title}</p>
						<p className='text-sm text-gray-500'>{metadata.duration}</p>
					</div>
				)}
			</div>
			<div className='mt-4 flex justify-center'>
				<StepOptions options={options} onOptionChange={setOptions} />
				<Button type='submit' disabled={isLoading} className='w-full md:w-auto'>
					{isLoading ? (
						<>
							<Icons.loader className='mr-2 h-[1.2rem] w-[1.2rem] animate-spin' />
							Generating...
						</>
					) : (
						'Generate description'
					)}
				</Button>
			</div>
		</form>
	);
}
