import React, { useState, useCallback } from 'react';
import { useFetchVideoIds } from '@/hooks/useFetchVideoIds';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { ModeToggle } from '@/components/mode-toggle';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { createProject } from '@/api/apiHelper';
import { Header } from '@/components/layout/Header';

const SelectProject = () => {
	const { data, isLoading } = useFetchVideoIds();
	const [selectedId, setSelectedId] = useState<string>('new');
	const navigate = useNavigate();
	const handleSelectChange = useCallback((value: string) => {
		setSelectedId(value);
	}, []);

	const handleGenerate = useCallback(async () => {
		if (selectedId === 'new') {
			try {
				const newId = await createProject();
				navigate(`/generate/${newId}`);
			} catch (error) {
				console.error('Error creating project:', error);
			}
		} else {
			navigate(`/generate/${selectedId}`);
		}
	}, [selectedId, navigate]);

	return (
		<>
			<Header title='Choose Project' showBackButton backTo='/' />
			<main className='container mx-auto space-y-4'>
				<div className='flex flex-grow flex-col items-center justify-center gap-4 pt-6'>
					<Select onValueChange={handleSelectChange} value={selectedId}>
						<SelectTrigger className='w-[200px]'>
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

					<Button onClick={handleGenerate} disabled={isLoading} className='w-fit'>
						{isLoading ? 'Loading...' : 'Generate'}
					</Button>
				</div>
			</main>
		</>
	);
};

export default function NewPage() {
	return <SelectProject />;
}
