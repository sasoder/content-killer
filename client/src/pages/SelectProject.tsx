import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { createProjectWithTemplate, fetchProjects, fetchTemplates } from '@/api/honoClient';
import { Header } from '@/components/layout/Header';
import { formatDate } from '@/lib/utils';
import { Icons } from '@/components/icons';
import { useQuery } from '@tanstack/react-query';

const SelectProject = () => {
	const navigate = useNavigate();
	const { data: templates = [], isLoading: isLoadingTemplates } = useQuery({
		queryKey: ['templates'],
		queryFn: fetchTemplates,
	});

	const { data: projects = [], isLoading: isLoadingProjects } = useQuery({
		queryKey: ['projects'],
		queryFn: fetchProjects,
	});

	const [selectedId, setSelectedId] = useState('new');
	const [selectedTemplateId, setSelectedTemplateId] = useState('');
	const [isFetching, setIsFetching] = useState(false);

	useEffect(() => {
		if (templates.length > 0) {
			setSelectedTemplateId(templates[0].id);
		}
	}, [templates]);

	const handleGenerate = async () => {
		setIsFetching(true);
		try {
			if (selectedId === 'new') {
				const state = await createProjectWithTemplate(selectedTemplateId);
				navigate(`/project/${state.id}`);
			} else {
				navigate(`/project/${selectedId}`);
			}
		} catch (error) {
			console.error('Error:', error);
		} finally {
			setIsFetching(false);
		}
	};

	const selectedTitle = React.useMemo(() => {
		if (selectedId === 'new') return 'New Project';
		const selected = projects.find(item => item.id === selectedId);
		return selected?.metadata?.title || 'Untitled Project';
	}, [selectedId, projects]);

	const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

	return (
		<>
			<Header title='Choose Project' showBackButton />
			<main className='items-top flex h-screen justify-center'>
				<Card className='h-fit w-full max-w-[400px]'>
					<CardHeader>
						<CardTitle>Project Selection</CardTitle>
						<CardDescription>Choose an existing project or create a new one</CardDescription>
					</CardHeader>
					<CardContent className='flex flex-col gap-4'>
						<div className='flex flex-col gap-2'>
							<label className='text-sm font-medium'>Project</label>
							<Select value={selectedId} onValueChange={setSelectedId}>
								<SelectTrigger className='truncate'>
									<SelectValue className='truncate'>{selectedTitle}</SelectValue>
								</SelectTrigger>
								<SelectContent>
									<SelectGroup>
										<SelectItem value='new'>
											<span className='flex items-center gap-2'>
												<Icons.plus className='h-4 w-4' />
												New Project
											</span>
										</SelectItem>

										{isLoadingProjects ? (
											<SelectItem value='loading' disabled>
												<span className='flex items-center gap-2'>
													<Icons.loader className='h-4 w-4 animate-spin' />
													Loading projects...
												</span>
											</SelectItem>
										) : (
											projects?.map(project => (
												<SelectItem key={project.id} value={project.id}>
													<div className='w-full max-w-[300px]'>
														<div className='truncate font-medium'>{project.metadata?.title}</div>
														<div className='text-muted-foreground truncate text-xs'>
															Created {formatDate(project.metadata.createdAt)}
														</div>
													</div>
												</SelectItem>
											))
										)}
									</SelectGroup>
								</SelectContent>
							</Select>
						</div>

						{selectedId === 'new' && templates.length > 0 && (
							<div className='space-y-2'>
								<label className='text-sm font-medium'>Template</label>
								<div className='flex gap-2'>
									<Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
										<SelectTrigger className='truncate'>
											<SelectValue className='truncate'>{selectedTemplate?.name ?? 'Select Template'}</SelectValue>
										</SelectTrigger>
										<SelectContent>
											<SelectGroup>
												{templates.map(template => (
													<SelectItem key={template.id} value={template.id}>
														<div className='w-full max-w-[300px]'>
															<div className='truncate font-medium'>{template.name}</div>
															<div className='text-muted-foreground truncate text-xs'>{template.description}</div>
														</div>
													</SelectItem>
												))}
											</SelectGroup>
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

						<Button onClick={handleGenerate} disabled={isFetching || isLoadingProjects} className='w-fit self-center'>
							{isFetching ? (
								<>
									<Icons.loader className='mr-2 h-4 w-4 animate-spin' />
									Creating Project...
								</>
							) : (
								'Continue'
							)}
						</Button>
					</CardContent>
				</Card>
			</main>
		</>
	);
};

export default SelectProject;
