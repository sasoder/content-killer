import { Button } from '@/components/ui/button';
import { useVideoGen, useGenerationProgress } from '@/context/VideoGenContext';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { GenerationStep } from '@shared/types/api/schema';
import { Separator } from '@/components/ui/separator';
import { downloadFile } from '@/api/apiHelper';
import { useMemo } from 'react';
import { Progress } from '@/components/ui/progress';

type Step = {
	step: GenerationStep;
	label: string;
};

const FileDownloader = () => {
	const { id, options } = useVideoGen();
	const { step: currentStep, progress, error, isComplete } = useGenerationProgress();

	const steps = useMemo(() => {
		const baseSteps: Step[] = [
			{ step: GenerationStep.PREPARING, label: 'Preparing generation' },
			{ step: GenerationStep.GENERATING_AUDIO, label: 'Generating audio with ElevenLabs' },
			{ step: GenerationStep.DOWNLOADING_VIDEO, label: 'Downloading from YouTube' },
		];

		if (options?.video.video.subtitlesEnabled) {
			baseSteps.push({ step: GenerationStep.TRANSCRIBING, label: 'Transcribing with Whisper' });
		}

		baseSteps.push(
			{ step: GenerationStep.PROCESSING_VIDEO, label: 'Processing with ffmpeg' },
			{ step: GenerationStep.FINALIZING, label: 'Finalizing output' },
			{ step: GenerationStep.COMPLETED, label: 'Generation complete' },
		);

		return baseSteps;
	}, [options?.video.video.subtitlesEnabled]);

	const getStepIcon = (stepStatus: GenerationStep) => {
		if (error?.step === stepStatus) {
			return <Icons.alertTriangle className='text-destructive h-4 w-4' />;
		}
		if (stepStatus === currentStep && !isComplete) {
			return <Icons.loader className='h-4 w-4 animate-spin' />;
		}
		if (steps.findIndex(s => s.step === stepStatus) < steps.findIndex(s => s.step === currentStep) || isComplete) {
			return <Icons.checkbox className='h-4 w-4 text-green-500' />;
		}
		return null;
	};

	const renderSteps = () => {
		if (currentStep === GenerationStep.IDLE) return null;

		return (
			<div className='flex flex-col gap-2'>
				{steps.map(({ step, label }) => {
					const icon = getStepIcon(step);
					if (!icon && step > currentStep) return null;

					const isErrorStep = error?.step === step;
					const isActiveStep = step === currentStep;

					return (
						<div key={step} className='flex flex-col gap-1'>
							<div className='flex items-center gap-2 text-sm'>
								<div className='w-4'>{icon}</div>
								<span className={cn(isActiveStep && 'font-medium', isErrorStep && 'text-destructive font-medium')}>
									{label}
									{isErrorStep && ` (${error.message})`}
								</span>
							</div>
							{isActiveStep && progress && (
								<div className='ml-6'>
									<Progress value={(progress.current / progress.total) * 100} />
									{progress.message && <p className='text-muted-foreground mt-1 text-xs'>{progress.message}</p>}
								</div>
							)}
						</div>
					);
				})}
			</div>
		);
	};

	return (
		<div className='flex h-full flex-col gap-4'>
			<div className='flex-grow'>
				<div className='mb-2 flex flex-col'>
					<div className='text-muted-foreground text-sm font-medium'>Generation Progress</div>
					<Separator className='my-1 mb-2' />
					{renderSteps()}
				</div>
			</div>
			<div className='flex flex-col items-center gap-4'>
				<Button onClick={() => downloadFile(id, 'audio')} className='w-fit' disabled={!isComplete}>
					Download Audio
				</Button>
				<Button onClick={() => downloadFile(id, 'video')} className='w-fit' disabled={!isComplete}>
					Download Video
				</Button>
			</div>
		</div>
	);
};

export default FileDownloader;
