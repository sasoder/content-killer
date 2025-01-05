import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useVideoGen, useVideoGenerationProgress } from '@/context/VideoGenContext';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { VideoGenerationStep } from '@shared/types/api/schema';
import { Separator } from '@/components/ui/separator';
import { downloadFile } from '@/api/apiHelper';
import { toast } from '@/hooks/use-toast';

const GENERATION_STEPS = [
	{ step: VideoGenerationStep.PREPARING, label: 'Preparing generation' },
	{ step: VideoGenerationStep.GENERATING_AUDIO, label: 'Generating audio with ElevenLabs' },
	{ step: VideoGenerationStep.DOWNLOADING_VIDEO, label: 'Downloading from YouTube' },
	{ step: VideoGenerationStep.SCALING_VIDEO, label: 'Scaling video' },
	{ step: VideoGenerationStep.TRANSCRIBING, label: 'Transcribing with Whisper' },
	{ step: VideoGenerationStep.PROCESSING_VIDEO, label: 'Processing with ffmpeg' },
	{ step: VideoGenerationStep.FINALIZING, label: 'Finalizing output' },
	{ step: VideoGenerationStep.COMPLETED, label: 'Generation complete' },
] as const;

const StepIndicator = ({
	isErrorStep,
	isActiveStep,
	isCompleted,
}: {
	isErrorStep: boolean;
	isActiveStep: boolean;
	isCompleted: boolean;
}) => {
	if (isErrorStep) return <Icons.alertTriangle className='text-destructive h-4 w-4' />;
	if (isCompleted) return <Icons.checkbox className='h-4 w-4 text-green-500' />;
	if (isActiveStep) return <Icons.loader className='h-4 w-4 animate-spin' />;
	return <Icons.dot className='text-muted-foreground/50 h-4 w-4' />;
};

const FileDownloader = () => {
	const { id, options } = useVideoGen();
	const { step: currentStep, completedSteps = [], error, isComplete } = useVideoGenerationProgress();
	const [isDownloadingAudio, setIsDownloadingAudio] = useState(false);
	const [isDownloadingVideo, setIsDownloadingVideo] = useState(false);

	if (currentStep === VideoGenerationStep.IDLE) {
		return null;
	}

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

	// Filter steps based on options
	const activeSteps = GENERATION_STEPS.filter(
		step => step.step !== VideoGenerationStep.TRANSCRIBING || options?.video.video.subtitlesEnabled,
	);

	return (
		<div className='flex h-full flex-col gap-4'>
			<div className='flex-grow'>
				<div className='mb-2 flex flex-col'>
					<div className='text-muted-foreground text-sm font-medium'>Generation Progress</div>
					<Separator className='my-1 mb-2' />
					<div className='flex flex-col gap-2'>
						{activeSteps.map(({ step, label }) => {
							const isCompleted =
								completedSteps?.includes(step) || (step === VideoGenerationStep.COMPLETED && isComplete);
							const isErrorStep = error?.step === step;
							const isActiveStep = step === currentStep && !isCompleted;
							const isPending = !isCompleted && !isActiveStep;

							return (
								<div key={step} className='flex items-center gap-2'>
									<div className='w-4'>
										<StepIndicator isErrorStep={isErrorStep} isActiveStep={isActiveStep} isCompleted={isCompleted} />
									</div>
									<span
										className={cn(
											'text-sm transition-colors duration-150',
											isActiveStep && 'font-medium',
											isErrorStep && 'text-destructive font-medium',
											isCompleted && 'text-muted-foreground',
											isPending && 'text-muted-foreground/50',
										)}
									>
										{label}
										{isErrorStep && ` (${error.message})`}
									</span>
								</div>
							);
						})}
					</div>
				</div>
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
