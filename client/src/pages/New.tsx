import React, { useState, useCallback } from 'react';
import { useFetchAllVideoGenStates } from '@/hooks/useFetchAllVideoGenStates';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { createProject } from '@/api/apiHelper';
import { Header } from '@/components/layout/Header';
import { formatDate } from '@/lib/utils';

const SelectProject = () => {
	const { data, isLoading } = useFetchAllVideoGenStates();
	const [selectedId, setSelectedId] = useState<string>('new');
	const navigate = useNavigate();

	const handleSelectChange = useCallback((value: string) => {
		setSelectedId(value);
	}, []);

	const handleGenerate = useCallback(async () => {
		if (selectedId === 'new') {
			try {
				const videoGenState = await createProject();
				navigate(`/generate/${videoGenState.id}`);
			} catch (error) {
				console.error('Error creating project:', error);
			}
		} else {
			navigate(`/generate/${selectedId}`);
		}
	}, [selectedId, navigate]);

	const getSelectedTitle = useCallback(() => {
		if (selectedId === 'new') return 'New Project';
		const selected = data?.find(item => item.id === selectedId);
		return selected ? selected.metadata.title : 'Select a project';
	}, [selectedId, data]);

	return (
		<>
			<Header title='Choose Project' showBackButton backTo='/' />
			<main className='container mx-auto space-y-4'>
				<div className='flex flex-grow flex-col items-center justify-center gap-4 pt-6'>
					<Select onValueChange={handleSelectChange} value={selectedId}>
						<SelectTrigger className='w-[200px]'>
							<SelectValue>{getSelectedTitle()}</SelectValue>
						</SelectTrigger>
						<SelectContent>
							<ScrollArea className='h-auto'>
								<SelectItem value='new' className='cursor-pointer'>
									New Project
								</SelectItem>
								{isLoading ? (
									<SelectItem value='loading' disabled>
										Loading...
									</SelectItem>
								) : (
									data?.map(videoGenState => (
										<SelectItem key={videoGenState.id} value={videoGenState.id} className='cursor-pointer'>
											<div className='flex flex-col'>
												<div className='font-medium'>{videoGenState.metadata.title}</div>
												<div className='text-xs text-gray-500'>{formatDate(videoGenState.metadata.createdAt)}</div>
											</div>
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
