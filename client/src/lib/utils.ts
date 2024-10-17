import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function validateUrl(input: string): boolean {
	try {
		new URL(input);
		return true;
	} catch {
		return false;
	}
}
