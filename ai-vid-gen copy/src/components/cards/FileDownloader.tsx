import React from 'react';
import { Button } from '@/components/ui/button';
import { fetchFile, fetchFiles } from '@/api/apiHelper';
import { useVideoGen } from '@/context/VideoGenContext';

const FileDownloader = () => {
	const { audioFiles, videoFile } = useVideoGen();

	return (
		<div className='flex h-full flex-col'>
			<div className='flex-grow'></div>
			<div className='flex justify-center'>
				<div className='flex flex-grow flex-col gap-2'>
					<Button disabled={audioFiles?.length === 0} onClick={() => fetchFiles(audioFiles)}>
						Download Audio
					</Button>
					<Button disabled={!videoFile} onClick={() => fetchFile(videoFile)}>
						Download Video
					</Button>
				</div>
			</div>
		</div>
	);
};

export default FileDownloader;
