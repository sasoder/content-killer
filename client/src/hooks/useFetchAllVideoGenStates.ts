import { useState, useEffect } from 'react';
import { fetchAllVideoGenStates } from '@/api/apiHelper';
import { VideoGenState } from '@shared/types/api/schema';

export const useFetchAllVideoGenStates = (): { data: VideoGenState[]; isLoading: boolean } => {
	const [data, setData] = useState<VideoGenState[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(true);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const projects = await fetchAllVideoGenStates();
				setData(projects);
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
