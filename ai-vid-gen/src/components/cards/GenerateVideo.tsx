import { Suspense, useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { FileResponse, TimestampTextList, VideoOptions } from '@/lib/schema';
import { Icons } from '@/components/icons';
import QuickInfo from '@/components/QuickInfo';
import { Separator } from '@/components/ui/separator';
import StepOptions from '@/components/cards/StepOptions';
import { GenerateOptions } from '../../lib/types';

interface GenerateVideoProps {
	audioData: FileResponse;
	commentaryData: TimestampTextList;
	generateFunction: (options: VideoOptions) => Promise<string>;
	options?: GenerateOptions;
	onUpdate: (data: string) => void;
}

export default function GenerateVideo({
	audioData,
	commentaryData,
	generateFunction,
	options,
	onUpdate,
}: GenerateVideoProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [optionValues, setOptionValues] = useState<
		Record<string, boolean | number>
	>({});
	const { toast } = useToast();

	useEffect(() => {
		if (options) {
			const initialValues = Object.entries(options).reduce(
				(acc, [key, option]) => {
					acc[key] = option.default;
					return acc;
				},
				{} as Record<string, boolean | number>,
			);
			setOptionValues(initialValues as VideoOptions);
		}
	}, [options]);

	useEffect(() => {
		// Visualize existing audio and commentary files if needed
		// This can be extended based on specific visualization requirements
	}, [audioData, commentaryData]);

	const handleOptionChange = (key: keyof VideoOptions, value: any) => {
		setOptionValues(prev => ({
			...prev,
			[key]: value,
		}));
	};

	const handleGenerateVideo = async () => {
		if (audioData.items.length === 0 || commentaryData.items.length === 0) {
			toast({
				title: 'Missing Data',
				description: 'Audio or Commentary files are missing.',
				variant: 'destructive',
			});
			return;
		}

		setIsLoading(true);
		try {
			const generatedVideoName = await generateFunction(
				optionValues as VideoOptions,
			);
			onUpdate(generatedVideoName);
			toast({
				title: 'Success',
				description: `Video "${generatedVideoName}" generated successfully.`,
			});
		} catch (error) {
			console.error('Error generating video:', error);
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
				<p className='text-sm text-gray-500'>
					You have {commentaryData.items.length} commentary{' '}
					{commentaryData.items.length === 1 ? 'timestamp' : 'timestamps'}, and{' '}
					{audioData.items.length} audio{' '}
					{audioData.items.length === 1 ? 'file' : 'files'} ready for video
					generation. These should match in amount.
				</p>
			</div>
			<div className='text-sm font-medium text-muted-foreground'>Options</div>
			<Separator className='mb-3 mt-3' />
			{options && (
				<StepOptions
					options={options}
					optionValues={optionValues}
					onOptionChange={(key, value) =>
						handleOptionChange(key as keyof VideoOptions, value)
					}
				/>
			)}
			<div className='flex justify-center pt-4'>
				<Button
					onClick={handleGenerateVideo}
					disabled={
						isLoading ||
						!audioData ||
						audioData.items.length === 0 ||
						!commentaryData ||
						commentaryData.items.length === 0
					}
					className='font-bold'
				>
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
}
