import { Header } from '@/components/layout/Header';

export const HTTPError = ({ error }: { error: string }) => {
	return (
		<>
			<Header showBackButton backTo='/' paddingTop={false} />
			<div className='flex h-screen flex-col items-center justify-center'>
				<h2 className='text-2xl font-semibold'>{error}</h2>
				<p className='text-sm text-muted-foreground'>You shouldn't be here.</p>
			</div>
		</>
	);
};
