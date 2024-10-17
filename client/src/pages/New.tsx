import React, { useState, useCallback } from 'react';
import { useFetchVideoIds } from '@/hooks/useFetchVideoIds';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ModeToggle } from '@/components/mode-toggle';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { generateProjectId } from '@/lib/utils';

const SelectProject = () => {
	const { data, isLoading } = useFetchVideoIds();
	const [selectedId, setSelectedId] = useState<string>('new');
	console.log(data);
	const handleSelectChange = useCallback((value: string) => {
		setSelectedId(value);
	}, []);

	const handleGenerate = useCallback(() => {
		const newId = selectedId === 'new' ? generateProjectId() : selectedId;
		return `/generate/${newId}`;
	}, [selectedId]);

	return (
		<main className='container mx-auto space-y-8 p-4'>
			<div className='flex flex-row items-center justify-center gap-4 pt-2'>
				<div className='absolute left-0 top-0 m-4'>
					<Link to='/'>
						<Button variant='ghost' size='icon'>
							<Icons.chevronLeft className='h-[1.5rem] w-[1.5rem] -translate-x-[0.075rem]' />
						</Button>
					</Link>
				</div>
				<div className='absolute right-0 top-0 m-4'>
					<ModeToggle />
				</div>
				<h1 className='flex items-center justify-center text-3xl'>Content Killer</h1>
				<Icons.skull className='h-12 w-12 -translate-y-1' />
			</div>

			<div className='flex flex-grow flex-col items-center justify-center gap-4 pt-6'>
				<Select onValueChange={handleSelectChange} value={selectedId}>
					<SelectTrigger className='w-[300px]'>
						<SelectValue placeholder='Select a project' />
					</SelectTrigger>
					<SelectContent>
						<ScrollArea className='h-[200px]'>
							<SelectItem value='new'>New Project</SelectItem>
							{isLoading ? (
								<SelectItem value='loading' disabled>
									Loading...
								</SelectItem>
							) : (
								data?.map(id => (
									<SelectItem key={id} value={id}>
										{id}
									</SelectItem>
								))
							)}
						</ScrollArea>
					</SelectContent>
				</Select>

				<Link to={handleGenerate()}>
					<Button disabled={isLoading} className='w-fit'>
						{isLoading ? 'Loading...' : 'Generate'}
					</Button>
				</Link>
			</div>
		</main>
	);
};

export default function NewPage() {
	return <SelectProject />;
}
