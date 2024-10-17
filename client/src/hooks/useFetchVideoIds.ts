import { useState, useEffect } from 'react';
import { fetchVideoIds } from '@/api/apiHelper';

export const useFetchVideoIds = (): { data: string[]; isLoading: boolean } => {
	const [data, setData] = useState<string[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(true);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const ids = await fetchVideoIds();
				setData(ids);
			} catch (error) {
				console.error(error);
			} finally {
				setIsLoading(false);
			}
		};
		fetchData();
	}, []);

	return { data, isLoading };
};
