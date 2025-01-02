import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useVideoGen } from '@/context/VideoGenContext';
import { VideoOptions } from '@shared/types/options';
import { Icons } from '@/components/icons';
import { toast } from '@/hooks/use-toast';
import { videoOptionDefinitions } from '@/lib/options/optionDefinitions';
import { useVideoGeneration } from '@/hooks/useVideoGeneration';
import StepOptions from '@/components/cards/StepOptions';
import QuickInfo from '@/components/QuickInfo';
import VoiceSelector from '@/components/VoiceSelector';

const GenerateVideo = () => {
	const { commentary, id, options } = useVideoGen();
	const [videoOptions, setVideoOptions] = useState<VideoOptions>(options.video);
	const { generate, isLoading, error } = useVideoGeneration(id);

	const handleGenerate = async () => {
		if (!commentary || commentary.length === 0) {
			toast({
				title: 'Invalid data',
				description: 'Make sure you have generated commentary and audio files.',
				variant: 'destructive',
			});
			return;
		}

		try {
			generate({ commentary, options: videoOptions });
			toast({
				title: 'Success',
				description: 'Video generation started successfully.',
			});
		} catch (error) {
			console.error('Error generating content:', error);
			toast({
				title: 'Error',
				description: 'Failed to start video generation. Please try again.',
				variant: 'destructive',
			});
		}
	};

	return (
		<div className='flex h-full flex-col'>
			<div className='flex-grow'>
				<QuickInfo data={commentary} type='commentary' />
			</div>
			<div className='flex justify-center'>
				<div className='flex flex-grow flex-col gap-4'>
					<div className='flex flex-col gap-1'>
						<StepOptions
							options={videoOptions.audio}
							onOptionChange={newOptions =>
								setVideoOptions({
									...videoOptions,
									audio: newOptions as VideoOptions['audio'],
								})
							}
							optionDefinitions={videoOptionDefinitions.audio}
							type='audio'
						/>
						<div className='flex flex-col gap-1'>
							<label className='text-sm font-medium'>Voice</label>
							<VoiceSelector
								value={videoOptions.audio.voiceId}
								onValueChange={voiceId =>
									setVideoOptions({
										...videoOptions,
										audio: {
											...videoOptions.audio,
											voiceId,
										},
									})
								}
							/>
						</div>
					</div>
					<StepOptions
						options={videoOptions.video}
						onOptionChange={newOptions =>
							setVideoOptions({
								...videoOptions,
								video: newOptions as VideoOptions['video'],
							})
						}
						optionDefinitions={videoOptionDefinitions.video}
						type='video'
					/>
					<div className='flex justify-center pt-2'>
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
		</div>
	);
};

export default GenerateVideo;
