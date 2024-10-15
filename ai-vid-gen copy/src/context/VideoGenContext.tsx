import React, { createContext, useContext, useState, ReactNode } from 'react';
import { TimestampTextList, VideoOptions, VideoMetadata } from '@/lib/schema';
import { generateVideo } from '@/api/apiHelper';

type VideoGenState = {
	id: string;
	metadata: VideoMetadata | null;
	description: TimestampTextList | null;
	commentary: TimestampTextList | null;
	audioFiles: string[] | null;
	videoFile: string;
	isLoading: boolean;
	updateDescription: (data: TimestampTextList) => void;
	updateCommentary: (data: TimestampTextList) => void;
	updateAudioFiles: (data: string[]) => void;
	updateVideoFile: (data: string) => void;
	generateVideoFile: (options: VideoOptions) => Promise<void>;
	updateMetadata: (data: VideoMetadata) => void;
};

const VideoGenContext = createContext<VideoGenState | undefined>(undefined);

export const VideoGenProvider = ({ children }: { children: ReactNode }) => {
	const [id, setId] = useState<string>(new Date().toISOString());
	const [description, setDescription] = useState<TimestampTextList | null>(null);
	const [commentary, setCommentary] = useState<TimestampTextList | null>(null);
	const [audioFiles, setAudioFiles] = useState<string[] | null>(null);
	const [videoFile, setVideoFile] = useState<string>('');
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
	const updateDescription = (data: TimestampTextList) => setDescription(data);
	const updateCommentary = (data: TimestampTextList) => setCommentary(data);
	const updateAudioFiles = (data: string[]) => setAudioFiles(data);
	const updateVideoFile = (data: string) => setVideoFile(data);
	const updateMetadata = (data: VideoMetadata) => setMetadata(data);

	const generateVideoFile = async (options: VideoOptions) => {
		try {
			setIsLoading(true);
			const video = await generateVideo(commentary, audioFiles, options);
			setVideoFile(video);
		} catch (error) {
			console.error('Error generating video:', error);
		} finally {
			setIsLoading(false);
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
				isLoading,
				updateDescription,
				updateCommentary,
				updateAudioFiles,
				updateVideoFile,
				generateVideoFile,
				updateMetadata,
			}}
		>
			{children}
		</VideoGenContext.Provider>
	);
};

export const useVideoGen = (): VideoGenState => {
	const context = useContext(VideoGenContext);
	if (!context) {
		throw new Error('useVideoGen must be used within a VideoGenProvider');
	}
	return context;
};
