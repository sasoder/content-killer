import { useEffect, useState } from 'react';
import { Voice } from '@shared/types/options';
import { hc } from 'hono/client';
import { AppType } from '@shared/server/index';

const client = hc<AppType>(import.meta.env.VITE_APP_HONO_API_URL);

export const useFetchVoices = () => {
	const [voices, setVoices] = useState<Voice[]>([]);
	const [error, setError] = useState<Error | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchVoices = async () => {
			try {
				const res = await fetch(`${import.meta.env.VITE_APP_HONO_API_URL}/api/fetch/voices`);
				if (!res.ok) {
					throw new Error('Failed to fetch voices');
				}
				const data = await res.json();
				setVoices(data as Voice[]);
			} catch (err) {
				setError(err instanceof Error ? err : new Error('Failed to fetch voices'));
			} finally {
				setIsLoading(false);
			}
		};

		fetchVoices();
	}, []);

	return {
		voices,
		error,
		isLoading,
	};
}; 