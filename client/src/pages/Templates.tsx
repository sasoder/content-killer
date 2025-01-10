import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import {
	fetchProjectTemplates,
	createProjectTemplate,
	updateProjectTemplate,
	deleteProjectTemplate,
	uploadPauseSound,
} from '@/api/honoClient';
import { ProjectTemplate } from '@shared/types/options/template';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/layout/Header';
import { TemplateCard } from '@/components/TemplateCard';

export default function TemplatesPage() {
	const { toast } = useToast();
	const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
	const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);
	const [loading, setLoading] = useState(false);

	const handleTemplateSelect = (template: ProjectTemplate) => {
		setSelectedTemplate(template);
	};

	const hasChanges = () => {
		if (!selectedTemplate) return false;
		const original = templates.find(t => t.id === selectedTemplate.id);
		if (!original) return true;
		return JSON.stringify(original) !== JSON.stringify(selectedTemplate);
	};

	const loadTemplates = async () => {
		try {
			const data = await fetchProjectTemplates();
			setTemplates(data);
		} catch (error) {
			console.error('Failed to load templates:', error);
			toast({
				title: 'Error',
				description: 'Failed to load templates',
				variant: 'destructive',
			});
		}
	};

	const handleCreateNew = async () => {
		try {
			const newTemplate = await createProjectTemplate();
			setTemplates(prev => [newTemplate, ...prev]);
			setSelectedTemplate(newTemplate);
		} catch (error) {
			console.error('Failed to create template:', error);
			toast({
				title: 'Error',
				description: 'Failed to create template',
				variant: 'destructive',
			});
		}
	};

	const handleSave = async () => {
		if (!selectedTemplate) return;

		try {
			setLoading(true);
			let updatedTemplate = await updateProjectTemplate(selectedTemplate);

			const pauseSound = (selectedTemplate as any).pauseSound;
			if (pauseSound instanceof File) {
				const { filename } = await uploadPauseSound(selectedTemplate.id, pauseSound);
				updatedTemplate = {
					...updatedTemplate,
					pauseSoundFilename: filename,
				};
			}

			setTemplates(prev => prev.map(t => (t.id === updatedTemplate.id ? updatedTemplate : t)));
			setSelectedTemplate(updatedTemplate);

			toast({
				title: 'Success',
				description: 'Template saved successfully',
			});
		} catch (error) {
			console.error('Failed to save template:', error);
			toast({
				title: 'Error',
				description: 'Failed to save template',
				variant: 'destructive',
			});
		} finally {
			setLoading(false);
		}
	};

	const handleDelete = async (id: string) => {
		try {
			await deleteProjectTemplate(id);
			setTemplates(prev => prev.filter(t => t.id !== id));
			if (selectedTemplate?.id === id) {
				setSelectedTemplate(null);
			}
			toast({
				title: 'Success',
				description: 'Template deleted successfully',
			});
		} catch (error) {
			console.error('Failed to delete template:', error);
			toast({
				title: 'Error',
				description: 'Failed to delete template',
				variant: 'destructive',
			});
		}
	};

	useEffect(() => {
		loadTemplates();
	}, []);

	return (
		<div className='bg-background min-h-screen'>
			<Header title='Project Templates' showBackButton />
			<div className='container mx-auto p-6'>
				<div className='grid grid-cols-12 gap-6'>
					{/* Templates List - Left Side */}
					<div className='col-span-full lg:col-span-4'>
						<Card className='h-fit'>
							<CardHeader className='flex flex-row items-center justify-between pb-4'>
								<div>
									<CardTitle>Templates</CardTitle>
									<CardDescription className='mt-1'>Pre-defined templates for your projects</CardDescription>
								</div>
								<Button onClick={handleCreateNew} size='icon' variant='default'>
									<Icons.plus className='h-4 w-4' />
								</Button>
							</CardHeader>
							<CardContent>
								<div className='space-y-2'>
									{templates.map(template => (
										<div
											key={template.id}
											className={`hover:bg-accent hover:text-accent-foreground group flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors ${
												selectedTemplate?.id === template.id ? 'bg-accent text-accent-foreground' : ''
											}`}
											onClick={() => handleTemplateSelect(template)}
										>
											<div className='flex flex-col'>
												<span className='font-medium'>{template.name}</span>
												<span className='text-muted-foreground text-xs'>
													{template.description || 'No description'}
												</span>
											</div>
											{template.id !== 'default' && (
												<Button
													variant='ghost'
													size='sm'
													onClick={e => {
														e.stopPropagation();
														handleDelete(template.id);
													}}
												>
													<Icons.trash className='h-4 w-4' />
												</Button>
											)}
										</div>
									))}
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Configuration - Right Side */}
					<div className='col-span-full lg:col-span-8'>
						{selectedTemplate ? (
							<Card>
								<CardHeader>
									<CardTitle>Edit Template</CardTitle>
									<CardDescription>Customize settings for this template</CardDescription>
								</CardHeader>
								<CardContent>
									<div className='flex flex-col'>
										<TemplateCard
											template={selectedTemplate}
											onChange={setSelectedTemplate}
											onPauseSoundSelect={(file: File) => {
												if (selectedTemplate) {
													setSelectedTemplate({
														...selectedTemplate,
														pauseSound: file,
													} as ProjectTemplate);
												}
											}}
										/>

										{/* Save Button */}
										<div className='flex justify-end'>
											<Button onClick={handleSave} disabled={loading || !hasChanges()} className='shadow-sm'>
												{loading ? (
													<>
														<Icons.loader className='mr-2 h-4 w-4 animate-spin' />
														Saving...
													</>
												) : (
													'Save Changes'
												)}
											</Button>
										</div>
									</div>
								</CardContent>
							</Card>
						) : (
							<div className='flex h-full items-center justify-center rounded-lg border-2 border-dashed p-12'>
								<div className='text-center'>
									<Icons.settings className='text-muted-foreground mx-auto h-12 w-12' />
									<h3 className='mt-4 text-lg font-semibold'>No Template Selected</h3>
									<p className='text-muted-foreground mt-2 text-sm'>
										Select a template from the list to edit or create a new one
									</p>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
