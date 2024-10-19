import { useState } from 'react';
import { useVideoGen } from '@/context/VideoGenContext';
import { Button } from '@/components/ui/button';
import { CommentaryOptions } from '@shared/types/options';
import { generateCommentary } from '@/api/apiHelper';
import StepOptions from '@/components/cards/StepOptions';
import { commentaryOptionDefinitions } from '@/lib/options/optionDefinitions';
import { Icons } from '@/components/icons';
import { toast } from '@/hooks/use-toast';
import QuickInfo from '@/components/QuickInfo';

const GenerateCommentary = () => {
	const { description, updateCommentary, id, options } = useVideoGen();
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [commentaryOptions, setCommentaryOptions] = useState<CommentaryOptions>(options.commentary);

	const handleGenerate = async () => {
		try {
			if (!description || description.length === 0) {
				throw new Error('No description data provided');
			}
			setIsLoading(true);
			const generatedCommentary = await generateCommentary(id, description, commentaryOptions);
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
			<div className='flex-grow'>
				<QuickInfo data={description!} />
			</div>
			<div className='flex justify-center'>
				<div className='flex flex-grow flex-col gap-2'>
					<StepOptions
						options={commentaryOptions}
						onOptionChange={setCommentaryOptions}
						optionDefinitions={commentaryOptionDefinitions}
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
