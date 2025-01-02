import { Button } from '@/components/ui/button';
import { useVideoGen } from '@/context/VideoGenContext';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { VideoGenStatus, AudioGenStatus } from '@shared/types/api/schema';
import { Separator } from '@/components/ui/separator';
import { downloadFile } from '@/api/apiHelper';

type Step = {
	status: VideoGenStatus | AudioGenStatus;
	label: string;
};

const videoSteps: Step[] = [
	{ status: VideoGenStatus.DOWNLOADING_SOURCE, label: 'Downloading video' },
	{ status: VideoGenStatus.TRANSCRIBING_SOURCE, label: 'Transcribing video' },
	{ status: VideoGenStatus.GENERATING_VIDEO, label: 'Processing video' },
	{ status: VideoGenStatus.COMPLETED, label: 'Video generation complete' },
];

const audioSteps: Step[] = [
	{ status: AudioGenStatus.GENERATING, label: 'Generating audio' },
	{ status: AudioGenStatus.COMPLETED, label: 'Audio generation complete' },
];

const FileDownloader = () => {
	const { id, videoStatus, audioStatus, errorStep } = useVideoGen();

	const getStepIcon = (stepStatus: VideoGenStatus | AudioGenStatus, currentStatus: VideoGenStatus | AudioGenStatus) => {
		if (currentStatus === VideoGenStatus.ERROR || currentStatus === AudioGenStatus.ERROR) {
			return <Icons.alertTriangle className='text-destructive h-4 w-4' />;
		}
		if (
			stepStatus === currentStatus &&
			stepStatus !== VideoGenStatus.COMPLETED &&
			stepStatus !== AudioGenStatus.COMPLETED
		) {
			return <Icons.loader className='h-4 w-4 animate-spin' />;
		}
		if (
			(currentStatus === VideoGenStatus.COMPLETED && stepStatus <= currentStatus) ||
			(currentStatus === AudioGenStatus.COMPLETED && stepStatus <= currentStatus)
		) {
			return <Icons.checkbox className='h-4 w-4 text-green-500' />;
		}
		return null;
	};

	const renderSteps = (steps: Step[], currentStatus: VideoGenStatus | AudioGenStatus, type: 'video' | 'audio') => {
		if (currentStatus === VideoGenStatus.IDLE || currentStatus === AudioGenStatus.IDLE) return null;

		return (
			<div className='flex flex-col gap-2'>
				{steps.map(step => {
					const icon = getStepIcon(step.status, currentStatus);
					if (!icon && step.status > currentStatus) return null;

					const isErrorStep = type === 'video' ? errorStep?.video === step.status : errorStep?.audio === step.status;

					return (
						<div key={step.status} className='flex items-center gap-2 text-sm'>
							<div className='w-4'>{icon}</div>
							<span
								className={cn(
									step.status === currentStatus && 'font-medium',
									isErrorStep && 'text-destructive font-medium',
								)}
							>
								{step.label}
								{isErrorStep && ' (Failed)'}
							</span>
						</div>
					);
				})}
			</div>
		);
	};

	const handleDownload = async (type: 'video' | 'audio') => {
		try {
			await downloadFile(id, type);
		} catch (error) {
			console.error(`Error downloading ${type}:`, error);
		}
	};

	return (
		<div className='flex h-full flex-col gap-4'>
			<div className='flex-grow'>
				<div className='mb-2 flex flex-col'>
					<div className='text-muted-foreground text-sm font-medium'>Audio Generation</div>
					<Separator className='my-1 mb-2' />
					{renderSteps(audioSteps, audioStatus, 'audio')}
				</div>

				<div className='mb-2 flex flex-col'>
					<div className='text-muted-foreground text-sm font-medium'>Video Generation</div>
					<Separator className='my-1 mb-2' />
					{renderSteps(videoSteps, videoStatus, 'video')}
				</div>
			</div>
			<div className='flex flex-col items-center gap-4'>
				<Button
					onClick={() => handleDownload('audio')}
					className='w-fit'
					disabled={audioStatus !== AudioGenStatus.COMPLETED}
				>
					Download Audio
				</Button>
				<Button
					onClick={() => handleDownload('video')}
					className='w-fit'
					disabled={videoStatus !== VideoGenStatus.COMPLETED}
				>
					Download Video
				</Button>
			</div>
		</div>
	);
};

export default FileDownloader;
