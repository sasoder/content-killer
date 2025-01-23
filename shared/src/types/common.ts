export type Voice = {
	id: string;
	name: string;
	previewUrl?: string;
};

export type TimestampText = {
	timestamp: string;
	text: string;
};

export type Metadata = {
	url?: string;
	title?: string;
	duration?: number;
	createdAt: string;
}; 