import { Option } from '@/lib/types';
import * as defaultOptions from '@/lib/options/defaultOptions';

type OptionDefinitions<T> = {
	[K in keyof T]: Option;
};

export const descriptionOptionDefinitions: OptionDefinitions<typeof defaultOptions.defaultDescriptionOptions> = {
	sample: { type: 'checkbox', label: 'Sample data' },
};

export const commentaryOptionDefinitions: OptionDefinitions<typeof defaultOptions.defaultCommentaryOptions> = {
	intro: { type: 'checkbox', label: 'Include intro' },
	outro: { type: 'checkbox', label: 'Include outro' },
	temperature: { type: 'slider', label: 'Temperature', min: 0, max: 2, step: 0.01 },
};

export const audioOptionDefinitions: OptionDefinitions<typeof defaultOptions.defaultAudioOptions> = {
	stability: { type: 'slider', label: 'Stability', min: 0, max: 2, step: 0.01 },
};

export const videoOptionDefinitions: OptionDefinitions<typeof defaultOptions.defaultVideoOptions> = {
	bw: { type: 'checkbox', label: 'B/w on pause' },
	playSound: { type: 'checkbox', label: 'Play sound' },
	subtitlesEnabled: { type: 'checkbox', label: 'Subtitles' },
	subtitlesSize: { type: 'slider', label: 'Subtitle size', min: 12, max: 48, step: 1 },
};
