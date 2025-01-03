import React, { useCallback, useState, useEffect } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createProjectWithTemplate, fetchAllVideoGenStates, fetchProjectTemplates } from '@/api/apiHelper';
import { Header } from '@/components/layout/Header';
import { cn, formatDate } from '@/lib/utils';
import { Icons } from '@/components/icons';
import { ProjectTemplate } from '@shared/types/options/template';
import { useQuery } from '@tanstack/react-query';

const SelectProject = () => {
	const { data: videoGenStates, isLoading: isLoadingStates } = useQuery({
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
		try {
			if (selectedId === 'new') {
				const videoGenState = await createProjectWithTemplate(selectedTemplateId);
				navigate(`/generate/${videoGenState.id}`);
			} else {
				navigate(`/generate/${selectedId}`);
			}
		} catch (error) {
			console.error('Error creating/loading project:', error);
			// TODO: Add error handling UI feedback
		} finally {
			setIsFetching(false);
		}
	};

	const getSelectedTitle = useCallback(() => {
		if (selectedId === 'new') return 'New Project';
		const selected = videoGenStates?.find(item => item.id === selectedId);
		return selected ? selected.metadata.title : 'Untitled Project';
	}, [videoGenStates, selectedId]);

	const selectedTemplate = optionTemplates.find(t => t.id === selectedTemplateId);

	return (
		<>
			<Header title='Choose Project' showBackButton />
			<main className='container mx-auto px-4 py-8'>
				<Card className='mx-auto max-w-xs'>
					<CardHeader>
						<CardTitle>Project Selection</CardTitle>
						<CardDescription>Choose an existing project or create a new one from a template</CardDescription>
					</CardHeader>
					<CardContent className='flex flex-col gap-6'>
						{/* Project Selection */}
						<div className='space-y-2'>
							<label className='text-sm font-medium'>Project</label>
							<Select value={selectedId} onValueChange={setSelectedId}>
								<SelectTrigger className='w-full'>
									<SelectValue>{getSelectedTitle()}</SelectValue>
								</SelectTrigger>
								<SelectContent>
									<ScrollArea className='h-72'>
										<SelectGroup>
											<SelectItem value='new' className='py-2'>
												<div className='flex items-center gap-2'>
													<Icons.plus className='h-4 w-4' />
													<span>New Project</span>
												</div>
											</SelectItem>
											{isLoadingStates ? (
												<SelectItem value='loading' disabled className='py-2'>
													<div className='flex items-center gap-2'>
														<Icons.loader className='h-4 w-4 animate-spin' />
														<span>Loading projects...</span>
													</div>
												</SelectItem>
											) : (
												videoGenStates?.map(state => (
													<SelectItem key={state.id} value={state.id} className='py-2'>
														<div className='flex flex-col gap-1'>
															<span className='font-medium'>{state.metadata.title}</span>
															<span className='text-muted-foreground text-xs'>
																Created {formatDate(state.metadata.createdAt)}
															</span>
														</div>
													</SelectItem>
												))
											)}
										</SelectGroup>
									</ScrollArea>
								</SelectContent>
							</Select>
						</div>

						{/* Template Selection */}
						{selectedId === 'new' && optionTemplates.length > 0 && (
							<div className='space-y-2'>
								<label className='text-sm font-medium'>Template</label>
								<div className='flex flex-row gap-2'>
									<Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
										<SelectTrigger className='w-full'>
											<SelectValue>{selectedTemplate?.name ?? 'Select Template'}</SelectValue>
										</SelectTrigger>
										<SelectContent>
											<ScrollArea className='h-72'>
												<SelectGroup>
													{optionTemplates.map(template => (
														<SelectItem key={template.id} value={template.id} className='py-2'>
															<div className='flex flex-col gap-1'>
																<span className='font-medium'>{template.name}</span>
																<span className='text-muted-foreground text-xs'>{template.description}</span>
															</div>
														</SelectItem>
													))}
												</SelectGroup>
											</ScrollArea>
										</SelectContent>
									</Select>
									<Link to='/templates' title='Template Settings'>
										<Button variant='outline' size='icon'>
											<Icons.settings className='h-4 w-4' />
										</Button>
									</Link>
								</div>
							</div>
						)}

						{/* Action Button */}
						<Button onClick={handleGenerate} disabled={isFetching || isLoadingStates} className='mx-auto w-fit'>
							{isFetching ? (
								<>
									<Icons.loader className='mr-2 h-4 w-4 animate-spin' />
									<span>Creating Project...</span>
								</>
							) : (
								<>
									<span>Continue</span>
								</>
							)}
						</Button>
					</CardContent>
				</Card>
			</main>
		</>
	);
};

export default function NewPage() {
	return <SelectProject />;
}
