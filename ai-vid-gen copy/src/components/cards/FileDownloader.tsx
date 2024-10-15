import React from 'react';
import { Button } from '@/components/ui/button';
import { fetchFile, fetchFiles } from '@/api/apiHelper';
import { useVideoGen } from '@/context/VideoGenContext';

const FileDownloader = () => {
	const { audioFiles, videoFile } = useVideoGen();

	return (
		<div>
			<Button onClick={() => fetchFiles(audioFiles)}>Download Audio</Button>
			{videoFile && <Button onClick={() => fetchFile(videoFile)}>Download Video</Button>}
		</div>
	);
};

export default FileDownloader;
