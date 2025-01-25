import { Voice } from '../common';

export type DescriptionOptions = {
	temperature: number;
};

export type CommentaryOptions = {
	intro: boolean;
	outro: boolean;
	temperature: number;
	videoType: 'police bodycam' | 'sports' | 'interrogation' | 'poker';
};

export type VideoOptions = {
	audio: {
		stability: number;
		voiceId: string;
		speedMultiplier: number;
	};
	video: {
		bw: boolean;
		playSound: boolean;
		subtitlesEnabled: boolean;
		subtitlesSize: number;
		size: '720p' | '1080p' | '4k' | 'source';
	};
};

export type { Voice };
