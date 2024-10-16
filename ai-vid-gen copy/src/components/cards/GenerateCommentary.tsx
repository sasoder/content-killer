import React, { useState } from 'react';
import { useVideoGen } from '@/context/VideoGenContext';
import { Button } from '@/components/ui/button';
import { CommentaryOptions, TimestampTextList } from '@/lib/schema';
import { generateCommentary } from '@/api/apiHelper';
import StepOptions from '@/components/cards/StepOptions';
import { defaultCommentaryOptions } from '@/lib/options/defaultOptions';
import { commentaryOptionDefinitions } from '@/lib/options/optionDefinitions';
import { Icons } from '@/components/icons';
import { toast } from '@/hooks/use-toast';

const GenerateCommentary = () => {
	const { description, updateCommentary } = useVideoGen();
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [options, setOptions] = useState<CommentaryOptions>(defaultCommentaryOptions);

	const handleGenerate = async () => {
		try {
			setIsLoading(true);
			const generatedCommentary: TimestampTextList = await generateCommentary(description, options);
			updateCommentary(generatedCommentary);
			toast({
				title: 'Success',
				description: 'Commentary generated successfully',
			});
		} catch (error) {
			console.error('Error generating commentary:', error);
			toast({
				title: 'Error',
				description: 'Failed to generate commentary. Please try again.',
				variant: 'destructive',
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className='flex h-full flex-col'>
			<div className='flex-grow'></div>
			<div className='flex justify-center'>
				<div className='flex flex-grow flex-col gap-2'>
					<StepOptions options={options} onOptionChange={setOptions} optionDefinitions={commentaryOptionDefinitions} />
					<div className='flex justify-center'>
						<Button onClick={handleGenerate} disabled={isLoading}>
							{isLoading ? (
								<>
									<Icons.loader className='mr-2 h-[1.2rem] w-[1.2rem] animate-spin' />
									Generating...
								</>
							) : (
								'Generate Commentary'
							)}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default GenerateCommentary;
