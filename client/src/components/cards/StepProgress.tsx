import { Icons } from '@/components/icons';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export type Step = {
	id: string;
	label: string;
	showProgress?: boolean;
};

export type StepState = {
	currentStep: string;
	completedSteps: string[];
	error?: {
		step: string;
		message: string;
	};
	progress?: number;
};

type StepProgressProps = {
	steps: Step[];
	state: StepState;
};

const StepProgress = ({ steps, state }: StepProgressProps) => {
	const { currentStep, completedSteps = [], error, progress } = state;

	// Show all steps if we're in the completed state
	const visibleSteps =
		state.currentStep === 'COMPLETED' ? steps : steps.slice(0, steps.findIndex(step => step.id === currentStep) + 1);

	return (
		<div className='flex flex-col gap-2'>
			{visibleSteps.map(step => {
				const isCompleted = completedSteps.includes(step.id);
				const isErrorStep = error?.step === step.id;
				const isActiveStep = step.id === currentStep && !isCompleted;

				return (
					<div key={step.id} className={cn('flex flex-col gap-1')}>
						<div className='flex items-center gap-2'>
							<div className='w-4'>
								{isErrorStep && <Icons.alertTriangle className='text-destructive h-4 w-4' />}
								{isCompleted && <Icons.checkbox className='h-4 w-4 text-green-500' />}
								{isActiveStep && <Icons.loader className='h-4 w-4 animate-spin' />}
							</div>
							<span
								className={cn(
									'text-sm transition-colors duration-150',
									isActiveStep && 'font-medium',
									isErrorStep && 'text-destructive font-medium',
									isCompleted && 'text-muted-foreground',
								)}
							>
								{step.label}
								{isErrorStep && error && ` (${error.message})`}
							</span>
							{isActiveStep && step.showProgress && progress !== undefined && (
								<span className='text-muted-foreground ml-auto text-sm'>{Math.round(progress)}%</span>
							)}
						</div>
						{isActiveStep && step.showProgress && progress !== undefined && (
							<Progress value={progress} className='w-full' />
						)}
					</div>
				);
			})}
		</div>
	);
};

export default StepProgress;
