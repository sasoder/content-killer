import { Button } from '@/components/ui/button';
import { FileResponse } from '@/lib/schema';
import { downloadAll, downloadFile } from '@/api/apiHelper';

interface FileDownloaderProps {
	files: FileResponse;
	videoFile: string;
}

export default function FileDownloader({
	files,
	videoFile,
}: FileDownloaderProps) {
	const noFiles = !files || files.items.length === 0;
	const noVideoFile = !videoFile || videoFile === '';

	const handleDownload = (fileResponse: FileResponse, videoFile: string) => {
		downloadAll(fileResponse, 'audio');
		downloadFile(videoFile, 'video');
	};

	return (
		<div className='flex h-full flex-col justify-between gap-4'>
			<div className='flex flex-col justify-start gap-2'>
				{noFiles ? (
					<p className='text-sm text-gray-500'>No files generated yet.</p>
				) : (
					<p className='text-sm text-gray-500'>
						{files.items.length} audio{' '}
						{files.items.length === 1 ? 'file' : 'files'}{' '}
						{files.items.length === 1 ? 'is' : 'are'} ready for download.
					</p>
				)}
				{noVideoFile ? (
					<p className='text-sm text-gray-500'>No video file generated yet.</p>
				) : (
					<>
						<p className='text-sm text-gray-500'>
							The video file has been generated:
						</p>
						<p className='text-sm text-gray-500'>{videoFile}</p>
					</>
				)}
			</div>
			<div className='flex justify-center'>
				<Button
					className='flex justify-center'
					disabled={noFiles}
					onClick={() => handleDownload(files, videoFile)}
				>
					Download All
				</Button>
			</div>
		</div>
	);
}
