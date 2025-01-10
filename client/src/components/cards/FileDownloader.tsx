import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useProject } from '@/context/ProjectContext';
import { Icons } from '@/components/icons';
import { VideoGenerationStep } from '@shared/types/api/schema';
import { downloadFile } from '@/api/honoClient';
import { toast } from '@/hooks/use-toast';
import { useVideoGeneration } from '@/hooks/useVideoGeneration';
import StepProgress from '@/components/cards/StepProgress';

const FileDownloader = () => {
	const { id, options } = useProject();
	const { state } = useVideoGeneration(id);
	const [isDownloadingAudio, setIsDownloadingAudio] = useState(false);
	const [isDownloadingVideo, setIsDownloadingVideo] = useState(false);

	const steps = useMemo(
		() =>
			[
				{ id: VideoGenerationStep.PREPARING, label: 'Preparing generation' },
				{ id: VideoGenerationStep.SCALING_VIDEO, label: 'Scaling video' },
				{ id: VideoGenerationStep.TRANSCRIBING, label: 'Transcribing with Whisper' },
				{ id: VideoGenerationStep.GENERATING_AUDIO, label: 'Generating audio with ElevenLabs' },
				{ id: VideoGenerationStep.PROCESSING_VIDEO, label: 'Processing with ffmpeg' },
				{ id: VideoGenerationStep.FINALIZING, label: 'Finalizing output' },
			].filter(step => step.id !== VideoGenerationStep.TRANSCRIBING || options?.video?.video.subtitlesEnabled),
		[options?.video?.video.subtitlesEnabled],
	);

	if (!state || state.currentStep === VideoGenerationStep.IDLE) {
		return null;
	}

	const { currentStep, completedSteps = [], error } = state;
	const isComplete = currentStep === VideoGenerationStep.COMPLETED;

	console.log(state);

	const handleDownloadAudio = async () => {
		try {
			setIsDownloadingAudio(true);
			await downloadFile(id, 'audio');
		} catch (error) {
			toast({
				title: 'Error',
				description: 'Failed to download audio files. Please try again.',
				variant: 'destructive',
			});
		} finally {
			setIsDownloadingAudio(false);
		}
	};

	const handleDownloadVideo = async () => {
		try {
			setIsDownloadingVideo(true);
			await downloadFile(id, 'video');
		} catch (error) {
			toast({
				title: 'Error',
				description: 'Failed to download video file. Please try again.',
				variant: 'destructive',
			});
		} finally {
			setIsDownloadingVideo(false);
		}
	};

	return (
		<div className='flex h-full flex-col gap-4'>
			<div className='flex flex-grow flex-col justify-end'>
				<StepProgress steps={steps} state={state} />
			</div>
			<div className='flex flex-col items-center gap-4'>
				<Button
					onClick={handleDownloadAudio}
					className='w-fit'
					disabled={!completedSteps.includes(VideoGenerationStep.GENERATING_AUDIO) || isDownloadingAudio}
				>
					{isDownloadingAudio ? (
						<>
							<Icons.loader className='mr-2 h-[1.2rem] w-[1.2rem] animate-spin' />
							Downloading Audio...
						</>
					) : (
						'Download Audio'
					)}
				</Button>
				<Button onClick={handleDownloadVideo} className='w-fit' disabled={!isComplete || isDownloadingVideo}>
					{isDownloadingVideo ? (
						<>
							<Icons.loader className='mr-2 h-[1.2rem] w-[1.2rem] animate-spin' />
							Downloading Video...
						</>
					) : (
						'Download Video'
					)}
				</Button>
			</div>
		</div>
	);
};

export default FileDownloader;
