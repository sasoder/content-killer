export function generateProjectId(): string {
	return new Date().toISOString().replace(/[-:TZ.]/g, '');
}
