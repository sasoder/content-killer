import { VideoGenProvider, useVideoGen } from '@/context/VideoGenContext';
import FileDownloader from '@/components/cards/FileDownloader';
import GenerateDescription from '@/components/cards/GenerateDescription';
import GenerateCommentary from '@/components/cards/GenerateCommentary';
import GenerateVideo from '@/components/cards/GenerateVideo';
import StepTransition from '@/components/cards/StepTransition';
import StepCard from '@/components/cards/StepCard';
import { Icons } from '@/components/icons';
import { ModeToggle } from '@/components/mode-toggle';
import { Button } from '@/components/ui/button';
import { Link, useParams, useSearchParams } from 'react-router-dom';

const GeneratePageContent = () => {
	const { description, commentary, audioFiles, updateDescription, updateCommentary, metadata } = useVideoGen();

	console.log(metadata);
	return (
		<main className='container mx-auto space-y-8 p-4'>
			<div className='flex flex-row items-center justify-center gap-4 pt-2'>
				<div className='absolute left-0 top-0 m-4'>
					<Link to='/'>
						<Button variant='ghost' size='icon'>
							<Icons.chevronLeft className='h-[1.5rem] w-[1.5rem] -translate-x-[0.075rem]' />
						</Button>
					</Link>
				</div>
				<div className='absolute right-0 top-0 m-4'>
					<ModeToggle />
				</div>
				<h1 className='flex items-center justify-center text-3xl'>{metadata?.title || 'Content Killer'}</h1>
				<Icons.skull className='h-12 w-12 -translate-y-1' />
			</div>

			<div className='flex flex-row items-stretch justify-center gap-4'>
				<StepCard
					title='Description'
					content={<GenerateDescription />}
					info='This step generates a comprehensive description of the video, with timestamps for all the pivotal moments in the video.'
				/>

				{description?.items?.length > 0 && (
					<>
						<StepTransition data={description} jsonEditorTitle='Edit Description Data' onUpdate={updateDescription} />

						<StepCard
							title='Commentary'
							content={<GenerateCommentary />}
							info='This step generates a commentary for the video at all the pivotal moments in the video.'
						/>
					</>
				)}

				{commentary?.items?.length > 0 && (
					<>
						<StepTransition data={commentary} jsonEditorTitle='Edit Commentary Data' onUpdate={updateCommentary} />

						<StepCard
							title='Video'
							content={<GenerateVideo />}
							info='This step generates the final video with the specified options and commentary.'
						/>
					</>
				)}

				{audioFiles?.length > 0 && commentary?.items?.length > 0 && (
					<>
						<StepTransition data={null} jsonEditorTitle={null} onUpdate={null} />

						<StepCard
							title='Download'
							content={<FileDownloader />}
							info='This step downloads the generated video and audio files.'
						/>
					</>
				)}
			</div>

			<div>
				<p className='text-sm text-gray-500'>
					This app uses Gemini 1.5 Pro to generate a description of the provided video. The description is then used to
					create a commentary at all pivotal moments in the video with GPT 4o mini. This commentary is sent to
					Elevenlabs and made into audio files.
				</p>
			</div>
		</main>
	);
};

export default function GeneratePage() {
	const { id } = useParams();

	return (
		<VideoGenProvider id={id as string}>
			<GeneratePageContent />
		</VideoGenProvider>
	);
}
