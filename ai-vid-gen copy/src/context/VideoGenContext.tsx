import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { TimestampTextList, VideoOptions, VideoMetadata } from '@/lib/schema';
import { generateVideo } from '@/api/apiHelper';
import { useFetchVideoGenState } from '@/hooks/useFetchVideoGenState';

type VideoGenStateContext = {
	id: string;
	metadata: VideoMetadata | null;
	description: TimestampTextList | null;
	commentary: TimestampTextList | null;
	audioFiles: string[] | null;
	videoFile: string;
	generateVideoFile: (options: VideoOptions) => Promise<void>;
	updateDescription: (data: TimestampTextList) => void;
	updateCommentary: (data: TimestampTextList) => void;
	updateAudioFiles: (data: string[]) => void;
	updateVideoFile: (data: string) => void;
	updateMetadata: (data: VideoMetadata) => void;
	error: string | null;
	isLoading: boolean;
};

const VideoGenContext = createContext<VideoGenStateContext | undefined>(undefined);

export const VideoGenProvider = ({ children, id, isNew }: { children: ReactNode; id: string; isNew: boolean }) => {
	const { data, isLoading, error } = useFetchVideoGenState(id, isNew);
	const [description, setDescription] = useState<TimestampTextList | null>(null);
	const [commentary, setCommentary] = useState<TimestampTextList | null>(null);
	const [audioFiles, setAudioFiles] = useState<string[] | null>(null);
	const [videoFile, setVideoFile] = useState<string>('');
	const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
	const updateDescription = (data: TimestampTextList) => setDescription(data);
	const updateCommentary = (data: TimestampTextList) => setCommentary(data);
	const updateAudioFiles = (data: string[]) => setAudioFiles(data);
	const updateVideoFile = (data: string) => setVideoFile(data);
	const updateMetadata = (data: VideoMetadata) => setMetadata(data);

	useEffect(() => {
		if (data && !isLoading && !error) {
			setDescription(data.description);
			setCommentary(data.commentary);
			setAudioFiles(data.audioFiles);
			setVideoFile(data.videoFile);
			setMetadata(data.metadata);
		}
	}, [data, isLoading, error]);

	const generateVideoFile = async (options: VideoOptions) => {
		try {
			const video = await generateVideo(commentary, audioFiles, options);
			setVideoFile(video);
		} catch (error) {
			console.error('Error generating video:', error);
		}
	};

	return (
		<VideoGenContext.Provider
			value={{
				id,
				metadata,
				description,
				commentary,
				audioFiles,
				videoFile,
				updateDescription,
				updateCommentary,
				updateAudioFiles,
				updateVideoFile,
				generateVideoFile,
				updateMetadata,
				error,
				isLoading,
			}}
		>
			{children}
		</VideoGenContext.Provider>
	);
};

export const useVideoGen = (): VideoGenStateContext => {
	const context = useContext(VideoGenContext);
	if (!context) {
		throw new Error('useVideoGen must be used within a VideoGenProvider');
	}
	return context;
};
