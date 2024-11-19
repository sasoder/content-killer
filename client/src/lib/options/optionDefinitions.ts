import { Option } from '@/lib/types';
import { DescriptionOptions, CommentaryOptions, VideoOptions } from '@shared/types/options';

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

export const videoOptionDefinitions = {
	video: {
		bw: { type: 'checkbox', label: 'B/w on pause' } as Option,
		playSound: { type: 'checkbox', label: 'Play sound' } as Option,
		subtitlesEnabled: { type: 'checkbox', label: 'Subtitles' } as Option,
		subtitlesSize: { type: 'slider', label: 'Subtitle size', min: 12, max: 48, step: 1 } as Option,
	},
	audio: {
		stability: { type: 'slider', label: 'Stability', min: 0, max: 2, step: 0.01 } as Option,
		// voiceId: { type: 'text', label: 'Voice ID' } as Option,
	},
} satisfies {
	video: OptionDefinitions<VideoOptions['video']>;
	audio: OptionDefinitions<VideoOptions['audio']>;
};
