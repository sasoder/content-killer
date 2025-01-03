import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';

const SoundUpload = ({
	currentFileName,
	onFileSelect,
	accept = 'audio/mp3,audio/mpeg,audio/wav,audio/m4a,audio/aac',
}: {
	currentFileName: string;
	onFileSelect: (file: File) => void;
	accept?: string;
}) => {
	const [isDragging, setIsDragging] = useState(false);

	const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
	};

	const handleDragIn = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(true);
	};

	const handleDragOut = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(false);
	};

	const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(false);

		const file = e.dataTransfer.files[0];
		if (file && file.type.startsWith('audio/')) {
			onFileSelect(file);
		}
	};

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			onFileSelect(file);
		}
	};

	return (
		<div className='space-y-2'>
			<Label>Pause Sound</Label>
			<div
				className={`relative rounded-lg border-2 border-dashed p-4 transition-colors ${
					isDragging ? 'border-primary bg-primary/10' : 'border-muted-foreground/25'
				}`}
				onDragEnter={handleDragIn}
				onDragLeave={handleDragOut}
				onDragOver={handleDrag}
				onDrop={handleDrop}
			>
				<input
					type='file'
					accept={accept}
					onChange={handleFileSelect}
					className='absolute inset-0 cursor-pointer opacity-0'
				/>
				<div className='text-center'>
					<Icons.upload className='text-muted-foreground mx-auto h-8 w-8' />
					<p className='mt-2 text-sm font-medium'>Drop your audio file here or click to browse</p>
					<p className='text-muted-foreground mt-1 text-xs'>Supports MP3, WAV, M4A, AAC files</p>
					{currentFileName && (
						<div className='mt-3 flex items-center justify-center gap-2'>
							<Icons.music className='text-primary h-4 w-4' />
							<span className='text-xs font-medium'>{currentFileName}</span>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default SoundUpload;
