import React, { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { createProjectWithTemplate, fetchProjects, fetchProjectTemplates } from '@/api/honoClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export default function Create() {
	const navigate = useNavigate();
	const [selectedId, setSelectedId] = useState<string | null>(null);

	const { data: projects, isLoading: isLoadingStates } = useQuery({
		queryKey: ['projects'],
		queryFn: fetchProjects,
	});

	const { data: templates, isLoading: isLoadingTemplates } = useQuery({
		queryKey: ['projectTemplates'],
		queryFn: fetchProjectTemplates,
	});

	useEffect(() => {
		if (templates?.length === 1) {
			setSelectedId(templates[0].id);
		}
	}, [templates]);

	const handleCreate = async () => {
		if (!selectedId) return;

		try {
			const project = await createProjectWithTemplate(selectedId);
			navigate(`/project/${project.id}`);
		} catch (error) {
			console.error('Error creating project:', error);
		}
	};

	const selected = projects?.find(item => item.id === selectedId);

	useEffect(() => {
		console.log('Selected template:', selected);
	}, [selectedId, projects]);

	if (isLoadingStates || isLoadingTemplates) {
		return (
			<div className='container mx-auto p-4'>
				<h1 className='mb-4 text-2xl font-bold'>Create New Project</h1>
				<div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
					{[...Array(3)].map((_, i) => (
						<Card key={i} className='w-full'>
							<CardHeader>
								<Skeleton className='h-4 w-[250px]' />
								<Skeleton className='h-4 w-[200px]' />
							</CardHeader>
							<CardContent>
								<Skeleton className='h-4 w-[300px]' />
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		);
	}

	return (
		<div className='container mx-auto p-4'>
			<h1 className='mb-4 text-2xl font-bold'>Create New Project</h1>
			<div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
				{projects?.map(project => (
					<Card
						key={project.id}
						className={cn('hover:bg-accent w-full cursor-pointer', {
							'border-primary': selectedId === project.id,
						})}
						onClick={() => setSelectedId(project.id)}
					>
						<CardHeader>
							<CardTitle>Template {project.id}</CardTitle>
							<CardDescription>Description of template {project.id}</CardDescription>
						</CardHeader>
						<CardContent>
							<p className='text-sm'>Additional details about template {project.id}</p>
						</CardContent>
					</Card>
				))}
			</div>
			<div className='mt-4'>
				<Button onClick={handleCreate} disabled={!selectedId}>
					Create Project
				</Button>
			</div>
		</div>
	);
}
