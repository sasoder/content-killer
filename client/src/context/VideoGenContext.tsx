import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { TimestampTextList, VideoOptions, VideoMetadata } from '@shared/types/api/schema';
import { generateVideo } from '@/api/apiHelper';
import { useFetchVideoGenState } from '@/hooks/useFetchVideoGenState';

type VideoGenStateContext = {
	id: string;
	metadata: VideoMetadata | null;
	description: TimestampTextList | null;
	commentary: TimestampTextList | null;
	audioIds: string[] | null;
	videoId: string | null;
	generateVideoFile: (options: VideoOptions) => Promise<void>;
	updateDescription: (data: TimestampTextList) => void;
	updateCommentary: (data: TimestampTextList) => void;
	updateAudioIds: (data: string[]) => void;
	updateVideoId: (data: string) => void;
	updateMetadata: (data: VideoMetadata) => void;
	error: string | null;
	isLoading: boolean;
};

const VideoGenContext = createContext<VideoGenStateContext | undefined>(undefined);

export const VideoGenProvider = ({ children, id }: { children: ReactNode; id: string }) => {
	const { data, isLoading, error } = useFetchVideoGenState(id);
	const [description, setDescription] = useState<TimestampTextList | null>(null);
	const [commentary, setCommentary] = useState<TimestampTextList | null>(null);
	const [audioIds, setAudioIds] = useState<string[] | null>(null);
	const [videoId, setVideoId] = useState<string>('');
	const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
	const updateDescription = (data: TimestampTextList) => setDescription(data);
	const updateCommentary = (data: TimestampTextList) => setCommentary(data);
	const updateAudioIds = (data: string[]) => setAudioIds(data);
	const updateVideoId = (data: string) => setVideoId(data);
	const updateMetadata = (data: VideoMetadata) => setMetadata(data);

	useEffect(() => {
		if (data && !isLoading && !error) {
			setDescription(data.description);
			setCommentary(data.commentary);
			setAudioIds(data.audioIds);
			setVideoId(data.videoId);
			setMetadata(data.metadata);
		}
	}, [data, isLoading, error]);

	const generateVideoFile = async (options: VideoOptions) => {
		try {
			const { videoId, audioFiles } = await generateVideo(id, commentary!, options);
			console.log(videoId, audioFiles);
			setVideoId(videoId);
			setAudioIds(audioIds);
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
				audioIds,
				videoId,
				updateDescription,
				updateCommentary,
				updateAudioIds,
				updateVideoId,
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
