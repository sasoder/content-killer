import { useState } from 'react';
import { useProject } from '@/context/ProjectContext';
import { Button } from '@/components/ui/button';
import StepOptions from '@/components/cards/StepOptions';
import { commentaryOptionDefinitions } from '@/lib/options/optionDefinitions';
import { Icons } from '@/components/icons';
import { toast } from '@/hooks/use-toast';
import QuickInfo from '@/components/QuickInfo';
import { useCommentaryGeneration } from '@/hooks/useCommentaryGeneration';

const GenerateCommentary = () => {
	const { description, id, options } = useProject();
	const [commentaryOptions, setCommentaryOptions] = useState(options?.commentary);
	const { generate, isLoading, error } = useCommentaryGeneration(id);

	const handleGenerate = async () => {
		if (!description || description.length === 0) {
			toast({
				title: 'Invalid data',
				description: 'Make sure you have generated description.',
				variant: 'destructive',
			});
			return;
		}

		try {
			generate(
				{ options: commentaryOptions },
				{
					onSuccess: () => {
						toast({
							title: 'Success',
							description: 'Commentary generated successfully',
						});
					},
					onError: error => {
						toast({
							title: 'Error',
							description: 'Failed to generate commentary. Please try again.',
							variant: 'destructive',
						});
					},
				},
			);
		} catch (error) {
			console.error('Error generating content:', error);
		}
	};

	return (
		<div className='flex h-full flex-col'>
			<div className='flex-grow'>
				<QuickInfo data={description} type='description' />
			</div>
			<div className='flex justify-center'>
				<div className='flex flex-grow flex-col gap-4'>
					<StepOptions
						options={commentaryOptions}
						onOptionChange={setCommentaryOptions}
						optionDefinitions={commentaryOptionDefinitions}
						type='commentary'
					/>
					<div className='flex justify-center'>
						<Button onClick={handleGenerate} disabled={!description || isLoading}>
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
