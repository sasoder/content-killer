import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
	commentaryOptionDefinitions,
	descriptionOptionDefinitions,
	videoOptionDefinitions,
} from '@/lib/options/optionDefinitions';
import { Template } from '@shared/types/options/template';
import StepOptions from '@/components/cards/StepOptions';
import VoiceSelector from '@/components/VoiceSelector';
import SoundUpload from '@/components/ui/SoundUpload';

interface TemplateCardProps {
	template: Template;
	onChange: (template: Template) => void;
	onPauseSoundSelect: (file: File) => void;
}

export function TemplateCard({ template, onChange, onPauseSoundSelect }: TemplateCardProps) {
	return (
		<div className='space-y-6'>
			{/* Basic Info Section */}
			<div className='space-y-4'>
				<div className='flex items-start gap-4'>
					<div className='flex-1'>
						<Label htmlFor='name' className='mb-2 block'>
							Name
						</Label>
						<Input
							id='name'
							value={template.name}
							onChange={e => onChange({ ...template, name: e.target.value })}
							placeholder='Template name'
						/>
					</div>
				</div>

				<div>
					<Label htmlFor='description' className='mb-2 block'>
						Description
					</Label>
					<Textarea
						id='description'
						value={template.description}
						onChange={e => onChange({ ...template, description: e.target.value })}
						placeholder='Enter a description for this template'
						className='h-24'
					/>
				</div>
			</div>

			{/* Options Section */}
			<div className='grid grid-cols-4 gap-6'>
				{/* Description Options */}
				<div>
					<StepOptions
						options={template.options.description}
						onOptionChange={newOptions =>
							onChange({ ...template, options: { ...template.options, description: newOptions } })
						}
						optionDefinitions={descriptionOptionDefinitions}
						type='description'
					/>
				</div>

				{/* Commentary Options */}
				<div>
					<StepOptions
						options={template.options.commentary}
						onOptionChange={newOptions =>
							onChange({ ...template, options: { ...template.options, commentary: newOptions } })
						}
						optionDefinitions={commentaryOptionDefinitions}
						type='commentary'
					/>
				</div>
				{/* Audio Options */}
				<div className='flex flex-col gap-4'>
					<StepOptions
						options={template.options.video.audio}
						onOptionChange={newOptions =>
							onChange({
								...template,
								options: {
									...template.options,
									video: {
										...template.options.video,
										audio: newOptions,
									},
								},
							})
						}
						optionDefinitions={videoOptionDefinitions.audio}
						type='audio'
					/>
					<div className='flex flex-col gap-2'>
						<Label>Voice</Label>
						<VoiceSelector
							value={template.options.video.audio.voiceId}
							onValueChange={voiceId =>
								onChange({
									...template,
									options: {
										...template.options,
										video: {
											...template.options.video,
											audio: {
												...template.options.video.audio,
												voiceId,
											},
										},
									},
								})
							}
						/>
					</div>
					<div>
						<SoundUpload currentFileName={template.pauseSoundFilename} onFileSelect={onPauseSoundSelect} />
					</div>
				</div>

				{/* Video Options */}
				<div>
					<StepOptions
						options={template.options.video.video}
						onOptionChange={newOptions =>
							onChange({
								...template,
								options: {
									...template.options,
									video: {
										...template.options.video,
										video: newOptions,
									},
								},
							})
						}
						optionDefinitions={videoOptionDefinitions.video}
						type='video'
					/>
				</div>
			</div>
		</div>
	);
}
