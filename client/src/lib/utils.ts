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

export function formatDate(isoString: string): string {
	const date = new Date(isoString);
	const options = { day: 'numeric', month: 'short' } as const;
	const datePart = date.toLocaleDateString('en-US', options); // Format date as '9 Oct'
	const hours = date.getHours();
	const minutes = date.getMinutes();
	const ampm = hours >= 12 ? 'PM' : 'AM';
	const formattedHours = hours % 12 || 12; // Convert to 12-hour format
	const formattedMinutes = String(minutes).padStart(2, '0'); // Ensure two digits
	return `${datePart} ${formattedHours}:${formattedMinutes} ${ampm}`;
}

export function getApiBaseUrl(): string {
	return import.meta.env.VITE_APP_API_BASE ?? 'http://localhost:3000/api';
}
