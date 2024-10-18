import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useVideoGen } from '@/context/VideoGenContext';
import { VideoOptions } from '@shared/types/options';
import { Icons } from '@/components/icons';
import { toast } from '@/hooks/use-toast';
import { videoOptionDefinitions } from '@/lib/options/optionDefinitions';
import StepOptions from '@/components/cards/StepOptions';
import QuickInfo from '@/components/QuickInfo';
import { generateVideo } from '@/api/apiHelper';

const GenerateVideo = () => {
	const { commentary, id, updateVideoId, updateAudioIds, options } = useVideoGen();
	const [isLoading, setIsLoading] = useState(false);
	const [videoOptions, setVideoOptions] = useState<VideoOptions>(options.video);
	console.log(commentary);

	const generateVideoFile = async (options: VideoOptions) => {
		try {
			const { videoId, audioIds } = await generateVideo(id, commentary!, options);
			updateVideoId(videoId);
			updateAudioIds(audioIds);
		} catch (error) {
			console.error('Error generating video:', error);
		}
	};
	const handleGenerate = async () => {
		if (!commentary || commentary.length === 0) {
			toast({
				title: 'Invalid data',
				description: 'Make sure you have generated commentary and audio files.',
				variant: 'destructive',
			});
			return;
		}

		setIsLoading(true);
		try {
			await generateVideoFile(videoOptions);
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
		<div className='flex h-full flex-col'>
			<div className='flex-grow'>
				<QuickInfo data={commentary} />
			</div>
			<div className='flex justify-center'>
				<div className='flex flex-grow flex-col gap-2'>
					<StepOptions
						options={videoOptions}
						onOptionChange={setVideoOptions}
						optionDefinitions={videoOptionDefinitions}
					/>
					<Button onClick={handleGenerate} disabled={!commentary || commentary.length === 0 || isLoading}>
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
		</div>
	);
};

export default GenerateVideo;
