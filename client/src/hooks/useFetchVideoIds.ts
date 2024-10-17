import { useState, useEffect } from 'react';
import { fetchVideoIds } from '@/api/apiHelper';

export const useFetchVideoIds = (): { data: string[]; isLoading: boolean; error: string } => {
	const [data, setData] = useState<string[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [error, setError] = useState<string>('');

	useEffect(() => {
		const fetchData = async () => {
			try {
				const ids = await fetchVideoIds();
				setData(ids);
			} catch (error) {
				setError(error as string);
			} finally {
				setIsLoading(false);
			}
		};
		fetchData();
	}, []);

	return { data, isLoading, error };
};
