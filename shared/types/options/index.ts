export type DescriptionOptions = {
	temperature: number;
};

export type CommentaryOptions = {
	intro: boolean;
	outro: boolean;
	temperature: number;
	videoType: 'police' | 'sports' | 'interrogation' | 'poker';
};

export type Voice = {
	id: string;
	name: string;
	previewUrl?: string;
};

export type VideoOptions = {
	audio: {
		stability: number;
		voiceId: string;
	};
	video: {
		bw: boolean;
		playSound: boolean;
		subtitlesEnabled: boolean;
		subtitlesSize: number;
		size: '720p' | '1080p' | '4k' | 'source';
	};
};
