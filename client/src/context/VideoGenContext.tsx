import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { VideoGenState, TimestampText, VideoMetadata } from '@shared/types/api/schema';
import { useFetchVideoGenState } from '@/hooks/useFetchVideoGenState';
import { DescriptionOptions, CommentaryOptions, VideoOptions } from '@shared/types/options';
import {
	defaultCommentaryOptions,
	defaultDescriptionOptions,
	defaultVideoOptions,
} from '@shared/types/options/defaultOptions';

interface VideoGenStateContext {
	id: string;
	metadata: VideoMetadata | null;
	description: TimestampText[];
	commentary: TimestampText[];
	audioIds: string[];
	videoId: string | null;
	updateDescription: (data: TimestampText[]) => void;
	updateCommentary: (data: TimestampText[]) => void;
	updateAudioIds: (data: string[]) => void;
	updateVideoId: (data: string) => void;
	updateMetadata: (data: VideoMetadata) => void;
	options: {
		description: DescriptionOptions;
		commentary: CommentaryOptions;
		video: VideoOptions;
	};
	error: string | null;
	isLoading: boolean;
}

const VideoGenContext = createContext<VideoGenStateContext | undefined>(undefined);

export const VideoGenProvider = ({ children, id }: { children: ReactNode; id: string }) => {
	const { data, isLoading, error } = useFetchVideoGenState(id);
	const [description, setDescription] = useState<TimestampText[]>([]);
	const [commentary, setCommentary] = useState<TimestampText[]>([]);
	const [audioIds, setAudioIds] = useState<string[]>([]);
	const [videoId, setVideoId] = useState<string | null>(null);
	const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
	const [options, setOptions] = useState({
		description: defaultDescriptionOptions,
		commentary: defaultCommentaryOptions,
		video: defaultVideoOptions,
	});
	const updateDescription = (data: TimestampText[]) => setDescription(data);
	const updateCommentary = (data: TimestampText[]) => setCommentary(data);
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
			setOptions(data.options);
		}
	}, [data, isLoading, error]);

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
				updateMetadata,
				options,
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
