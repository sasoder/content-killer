import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function generateProjectId(): string {
	return new Date().toISOString().replace(/[-:TZ.]/g, '');
}

export function validateUrl(input: string): boolean {
	try {
		new URL(input);
		return true;
	} catch {
		return false;
	}
}
