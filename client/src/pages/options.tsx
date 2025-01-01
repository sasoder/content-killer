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
	defaultDescriptionOptions,
	defaultCommentaryOptions,
	defaultVideoOptions,
} from '@shared/types/options/defaultOptions';
import {
	fetchOptionConfigs,
	createOptionConfig,
	updateOptionConfig,
	deleteOptionConfig,
	uploadPauseSound,
} from '@/api/apiHelper';
import { OptionConfig } from '@shared/types/options/config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/layout/Header';

export default function OptionsPage() {
	const { toast } = useToast();
	const [configs, setConfigs] = useState<OptionConfig[]>([]);
	const [selectedConfig, setSelectedConfig] = useState<OptionConfig | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		loadConfigs();
	}, []);

	const loadConfigs = async () => {
		try {
			const fetchedConfigs = await fetchOptionConfigs();
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
			const newConfig = await createOptionConfig({
				name: 'New Configuration',
				description: 'Description of the configuration',
				options: {
					description: defaultDescriptionOptions,
					commentary: defaultCommentaryOptions,
					video: defaultVideoOptions,
				},
				pauseSoundPath: '',
			});
			setConfigs([...configs, newConfig]);
			setSelectedConfig(newConfig);
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
			const updatedConfig = await updateOptionConfig(selectedConfig);
			setConfigs(configs.map(c => (c.id === updatedConfig.id ? updatedConfig : c)));
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
			await deleteOptionConfig(id);
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

	const handlePauseSoundUpload = async (file: File) => {
		if (!selectedConfig) return;

		try {
			setIsLoading(true);
			const fileName = await uploadPauseSound(selectedConfig.id, file);
			const updatedConfig = {
				...selectedConfig,
				pauseSoundPath: fileName,
			};
			await updateOptionConfig(updatedConfig);
			setSelectedConfig(updatedConfig);
			setConfigs(configs.map(c => (c.id === updatedConfig.id ? updatedConfig : c)));
			toast({
				title: 'Success',
				description: 'Pause sound uploaded successfully',
			});
		} catch (error) {
			console.error('Error uploading pause sound:', error);
			toast({
				title: 'Error',
				description: 'Failed to upload pause sound',
				variant: 'destructive',
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<>
			<Header title='Option Configurations' showBackButton backTo='/' />
			<div className='container mx-auto p-4'>
				<div className='mb-4 flex items-center justify-between'>
					<h1 className='text-2xl font-bold'>Option Configurations</h1>
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
											onClick={() => setSelectedConfig(config)}
										>
											<span className='font-medium'>{config.name}</span>
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
														handlePauseSoundUpload(file);
													}
												}}
											/>
											{selectedConfig.pauseSoundPath && (
												<p className='text-muted-foreground text-sm'>Current: {selectedConfig.pauseSoundPath}</p>
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

										<div className='flex justify-end'>
											<Button onClick={handleSave} disabled={isLoading}>
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
