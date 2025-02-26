import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from '@/App';
import ProjectPage from '@/pages/Project';
import TemplatePage from '@/pages/Templates';
import SelectProjectPage from '@/pages/SelectProject';
import { ThemeProvider } from '@/components/common/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import '@fontsource/nunito';
import './globals.css';
import { HTTPError } from '@/components/common/HTTPError';

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			refetchOnReconnect: false,
			retry: 3,
		},
	},
});

const router = createBrowserRouter([
	{
		path: '/',
		element: <App />,
	},
	{
		path: '/project/:id',
		element: <ProjectPage />,
	},
	{
		path: '/create',
		element: <SelectProjectPage />,
	},
	{
		path: '/templates',
		element: <TemplatePage />,
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
