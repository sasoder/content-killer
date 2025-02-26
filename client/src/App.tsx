import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { Icons } from '@/components/common/icons';
import { ModeToggle } from '@/components/common/mode-toggle';
import { Link } from 'react-router-dom';

export default function Home() {
	return (
		<main className='flex h-screen flex-col items-center justify-center'>
			<div className='container flex max-w-[64rem] flex-col items-center gap-4 text-center'>
				<div className='flex flex-row items-center justify-center gap-4'>
					<h1 className='text-3xl'>Content Killer</h1>
					<Icons.skull className='h-12 w-12' />
				</div>

				<div className='flex gap-2'>
					<Link to='/create' className={cn(buttonVariants({ size: 'default' }))}>
						Create
					</Link>
					<Link to='/templates' className={cn(buttonVariants({ size: 'default' }))}>
						<Icons.settings className='mr-2 h-4 w-4' />
						Templates
					</Link>
					<ModeToggle />
				</div>

				<Link
					to='https://github.com/sasoder'
					className={cn(buttonVariants({ variant: 'link' }), 'text-muted-foreground')}
					target='_blank'
					rel='noopener noreferrer'
				>
					@sasoder
				</Link>
			</div>
		</main>
	);
}
