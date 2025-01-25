export function generateProjectId(): string {
	return new Date().toISOString().replace(/[-:TZ.]/g, '');
}

export const formatDuration = (durationInSeconds: number): string => {
	const minutes = Math.floor(durationInSeconds / 60);
	const seconds = Math.floor(durationInSeconds % 60);
	return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};
