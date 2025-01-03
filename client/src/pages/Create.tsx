import React, { useCallback, useState, useEffect } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { createProjectWithTemplate, fetchAllVideoGenStates, fetchProjectTemplates } from '@/api/apiHelper';
import { Header } from '@/components/layout/Header';
import { cn, formatDate } from '@/lib/utils';
import { Icons } from '@/components/icons';
import { ProjectTemplate } from '@shared/types/options/template';
import { useQuery } from '@tanstack/react-query';

const SelectProject = () => {
	const { data, isLoading } = useQuery({
		queryKey: ['videoGenStates'],
		queryFn: fetchAllVideoGenStates,
	});
	const navigate = useNavigate();
	const [selectedId, setSelectedId] = useState('new');
	const [isFetching, setIsFetching] = useState(false);
	const [optionTemplates, setOptionTemplates] = useState<ProjectTemplate[]>([]);
	const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

	useEffect(() => {
		const loadOptionTemplates = async () => {
			try {
				const templates = await fetchProjectTemplates();
				setOptionTemplates(templates);
				if (templates.length > 0) {
					setSelectedTemplateId(templates[0].id);
				}
			} catch (error) {
				console.error('Error loading option templates:', error);
			}
		};
		loadOptionTemplates();
	}, []);

	const handleGenerate = async () => {
		setIsFetching(true);
		if (selectedId === 'new') {
			try {
				const videoGenState = await createProjectWithTemplate(selectedTemplateId);
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
			<Header title='Choose Project' showBackButton />
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

					{selectedId === 'new' && optionTemplates.length > 0 && (
						<div className='flex flex-row gap-2'>
							<Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
								<SelectTrigger className='w-[250px]'>
									<SelectValue>
										{optionTemplates.find(t => t.id === selectedTemplateId)?.name ?? 'Select Template'}
									</SelectValue>
								</SelectTrigger>
								<SelectContent className='w-[250px]'>
									<ScrollArea>
										<SelectGroup>
											{optionTemplates.map(template => (
												<SelectItem key={template.id} value={template.id}>
													<div className='flex flex-col'>
														<div className='font-medium'>{template.name}</div>
														<div className='text-xs text-gray-500'>{template.description}</div>
													</div>
												</SelectItem>
											))}
										</SelectGroup>
									</ScrollArea>
								</SelectContent>
							</Select>
							<Link to='/templates' className={cn(buttonVariants({ size: 'icon', variant: 'ghost' }))}>
								<Icons.settings className='h-4 w-4' />
							</Link>
						</div>
					)}

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
