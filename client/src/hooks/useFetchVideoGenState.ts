import { fetchVideoGenState } from '@/api/apiHelper';
import { useEffect, useState } from 'react';
import { VideoGenState } from '@/lib/schema';

export const useFetchVideoGenState = (id: string) => {
	const [data, setData] = useState<VideoGenState | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const data = await fetchVideoGenState(id);
				setData(data);
			} catch (error) {
				setError(error as string);
			}
			setIsLoading(false);
		};
		fetchData();
	}, [id]);

	return { data, isLoading, error };
};
