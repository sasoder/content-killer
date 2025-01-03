import { Button } from '@/components/ui/button';
import { useVideoGen, useGenerationProgress } from '@/context/VideoGenContext';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { GenerationStep } from '@shared/types/api/schema';
import { Separator } from '@/components/ui/separator';
import { downloadFile } from '@/api/apiHelper';

const GENERATION_STEPS = [
	{ step: GenerationStep.PREPARING, label: 'Preparing generation' },
	{ step: GenerationStep.GENERATING_AUDIO, label: 'Generating audio with ElevenLabs' },
	{ step: GenerationStep.DOWNLOADING_VIDEO, label: 'Downloading from YouTube' },
	{ step: GenerationStep.TRANSCRIBING, label: 'Transcribing with Whisper' },
	{ step: GenerationStep.PROCESSING_VIDEO, label: 'Processing with ffmpeg' },
	{ step: GenerationStep.FINALIZING, label: 'Finalizing output' },
	{ step: GenerationStep.COMPLETED, label: 'Generation complete' },
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
	return <div className='border-muted-foreground/30 h-4 w-4 rounded-full border' />;
};

const FileDownloader = () => {
	const { id, options } = useVideoGen();
	const { step: currentStep, completedSteps = [], error, isComplete } = useGenerationProgress();

	if (currentStep === GenerationStep.IDLE) {
		return null;
	}

	// Filter steps based on options
	const activeSteps = GENERATION_STEPS.filter(
		step => step.step !== GenerationStep.TRANSCRIBING || options?.video.video.subtitlesEnabled,
	);

	return (
		<div className='flex h-full flex-col gap-4'>
			<div className='flex-grow'>
				<div className='mb-2 flex flex-col'>
					<div className='text-muted-foreground text-sm font-medium'>Generation Progress</div>
					<Separator className='my-1 mb-2' />
					<div className='flex flex-col gap-2'>
						{activeSteps.map(({ step, label }) => {
							const isCompleted = completedSteps?.includes(step) || (step === GenerationStep.COMPLETED && isComplete);
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
					onClick={() => downloadFile(id, 'audio')}
					className='w-fit'
					disabled={!completedSteps.includes(GenerationStep.GENERATING_AUDIO)}
				>
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
