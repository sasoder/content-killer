import { Suspense, useState, useEffect, useCallback } from 'react';
import { fetchExistingData, generateVideo } from '@/api/apiHelper';
import FileDownloader from '@/components/cards/FileDownloader';
import GenerateDescription from '@/components/cards/GenerateDescription';
import GeneratePost from '@/components/cards/GeneratePost';
import GenerateVideo from '@/components/cards/GenerateVideo'; // New Import
import StepTransition from '@/components/cards/StepTransition';
import StepCard from '@/components/cards/StepCard';
import { TimestampTextList, FileResponse, VideoOptions } from '@/lib/schema';
import { Icons } from '@/components/icons';
import { CardSkeleton } from '@/components/skeletons/CardSkeletion';
import { ModeToggle } from '@/components/mode-toggle';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { GenerateOptions } from '@/lib/types';
import { CommentaryOptions, AudioOptions } from '@/lib/schema';
import { generateCommentary, generateAudio } from '@/api/apiHelper';
import {
	commentaryOptions,
	audioOptions,
	videoOptions,
} from '@/lib/defaultOptions';
// Define a union type for the different data types
type DataType = TimestampTextList | FileResponse | string | null;

// Define a generic update function type
type UpdateFunction<T> = (newData: T) => void;

export default function GeneratePage() {
	const [description, setDescription] = useState<DataType>(null);
	const [commentary, setCommentary] = useState<DataType>(null);
	const [audioFiles, setAudioFiles] = useState<DataType>(null);
	const [videoFile, setVideoFile] = useState<string>('');
	const [isLoading, setIsLoading] = useState(true);

	const fetchAllData = useCallback(async () => {
		setIsLoading(true);
		try {
			const [descriptionData, commentaryData, audioData, videoFile] =
				await Promise.all([
					fetchExistingData('description'),
					fetchExistingData('commentary'),
					fetchExistingData('audio'),
					fetchExistingData('video'),
				]);
			setDescription(descriptionData);
			setCommentary(commentaryData);
			setAudioFiles(audioData);
			console.log(videoFile);
			setVideoFile(videoFile);
		} catch (error) {
			console.error('Error fetching data:', error);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchAllData();
	}, [fetchAllData]);

	const createUpdateFunction = <T extends DataType>(
		setter: React.Dispatch<React.SetStateAction<T>>,
	): UpdateFunction<T> => {
		return (newData: T) => setter(newData);
	};

	const updateDescription = createUpdateFunction<TimestampTextList>(
		setDescription as React.Dispatch<React.SetStateAction<TimestampTextList>>,
	);
	const updateCommentary = createUpdateFunction<TimestampTextList>(
		setCommentary as React.Dispatch<React.SetStateAction<TimestampTextList>>,
	);
	const updateAudio = createUpdateFunction<FileResponse>(
		setAudioFiles as React.Dispatch<React.SetStateAction<FileResponse>>,
	);
	const updateVideo = createUpdateFunction<string>(
		setVideoFile as React.Dispatch<React.SetStateAction<string>>,
	);

	function isTimestampTextList(data: DataType): data is TimestampTextList {
		return (
			data !== null &&
			typeof data === 'object' &&
			'items' in data &&
			Array.isArray(data.items) &&
			data.items.length > 0 &&
			typeof data.items[0] === 'object' &&
			'timestamp' in data.items[0] &&
			'text' in data.items[0]
		);
	}

	const commentaryGenerateFunction = async (
		data: TimestampTextList | FileResponse,
		options: Record<string, number | boolean>,
	): Promise<TimestampTextList | FileResponse> => {
		if (isTimestampTextList(data)) {
			const commentaryOptions: CommentaryOptions = options as CommentaryOptions;
			return generateCommentary(data, commentaryOptions);
		} else {
			throw new Error('Invalid data type for commentary generation');
		}
	};

	const audioGenerateFunction = async (
		data: TimestampTextList | FileResponse,
		options: Record<string, number | boolean>,
	): Promise<FileResponse> => {
		if (!isTimestampTextList(data)) {
			throw new Error('Invalid data type for audio generation');
		}
		const audioOptions: AudioOptions = {
			...options,
			stability: (options.stability as number) ?? 0.7,
		};
		return generateAudio(data, audioOptions);
	};

	// New Video Generate Function
	const videoGenerateFunction = async (
		newOptions: VideoOptions,
	): Promise<string> => {
		// Implement the video generation logic as needed
		// For example, call the API and update the state
		// This is handled in the GenerateVideo component
		return await generateVideo(newOptions);
	};

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
				<h1 className='flex items-center justify-center text-3xl'>
					Content Killer
				</h1>
				<Icons.skull className='h-12 w-12 -translate-y-1' />
			</div>

			<div className='flex flex-row items-stretch justify-center gap-4'>
				<StepCard
					title='Description'
					content={
						<Suspense fallback={<CardSkeleton />}>
							<GenerateDescription mutate={updateDescription} />
						</Suspense>
					}
					info='This step generates a comprehensive description of the video, with timestamps for all the pivotal moments in the video.'
				/>

				<StepTransition
					data={description as TimestampTextList}
					jsonEditorTitle='Edit Description Data'
					onUpdate={updateDescription}
				/>

				<StepCard
					title='Commentary'
					content={
						<Suspense fallback={<CardSkeleton />}>
							<GeneratePost
								dataType='commentary'
								data={description as TimestampTextList}
								mutate={(newData: TimestampTextList | FileResponse) =>
									updateCommentary(newData as TimestampTextList)
								}
								options={commentaryOptions}
								generateFunction={commentaryGenerateFunction}
							/>
						</Suspense>
					}
					info='This step generates a commentary for the video at all the pivotal moments in the video.'
				/>

				<StepTransition
					data={commentary as TimestampTextList}
					jsonEditorTitle='Edit Commentary Data'
					onUpdate={updateCommentary}
				/>

				<StepCard
					title='Audio'
					content={
						<Suspense fallback={<CardSkeleton />}>
							<GeneratePost
								dataType='audio'
								data={commentary as TimestampTextList}
								mutate={(newData: TimestampTextList | FileResponse) =>
									updateAudio(newData as FileResponse)
								}
								options={audioOptions}
								generateFunction={audioGenerateFunction}
							/>
						</Suspense>
					}
					info='This step generates audio files for the commentary at all pivotal moments in the video.'
				/>

				<StepTransition data={null} jsonEditorTitle={null} onUpdate={null} />

				<StepCard
					title='Video'
					content={
						<Suspense fallback={<CardSkeleton />}>
							<GenerateVideo
								audioData={audioFiles as FileResponse}
								commentaryData={commentary as TimestampTextList}
								generateFunction={videoGenerateFunction}
								options={videoOptions}
								mutate={updateVideo}
							/>
						</Suspense>
					}
					info='This step generates the final video with the specified options.'
				/>

				<StepTransition data={null} jsonEditorTitle={null} onUpdate={null} />

				<StepCard
					title='Files'
					content={
						<Suspense fallback={<CardSkeleton />}>
							<FileDownloader
								files={audioFiles as FileResponse}
								videoFile={videoFile as string}
							/>
						</Suspense>
					}
					info='This step downloads the files generated in the previous steps.'
				/>
			</div>

			<div>
				<p className='text-sm text-gray-500'>
					This app uses Gemini 1.5 Pro to generate a description of the provided
					video. The description is then used to create a commentary at all
					pivotal moments in the video with GPT 4o mini. This commentary is sent
					to Elevenlabs and made into audio files
				</p>
			</div>
		</main>
	);
}
