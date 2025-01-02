import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { VideoGenState, TimestampText, VideoMetadata, AudioGenStatus, VideoGenStatus } from '@shared/types/api/schema';
import { DescriptionOptions, CommentaryOptions, VideoOptions } from '@shared/types/options';
import {
	defaultCommentaryOptions,
	defaultDescriptionOptions,
	defaultVideoOptions,
} from '@shared/types/options/defaultOptions';
import { useQuery } from '@tanstack/react-query';
import { fetchVideoGenState } from '@/api/apiHelper';

interface VideoGenStateContext {
	id: string;
	metadata: VideoMetadata | null;
	description: TimestampText[];
	commentary: TimestampText[];
	audioStatus: AudioGenStatus;
	videoStatus: VideoGenStatus;
	updateDescription: (data: TimestampText[]) => void;
	updateCommentary: (data: TimestampText[]) => void;
	updateAudioStatus: (data: AudioGenStatus) => void;
	updateVideoStatus: (data: VideoGenStatus) => void;
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
	const { data, isLoading, error } = useQuery({
		queryKey: ['videoGenState', id],
		queryFn: () => fetchVideoGenState(id),
	});
	const [description, setDescription] = useState<TimestampText[]>([]);
	const [commentary, setCommentary] = useState<TimestampText[]>([]);
	const [audioStatus, setAudioStatus] = useState<AudioGenStatus>('idle');
	const [videoStatus, setVideoStatus] = useState<VideoGenStatus>('idle');
	const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
	const [options, setOptions] = useState({
		description: defaultDescriptionOptions,
		commentary: defaultCommentaryOptions,
		video: defaultVideoOptions,
	});
	const updateDescription = (data: TimestampText[]) => setDescription(data);
	const updateCommentary = (data: TimestampText[]) => setCommentary(data);
	const updateAudioStatus = (data: AudioGenStatus) => setAudioStatus(data);
	const updateVideoStatus = (data: VideoGenStatus) => setVideoStatus(data);
	const updateMetadata = (data: VideoMetadata) => setMetadata(data);

	useEffect(() => {
		if (data && !isLoading && !error) {
			setDescription(data.description);
			setCommentary(data.commentary);
			setAudioStatus(data.audioStatus);
			setVideoStatus(data.videoStatus);
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
				audioStatus,
				videoStatus,
				updateDescription,
				updateCommentary,
				updateAudioStatus,
				updateVideoStatus,
				updateMetadata,
				options,
				error: error ? error.message : null,
				isLoading: isLoading,
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
