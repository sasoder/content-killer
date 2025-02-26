import { TimestampText } from '@content-killer/shared';

interface QuickInfoProps {
	data: TimestampText[];
	type: string;
}

export default function QuickInfo({ data, type }: QuickInfoProps) {
	if (!data || data.length === 0) {
		return <p className='text-sm text-gray-500'>No data to display. Generate it first.</p>;
	}
	const listLength = data.length;
	const totalWords = data.reduce((total, item) => total + item.text.split(' ').length, 0);

	return (
		<div className='h-full overflow-auto'>
			<p className='mt-2 text-sm text-gray-500'>
				You have {listLength} {type} {listLength === 1 ? 'entry' : 'entries'} consisting of {totalWords}{' '}
				{totalWords === 1 ? 'word' : 'words'}.
			</p>
		</div>
	);
}
