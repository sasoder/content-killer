import React from 'react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Icons } from '@/components/common/icons';
import { fetchVoices } from '@/api/honoClient';
import { Voice } from '@content-killer/shared';

interface VoiceSelectorProps {
	value: string;
	onValueChange: (value: string) => void;
}

const VoiceSelector: React.FC<VoiceSelectorProps> = ({ value, onValueChange }) => {
	const { data, isLoading, error } = useQuery({
		queryKey: ['voices'],
		queryFn: fetchVoices,
	});

	if (error) {
		return (
			<div className='text-destructive flex items-center gap-2 text-sm'>
				<Icons.alertTriangle className='h-4 w-4' />
				Failed to load voices
			</div>
		);
	}

	return (
		<Select value={value} onValueChange={onValueChange}>
			<SelectTrigger className='w-full capitalize'>
				<SelectValue>
					{isLoading ? (
						<div className='flex items-center gap-2'>
							<Icons.loader className='h-4 w-4 animate-spin' />
							Loading voices...
						</div>
					) : (
						data?.find((v: Voice) => v.id === value)?.name || 'Select a voice'
					)}
				</SelectValue>
			</SelectTrigger>
			<SelectContent>
				<ScrollArea className='h-[200px]'>
					<SelectGroup>
						{data?.map((voice: Voice) => (
							<SelectItem className='capitalize' key={voice.id} value={voice.id}>
								{voice.name}
							</SelectItem>
						))}
					</SelectGroup>
				</ScrollArea>
			</SelectContent>
		</Select>
	);
};

export default VoiceSelector;
