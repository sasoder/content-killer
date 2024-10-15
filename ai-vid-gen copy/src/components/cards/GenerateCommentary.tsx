import React from 'react';
import { useVideoGen } from '@/context/VideoGenContext';
import { Button } from '@/components/ui/button';
import { TimestampTextList } from '@/lib/schema';
import { generateCommentary } from '@/api/apiHelper';

const GenerateCommentary = () => {
	const { description, isLoading, updateCommentary } = useVideoGen();

	const handleGenerate = async () => {
		const generatedCommentary: TimestampTextList = await generateCommentary(description);
		updateCommentary(generatedCommentary);
	};

	return (
		<div>
			<Button onClick={handleGenerate} disabled={isLoading}>
				Generate Commentary
			</Button>
		</div>
	);
};

export default GenerateCommentary;
