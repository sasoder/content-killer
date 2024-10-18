import { fetchVideoGenState } from '@/api/apiHelper';
import { useEffect, useState } from 'react';
import { VideoGenState } from '@shared/types/api/schema';

export const useFetchVideoGenState = (id: string) => {
	const [data, setData] = useState<VideoGenState | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const fetchedData = await fetchVideoGenState(id);
				setData(fetchedData);
				console.log('fetchedData', fetchedData);
				setError(null);
			} catch (error: any) {
				if (error.response?.status === 404) {
					setError('Video generation state not found');
				} else {
					setError(error.message || 'Error fetching VideoGenState');
				}
				setData(null);
			} finally {
				setIsLoading(false);
			}
		};
		fetchData();
	}, [id]);

	return { data, isLoading, error };
};
