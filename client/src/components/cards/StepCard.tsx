import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ReactNode, Suspense } from 'react';
import { CardSkeleton } from '@/components/skeletons/CardSkeletion';

type StepCardProps = {
	title: string;
	content: ReactNode;
	info: string;
};

function StepCard({ title, content, info }: StepCardProps) {
	return (
		<Card className='flex h-[500px] w-1/4 flex-col transition-colors duration-300 hover:bg-accent/50'>
			<CardHeader>
				<CardTitle className='flex flex-row items-center justify-between'>
					{title}
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<Icons.info className='h-4 w-4 cursor-pointer opacity-70 transition-opacity duration-300 hover:opacity-100' />
							</TooltipTrigger>
							<TooltipContent side='top' sideOffset={10}>
								<p>{info}</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</CardTitle>
			</CardHeader>
			<CardContent className='flex flex-grow flex-col gap-2'>
				<Suspense fallback={<CardSkeleton />}>{content}</Suspense>
			</CardContent>
		</Card>
	);
}

export default StepCard;
