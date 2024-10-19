import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from '@/App.tsx';
import Generate from '@/pages/Generate.tsx';
import New from '@/pages/New';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import '@fontsource/nunito';
import './index.css';
import { HTTPError } from '@/components/HTTPError';

const router = createBrowserRouter([
	{
		path: '/',
		element: <App />,
	},
	{
		path: '/generate/:id',
		element: <Generate />,
	},
	{
		path: '/new',
		element: <New />,
	},
	{
		path: '*',
		element: <HTTPError error='404: Not found' />,
	},
]);

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<ThemeProvider defaultTheme='dark' storageKey='vite-ui-theme'>
			<RouterProvider router={router} />
			<Toaster />
		</ThemeProvider>
	</StrictMode>,
);
