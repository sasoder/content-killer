import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from '@/App.tsx';
import Generate from '@/pages/Generate.tsx';
import New from '@/pages/New';
import Options from '@/pages/options';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import '@fontsource/nunito';
import './index.css';
import { HTTPError } from '@/components/HTTPError';

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 5000,
			refetchOnWindowFocus: true,
		},
	},
});

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
		path: '/options',
		element: <Options />,
	},
	{
		path: '*',
		element: <HTTPError error='404: Not found' />,
	},
]);

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<QueryClientProvider client={queryClient}>
			<ThemeProvider defaultTheme='dark' storageKey='vite-ui-theme'>
				<RouterProvider router={router} />
				<Toaster />
			</ThemeProvider>
		</QueryClientProvider>
	</StrictMode>,
);
