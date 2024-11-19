export type DescriptionOptions = {
	sample: boolean;
};

export type CommentaryOptions = {
	intro: boolean;
	outro: boolean;
	temperature: number;
};

export type VideoOptions = {
	audio: {
		stability: number;
		// voiceId: string;
	};
	video: {
		bw: boolean;
		playSound: boolean;
		subtitlesEnabled: boolean;
		subtitlesSize: number;
	};
};
