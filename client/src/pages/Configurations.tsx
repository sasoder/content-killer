import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Icons } from '@/components/icons';
import StepOptions from '@/components/cards/StepOptions';
import {
	descriptionOptionDefinitions,
	commentaryOptionDefinitions,
	videoOptionDefinitions,
} from '@/lib/options/optionDefinitions';
import {
	fetchProjectConfigs,
	createProjectConfig,
	updateProjectConfig,
	deleteProjectConfig,
	uploadPauseSound,
} from '@/api/apiHelper';
import { ProjectConfig } from '@shared/types/options/config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/layout/Header';
import VoiceSelector from '@/components/VoiceSelector';

export default function ConfigurationsPage() {
	const { toast } = useToast();
	const [configs, setConfigs] = useState<ProjectConfig[]>([]);
	const [selectedConfig, setSelectedConfig] = useState<ProjectConfig | null>(null);
	const [originalConfig, setOriginalConfig] = useState<ProjectConfig | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [pauseSoundFile, setPauseSoundFile] = useState<File | null>(null);

	useEffect(() => {
		loadConfigs();
	}, []);

	const handleConfigSelect = (config: ProjectConfig) => {
		setSelectedConfig(config);
		setOriginalConfig(config);
		setPauseSoundFile(null);
	};

	const hasChanges = () => {
		if (!selectedConfig || !originalConfig) return false;
		if (pauseSoundFile) return true;

		return (
			selectedConfig.name !== originalConfig.name ||
			selectedConfig.description !== originalConfig.description ||
			JSON.stringify(selectedConfig.options) !== JSON.stringify(originalConfig.options)
		);
	};

	const loadConfigs = async () => {
		try {
			const fetchedConfigs = await fetchProjectConfigs();
			setConfigs(fetchedConfigs);
		} catch (error) {
			console.error('Error loading configs:', error);
			toast({
				title: 'Error',
				description: 'Failed to load option configurations',
				variant: 'destructive',
			});
		}
	};

	const handleCreateNew = async () => {
		try {
			const newConfig = await createProjectConfig();
			setConfigs([...configs, newConfig]);
			handleConfigSelect(newConfig);
		} catch (error) {
			console.error('Error creating config:', error);
			toast({
				title: 'Error',
				description: 'Failed to create configuration',
				variant: 'destructive',
			});
		}
	};

	const handleSave = async () => {
		if (!selectedConfig) return;

		try {
			setIsLoading(true);

			let updatedConfig = { ...selectedConfig };

			if (pauseSoundFile) {
				const response = await uploadPauseSound(selectedConfig.id, pauseSoundFile);
				updatedConfig = {
					...updatedConfig,
					pauseSoundFilename: response.filename,
				};
			}

			const savedConfig = await updateProjectConfig(updatedConfig);
			setConfigs(configs.map(c => (c.id === savedConfig.id ? savedConfig : c)));
			setSelectedConfig(savedConfig);
			setOriginalConfig(savedConfig);
			setPauseSoundFile(null);

			toast({
				title: 'Success',
				description: 'Configuration saved successfully',
			});
		} catch (error) {
			console.error('Error saving config:', error);
			toast({
				title: 'Error',
				description: 'Failed to save configuration',
				variant: 'destructive',
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleDelete = async (id: string) => {
		try {
			await deleteProjectConfig(id);
			setConfigs(configs.filter(c => c.id !== id));
			if (selectedConfig?.id === id) {
				setSelectedConfig(null);
			}
			toast({
				title: 'Success',
				description: 'Configuration deleted successfully',
			});
		} catch (error) {
			console.error('Error deleting config:', error);
			toast({
				title: 'Error',
				description: 'Failed to delete configuration',
				variant: 'destructive',
			});
		}
	};

	return (
		<>
			<Header title='Project Configurations' showBackButton backTo='/' />
			<div className='container mx-auto p-4'>
				<div className='mb-4 flex items-center justify-between'>
					<h1 className='text-2xl font-bold'>Project Configurations</h1>
					<Button onClick={handleCreateNew}>
						<Icons.plus className='mr-2 h-4 w-4' />
						New Configuration
					</Button>
				</div>

				<div className='grid grid-cols-12 gap-4'>
					<div className='col-span-4'>
						<Card>
							<CardHeader>
								<CardTitle>Saved Configurations</CardTitle>
								<CardDescription>Select a configuration to edit</CardDescription>
							</CardHeader>
							<CardContent>
								<div className='space-y-2'>
									{configs.map(config => (
										<div
											key={config.id}
											className='hover:bg-accent flex cursor-pointer items-center justify-between rounded p-2'
											onClick={() => handleConfigSelect(config)}
										>
											<span className='font-medium'>{config.name}</span>
											{config.id !== 'default' && (
												<Button
													variant='ghost'
													size='sm'
													onClick={e => {
														e.stopPropagation();
														handleDelete(config.id);
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

					{selectedConfig && (
						<div className='col-span-8'>
							<Card>
								<CardHeader>
									<CardTitle>Edit Configuration</CardTitle>
									<CardDescription>Modify the configuration settings</CardDescription>
								</CardHeader>
								<CardContent>
									<div className='space-y-4'>
										<div className='space-y-2'>
											<Label htmlFor='name'>Name</Label>
											<Input
												id='name'
												value={selectedConfig.name}
												onChange={e => setSelectedConfig({ ...selectedConfig, name: e.target.value })}
											/>
										</div>

										<div className='space-y-2'>
											<Label htmlFor='description'>Description</Label>
											<Textarea
												id='description'
												value={selectedConfig.description}
												onChange={e =>
													setSelectedConfig({
														...selectedConfig,
														description: e.target.value,
													})
												}
											/>
										</div>

										<div className='space-y-2'>
											<Label htmlFor='pauseSound'>Pause Sound</Label>
											<Input
												id='pauseSound'
												type='file'
												accept='audio/mp3,audio/mpeg,audio/wav,audio/m4a,audio/aac'
												onChange={e => {
													const file = e.target.files?.[0];
													if (file) {
														setPauseSoundFile(file);
													}
												}}
											/>
											{selectedConfig.pauseSoundFilename && !pauseSoundFile && (
												<p className='text-muted-foreground text-sm'>
													Current pause sound: {selectedConfig.pauseSoundFilename}
												</p>
											)}
											{pauseSoundFile && (
												<p className='text-muted-foreground text-sm'>
													New pause sound selected: {pauseSoundFile.name}. Click "Save Changes" to apply.
												</p>
											)}
										</div>

										<Separator className='my-4' />

										<StepOptions
											options={selectedConfig.options.description}
											onOptionChange={newOptions =>
												setSelectedConfig({
													...selectedConfig,
													options: {
														...selectedConfig.options,
														description: newOptions,
													},
												})
											}
											optionDefinitions={descriptionOptionDefinitions}
											type='description'
										/>

										<StepOptions
											options={selectedConfig.options.commentary}
											onOptionChange={newOptions =>
												setSelectedConfig({
													...selectedConfig,
													options: {
														...selectedConfig.options,
														commentary: newOptions,
													},
												})
											}
											optionDefinitions={commentaryOptionDefinitions}
											type='commentary'
										/>

										<StepOptions
											options={selectedConfig.options.video.video}
											onOptionChange={newOptions =>
												setSelectedConfig({
													...selectedConfig,
													options: {
														...selectedConfig.options,
														video: {
															...selectedConfig.options.video,
															video: newOptions,
														},
													},
												})
											}
											optionDefinitions={videoOptionDefinitions.video}
											type='video'
										/>

										<StepOptions
											options={selectedConfig.options.video.audio}
											onOptionChange={newOptions =>
												setSelectedConfig({
													...selectedConfig,
													options: {
														...selectedConfig.options,
														video: {
															...selectedConfig.options.video,
															audio: newOptions,
														},
													},
												})
											}
											optionDefinitions={videoOptionDefinitions.audio}
											type='audio'
										/>

										<div className='flex flex-col gap-1'>
											<label className='text-sm font-medium'>Voice</label>
											<VoiceSelector
												value={selectedConfig.options.video.audio.voiceId}
												onValueChange={voiceId =>
													setSelectedConfig({
														...selectedConfig,
														options: {
															...selectedConfig.options,
															video: {
																...selectedConfig.options.video,
																audio: {
																	...selectedConfig.options.video.audio,
																	voiceId,
																},
															},
														},
													})
												}
											/>
										</div>

										<div className='flex justify-end'>
											<Button onClick={handleSave} disabled={isLoading || !hasChanges()}>
												{isLoading ? (
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
						</div>
					)}
				</div>
			</div>
		</>
	);
}
