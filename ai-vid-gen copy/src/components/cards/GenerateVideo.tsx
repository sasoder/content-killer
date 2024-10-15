import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useVideoGen } from '@/context/VideoGenContext';
import { defaultVideoOptions } from '@/lib/defaultOptions';
import { VideoOptions } from '@/lib/schema';
import { Icons } from '@/components/icons';
import { toast } from '@/hooks/use-toast';

const GenerateVideo = () => {
	const { generateVideoFile, commentary, audioFiles } = useVideoGen();
	const [isLoading, setIsLoading] = useState(false);
	const [options, setOptions] = useState<VideoOptions>(defaultVideoOptions);

	const handleGenerate = async () => {
		if (!commentary || commentary.items.length === 0 || !audioFiles || audioFiles.length === 0) {
			toast({
				title: 'Invalid data',
				description: 'Make sure you have generated commentary and audio files.',
				variant: 'destructive',
			});
			return;
		}

		setIsLoading(true);
		try {
			await generateVideoFile(options);
			toast({
				title: 'Success',
				description: 'Video generated successfully.',
			});
		} catch (error) {
			console.error('Error generating content:', error);
			toast({
				title: 'Error',
				description: 'Failed to generate video. Please try again.',
				variant: 'destructive',
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div>
			<div className='flex justify-center pt-4'>
				<Button onClick={handleGenerate} className='font-bold'>
					{isLoading ? (
						<>
							<Icons.loader className='mr-2 h-[1.2rem] w-[1.2rem] animate-spin' />
							Generating...
						</>
					) : (
						'Generate Video'
					)}
				</Button>
			</div>
		</div>
	);
};

export default GenerateVideo;
