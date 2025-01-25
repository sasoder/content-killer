import React from 'react';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/common/icons';

const SoundUpload = ({
	currentFileName,
	onFileSelect,
}: {
	currentFileName: string;
	onFileSelect: (file: File) => void;
}) => {
	return (
		<div className='flex flex-col items-start gap-2'>
			<Label>Pause Sound</Label>
			<div className='flex flex-row items-center gap-4'>
				<input
					type='file'
					accept='audio/*'
					onChange={e => e.target.files?.[0] && onFileSelect(e.target.files[0])}
					className='hidden'
					id='sound-upload'
				/>
				<label
					htmlFor='sound-upload'
					className='border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border'
				>
					<Icons.upload className='h-4 w-4' />
				</label>
				{currentFileName && <span className='text-muted-foreground text-sm'>{currentFileName}</span>}
			</div>
		</div>
	);
};

export default SoundUpload;
