import { Button } from '@/components/ui/button';
import { fetchFile, fetchFiles } from '@/api/apiHelper';
import { useVideoGen } from '@/context/VideoGenContext';
import { useVideoGeneration, VideoGenStatus } from '@/hooks/useVideoGeneration';
import { Icons } from '@/components/icons';

const FileDownloader = () => {
	const { id } = useVideoGen();
	const { status, videoId, audioIds, isLoading } = useVideoGeneration(id);

	const isGenerating = status === ('generating' as VideoGenStatus);

	if (isLoading || isGenerating) {
		return (
			<div className='flex h-full flex-col items-center justify-center'>
				<Icons.loader className='h-8 w-8 animate-spin' />
				<p className='mt-2 text-sm text-gray-500'>Generating video...</p>
			</div>
		);
	}

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
						<Button disabled={!videoId || isGenerating} onClick={() => fetchFile(videoId ?? '')}>
							Download Video
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default FileDownloader;
