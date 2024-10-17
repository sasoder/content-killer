import { Option } from '@/lib/types';
import { DescriptionOptions, CommentaryOptions, AudioOptions, VideoOptions } from '@shared/types/options';

type OptionDefinitions<T> = {
	[K in keyof T]: Option;
};

export const descriptionOptionDefinitions: OptionDefinitions<DescriptionOptions> = {
	sample: { type: 'checkbox', label: 'Sample data' },
};

export const commentaryOptionDefinitions: OptionDefinitions<CommentaryOptions> = {
	intro: { type: 'checkbox', label: 'Include intro' },
	outro: { type: 'checkbox', label: 'Include outro' },
	temperature: { type: 'slider', label: 'Temperature', min: 0, max: 2, step: 0.01 },
};

export const audioOptionDefinitions: OptionDefinitions<AudioOptions> = {
	stability: { type: 'slider', label: 'Stability', min: 0, max: 2, step: 0.01 },
};

export const videoOptionDefinitions: OptionDefinitions<VideoOptions> = {
	bw: { type: 'checkbox', label: 'B/w on pause' },
	playSound: { type: 'checkbox', label: 'Play sound' },
	subtitlesEnabled: { type: 'checkbox', label: 'Subtitles' },
	subtitlesSize: { type: 'slider', label: 'Subtitle size', min: 12, max: 48, step: 1 },
};
