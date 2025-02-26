import { Icons } from '@/components/common/icons';
import JsonEditor from '@/components/common/JsonEditor';
import { TimestampText } from '@content-killer/shared';

type StepTransitionProps = {
	data: TimestampText[];
	jsonEditorTitle: string;
	onUpdate: (data: TimestampText[]) => void;
};

export default function StepTransition({ data, jsonEditorTitle, onUpdate }: StepTransitionProps) {
	return (
		<div className='flex flex-col items-center justify-center'>
			<Icons.moveRight className='h-8 w-8' strokeWidth={1.3} color='gray' />
			<div className='absolute pt-24'>
				{data && data.length > 0 && <JsonEditor title={jsonEditorTitle} data={data} onUpdate={onUpdate} />}
			</div>
		</div>
	);
}
