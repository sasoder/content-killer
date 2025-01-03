import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/mode-toggle';
import { Icons } from '@/components/icons';

interface HeaderProps {
	title?: string;
	showBackButton?: boolean;
	backTo?: string;
	paddingTop?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ title, showBackButton = false, backTo, paddingTop = true }) => {
	const navigate = useNavigate();

	const handleBack = () => {
		if (backTo) {
			navigate(backTo);
		} else {
			navigate(-1);
		}
	};

	return (
		<div className={`relative flex flex-row items-center justify-center gap-4 ${paddingTop ? 'py-4' : ''}`}>
			<div className='absolute left-0 top-0 m-4'>
				{showBackButton && (
					<Button variant='ghost' size='icon' onClick={handleBack}>
						<Icons.chevronLeft className='h-[1.5rem] w-[1.5rem] -translate-x-[0.045rem]' />
					</Button>
				)}
			</div>
			<div className='absolute right-0 top-0 m-4'>
				<ModeToggle />
			</div>
			{title && <h1 className='text-foreground flex items-center justify-center pt-2 text-2xl'>{title}</h1>}
		</div>
	);
};
