import { Header } from '@/components/layout/Header';

export const HTTPError = ({ error }: { error: string }) => {
	return (
		<>
			<Header showBackButton paddingTop={false} />
			<div className='flex h-screen flex-col items-center justify-center'>
				<h2 className='text-2xl font-semibold'>{error}</h2>
				<p className='text-muted-foreground text-sm'>You shouldn't be here.</p>
			</div>
		</>
	);
};
