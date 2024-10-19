import React, { useCallback, useState } from 'react';
import { useFetchAllVideoGenStates } from '@/hooks/useFetchAllVideoGenStates';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { createProject } from '@/api/apiHelper';
import { Header } from '@/components/layout/Header';
import { formatDate } from '@/lib/utils';
import { Icons } from '@/components/icons';
const SelectProject = () => {
	const { data, isLoading } = useFetchAllVideoGenStates();
	const navigate = useNavigate();
	const [selectedId, setSelectedId] = useState('new');
	const [isFetching, setIsFetching] = useState(false);

	const handleGenerate = async () => {
		setIsFetching(true);
		if (selectedId === 'new') {
			try {
				const videoGenState = await createProject();
				navigate(`/generate/${videoGenState.id}`);
			} catch (error) {
				console.error('Error creating project:', error);
			} finally {
				setIsFetching(false);
			}
		} else {
			navigate(`/generate/${selectedId}`);
		}
	};

	const handleSelectChange = (id: string) => {
		setSelectedId(id);
	};

	const getSelectedTitle = useCallback(() => {
		if (selectedId === 'new') return 'New Project';
		const selected = data?.find(item => item.id === selectedId);
		return selected ? selected.metadata.title : 'Untitled Project';
	}, [data, selectedId]);

	return (
		<>
			<Header title='Choose Project' showBackButton backTo='/' />
			<main className='container mx-auto'>
				<div className='flex flex-grow flex-col items-center justify-center gap-4 pt-6'>
					<Select value={selectedId} onValueChange={handleSelectChange}>
						<SelectTrigger className='w-[250px]'>
							<SelectValue>{getSelectedTitle()}</SelectValue>
						</SelectTrigger>
						<SelectContent className='w-[250px]'>
							<ScrollArea>
								<SelectGroup>
									<SelectItem value='new'>New Project</SelectItem>
								</SelectGroup>
								{isLoading ? (
									<SelectGroup>
										<SelectItem value='loading' disabled>
											Loading...
										</SelectItem>
									</SelectGroup>
								) : (
									<SelectGroup>
										{data?.map(videoGenState => (
											<SelectItem key={videoGenState.id} value={videoGenState.id}>
												<div className='flex flex-col'>
													<div className='font-medium'>{videoGenState.metadata.title}</div>
													<div className='text-xs text-gray-500'>{formatDate(videoGenState.metadata.createdAt)}</div>
												</div>
											</SelectItem>
										))}
									</SelectGroup>
								)}
							</ScrollArea>
						</SelectContent>
					</Select>
					<Button onClick={handleGenerate} disabled={isFetching || isLoading}>
						{isFetching ? (
							<>
								<Icons.loader className='mr-2 h-[1.2rem] w-[1.2rem] animate-spin' />
								Fetching...
							</>
						) : (
							'Begin'
						)}
					</Button>
				</div>
			</main>
		</>
	);
};

export default function NewPage() {
	return <SelectProject />;
}
