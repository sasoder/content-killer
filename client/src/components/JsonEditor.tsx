import { useState, useEffect, FormEvent, KeyboardEvent } from 'react';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { TimestampText } from '@content-killer/shared';
import { Icons } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';

interface JsonEditorProps {
	data: TimestampText[];
	onUpdate: (updatedData: TimestampText[]) => void;
	title: string;
}

export default function JsonEditor({ data, onUpdate, title }: JsonEditorProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [newRow, setNewRow] = useState<TimestampText>({
		timestamp: '',
		text: '',
	});
	const { toast } = useToast();
	const [editedData, setEditedData] = useState(data);

	useEffect(() => {
		setEditedData(data);
	}, [data]);

	const validateTimestamp = (timestamp: string): boolean => {
		const regex = /^(\d|[0-5]\d):([0-5]\d)$/;
		return regex.test(timestamp);
	};

	const handleInputChange = (rowIndex: number, key: keyof TimestampText, value: string) => {
		const newData = [...(editedData ?? [])];
		newData[rowIndex] = { ...newData[rowIndex], [key]: value };
		setEditedData(newData);
	};

	const handleNewRowInputChange = (key: keyof TimestampText, value: string) => {
		setNewRow({ ...newRow, [key]: value });
	};

	const handleSave = (remainOpen: boolean = false, newData: TimestampText[] | null = editedData) => {
		const invalidTimestamps = newData?.filter(item => !validateTimestamp(item.timestamp)) ?? [];
		if (invalidTimestamps.length > 0) {
			toast({
				title: 'Invalid Timestamps',
				description: 'Please correct all timestamps before saving.',
				variant: 'destructive',
			});
			return;
		}
		onUpdate(newData ?? []);
		setIsOpen(remainOpen);
	};

	const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleAdd();
		}
	};

	const handleDelete = (rowIndex: number) => {
		const newData = [...(editedData ?? [])];
		const filteredData = newData.filter((_, index) => index !== rowIndex);
		setEditedData(filteredData);
	};

	const handleAdd = () => {
		if (newRow.timestamp === '' && newRow.text === '') {
			return;
		}
		if (newRow.timestamp === '' || newRow.text === '') {
			toast({
				title: 'Incomplete Data',
				description: 'Please fill in both timestamp and text fields before adding a new row.',
				variant: 'destructive',
			});
			return;
		}

		if (!validateTimestamp(newRow.timestamp)) {
			toast({
				title: 'Invalid Timestamp',
				description: 'Please use the format mm:ss (e.g., 05:30)',
				variant: 'destructive',
			});
			return;
		}

		const newData = [...(editedData ?? [])];
		const insertIndex = newData.findIndex(item => item.timestamp > newRow.timestamp);

		if (insertIndex === -1) {
			newData.push({ ...newRow });
		} else {
			newData.splice(insertIndex, 0, { ...newRow });
		}

		handleSave(true, newData);
		setNewRow({ timestamp: '', text: '' });
	};

	const columns: (keyof TimestampText)[] = ['timestamp', 'text'];

	const handleSubmitNewRow = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		handleAdd();
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogDescription />
			{editedData && editedData.length > 0 ? (
				<DialogTrigger asChild>
					<Button variant='outline' size='icon'>
						<Icons.pencil className='h-[1.1rem] w-[1.1rem]' />
					</Button>
				</DialogTrigger>
			) : (
				<Button variant='outline' size='icon' disabled>
					<Icons.pencil className='h-[1.1rem] w-[1.1rem]' />
				</Button>
			)}
			<DialogContent className='flex max-h-[90vh] max-w-[70vw] flex-col p-0'>
				<DialogHeader className='bg-background sticky top-0 z-10 border-b'>
					<div className='flex flex-col'>
						<div className='flex flex-row items-center justify-between p-6'>
							<DialogTitle>{title}</DialogTitle>
							<Button onClick={() => handleSave(false)}>Save Changes</Button>
						</div>
						<Table>
							<TableHeader>
								<TableRow className='border-none hover:bg-transparent'>
									{columns.map(column => (
										<TableHead className={`px-4 ${column === 'timestamp' ? 'w-12' : 'w-full'}`} key={column}>
											{column}
										</TableHead>
									))}
								</TableRow>
							</TableHeader>
						</Table>
					</div>
				</DialogHeader>
				<div className='flex-grow overflow-auto p-4 pb-8'>
					<form onSubmit={handleSubmitNewRow}>
						<Table>
							<TableBody>
								{/* Add Row */}
								<TableRow className='border-none hover:bg-transparent'>
									{columns?.map(column => (
										<TableCell className={column === 'timestamp' ? 'w-16' : 'w-full'} key={`new-${column}`}>
											<Textarea
												value={newRow[column]}
												onKeyDown={handleKeyDown}
												onChange={e => handleNewRowInputChange(column, e.target.value)}
												placeholder={column === 'timestamp' ? 'mm:ss' : `New ${column}`}
												className={
													column === 'timestamp'
														? 'min-h-[2rem] w-16 resize-none px-0 text-center'
														: 'h-20 w-full resize-none'
												}
												rows={1}
											/>
										</TableCell>
									))}
									{/* Actions Cell for Add Row */}
									<TableCell className='w-20'>
										<Button type='submit' variant='ghost' size='icon' onClick={handleAdd}>
											<Icons.plus className='h-4 w-4' />
										</Button>
									</TableCell>
								</TableRow>

								{/* Existing Data Rows */}
								{editedData?.map((row, rowIndex) => (
									<TableRow className='border-none hover:bg-transparent' key={rowIndex}>
										{columns?.map(column => (
											<TableCell className={column === 'timestamp' ? 'w-16' : 'w-full'} key={`${rowIndex}-${column}`}>
												<Textarea
													value={row[column]}
													onChange={e => handleInputChange(rowIndex, column, e.target.value)}
													onKeyDown={handleKeyDown}
													className={
														column === 'timestamp'
															? 'min-h-[2rem] w-16 resize-none px-0 text-center'
															: 'h-20 w-full resize-none'
													}
													rows={1}
												/>
											</TableCell>
										))}
										<TableCell className='w-20'>
											<Button variant='ghost' size='icon' onClick={() => handleDelete(rowIndex)}>
												<Icons.minus className='h-4 w-4' />
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</form>
				</div>
			</DialogContent>
		</Dialog>
	);
}
