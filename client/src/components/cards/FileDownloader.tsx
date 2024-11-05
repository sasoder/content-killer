import { Button } from '@/components/ui/button';
import { fetchFile, fetchFiles } from '@/api/apiHelper';
import { useVideoGen } from '@/context/VideoGenContext';

const FileDownloader = () => {
	const { audioIds, videoId } = useVideoGen();
	return (
		<div className='flex h-full flex-col'>
			<div className='flex-grow'>
				{audioIds && audioIds.length > 0 ? (
					<p className='text-sm text-gray-500'>Audio Files: {audioIds.length}</p>
				) : (
					<p className='text-sm text-gray-500'>No audio files.</p>
				)}
				{videoId ? (
					<p className='text-sm text-gray-500'>Video File: {videoId}</p>
				) : (
					<p className='text-sm text-gray-500'>No video file.</p>
				)}
			</div>
			<div className='flex justify-center'>
				<div className='flex flex-grow flex-col gap-2'>
					<div className='flex justify-center'>
						<Button disabled={!audioIds || audioIds.length === 0} onClick={() => fetchFiles(audioIds)}>
							Download Audio
						</Button>
					</div>
					<div className='flex justify-center'>
						<Button disabled={!videoId} onClick={() => fetchFile(videoId ?? '')}>
							Download Video
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default FileDownloader;
