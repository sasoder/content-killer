import { ProjectProvider, useProject } from '@/context/ProjectContext';
import FileDownloader from '@/components/cards/FileDownloader';
import GenerateDescription from '@/components/cards/GenerateDescription';
import GenerateCommentary from '@/components/cards/GenerateCommentary';
import GenerateVideo from '@/components/cards/GenerateVideo';
import StepTransition from '@/components/cards/StepTransition';
import StepCard from '@/components/cards/StepCard';
import { Icons } from '@/components/icons';
import { useParams } from 'react-router-dom';
import { HTTPError } from '@/components/HTTPError';
import { Header } from '@/components/layout/Header';
import { useVideoGeneration } from '@/hooks/useVideoGeneration';
import { VideoGenerationStep } from '@shared/types/api/schema';

const ProjectPageContent = () => {
	const { description, commentary, updateDescription, updateCommentary, metadata, isLoading, error, id } = useProject();
	const { state } = useVideoGeneration(id);

	if (isLoading) {
		return (
			<div className='flex h-screen items-center justify-center'>
				<Icons.loader className='h-8 w-8 animate-spin' />
			</div>
		);
	}

	if (error) {
		return <HTTPError error={error.message} />;
	}

	return (
		<>
			<Header title={metadata?.title || 'Content Killer'} showBackButton />
			<main className='container mx-auto space-y-8 p-4'>
				<div className='flex flex-row items-stretch justify-center gap-4'>
					<StepCard
						title='Description'
						content={<GenerateDescription />}
						info='This step generates a comprehensive description of the video, with timestamps for all the pivotal moments in the video.'
					/>

					{description && description.length > 0 && (
						<>
							<StepTransition data={description} jsonEditorTitle='Edit Description Data' onUpdate={updateDescription} />

							<StepCard
								title='Commentary'
								content={<GenerateCommentary />}
								info='This step generates a commentary for the video at all the pivotal moments in the video.'
							/>
						</>
					)}

					{commentary && commentary.length > 0 && (
						<>
							<StepTransition data={commentary} jsonEditorTitle='Edit Commentary Data' onUpdate={updateCommentary} />

							<StepCard
								title='Video'
								content={<GenerateVideo />}
								info='This step generates the final video with the specified options and commentary.'
							/>
						</>
					)}

					{state?.currentStep !== VideoGenerationStep.IDLE && (
						<>
							<StepTransition data={[]} jsonEditorTitle='' onUpdate={() => {}} />

							<StepCard
								title='Download Files'
								content={<FileDownloader />}
								info='This step downloads the generated video and audio files.'
							/>
						</>
					)}
				</div>

				<div>
					<p className='text-muted-foreground text-sm'>
						This app uses Gemini 1.5 Pro to generate a description of the provided video. The description is then used
						to create a commentary at all pivotal moments in the video with GPT 4o mini. This commentary is sent to
						Elevenlabs and made into audio files.
					</p>
				</div>
			</main>
		</>
	);
};

export default function ProjectPage() {
	const { id } = useParams();

	return (
		<ProjectProvider id={id as string}>
			<ProjectPageContent />
		</ProjectProvider>
	);
}
