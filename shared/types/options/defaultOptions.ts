import { DescriptionOptions, CommentaryOptions, AudioOptions, VideoOptions } from './';

export const defaultDescriptionOptions: DescriptionOptions = {
	sample: true,
};

export const defaultCommentaryOptions: CommentaryOptions = {
	intro: true,
	outro: true,
	temperature: 0.7,
};

export const defaultAudioOptions: AudioOptions = {
	stability: 0.7,
};

export const defaultVideoOptions: VideoOptions = {
	bw: true,
	playSound: true,
	subtitlesEnabled: true,
	subtitlesSize: 14,
};
