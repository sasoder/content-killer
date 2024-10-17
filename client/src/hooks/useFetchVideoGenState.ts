import { fetchVideoGenState, createVideoGenState } from '@/api/apiHelper';
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
			} catch (error: any) {
				if (error.response?.status === 404) {
					// If not found, create a new VideoGenState
					try {
						const createdData = await createVideoGenState(id);
						setData(createdData);
					} catch (createError: any) {
						setError(createError.message || 'Error creating VideoGenState');
					}
				} else {
					setError(error.message || 'Error fetching VideoGenState');
				}
			}
			setIsLoading(false);
		};
		fetchData();
	}, [id]);

	return { data, isLoading, error };
};
