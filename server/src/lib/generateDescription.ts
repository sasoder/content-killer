import { DescriptionOptions } from '@shared/types/options';
import { spawn } from 'child_process';
import { exec } from 'child_process';
import { promisify } from 'util';
import { TimestampText } from '@shared/types/api/schema';
import { z } from 'zod';
import path from 'path';

const TimestampTextSchema = z.object({
	timestamp: z.string(),
	text: z.string(),
});

const execAsync = promisify(exec);

export const generateDescription = async (url: string, options: DescriptionOptions): Promise<TimestampText[]> => {
	if (options.sample) {
		return [
			{
				timestamp: '00:00',
				text: 'This is a test description, you have the options: ' + JSON.stringify(options),
			},
			{
				timestamp: '00:01',
				text: 'This is a test description, you have the url: ' + url,
			},
		];
	}

	try {
		// Ensure Python environment exists and has required packages
		console.log('Ensuring Python environment exists and has required packages');
		await execAsync('python3 -m venv ./python_env');
		console.log('Installing required packages');
		await execAsync(`./python_env/bin/pip install google-cloud-aiplatform vertexai`);
		console.log('Python environment and packages installed');

		return new Promise((resolve, reject) => {
			const pythonProcess = spawn('./python_env/bin/python', [
				path.join(__dirname, 'generate_description.py'),
				url,
				JSON.stringify(options),
			]);

			let outputData = '';
			let errorData = '';

			pythonProcess.stdout.on('data', data => {
				outputData += data.toString();
			});

			pythonProcess.stderr.on('data', data => {
				errorData += data.toString();
				console.error('Python error:', data.toString());
			});

			pythonProcess.on('close', code => {
				if (code === 0) {
					try {
						const results = JSON.parse(outputData) as TimestampText[];
						resolve(results);
					} catch (error) {
						reject(new Error(`Failed to parse Python output: ${error.message}`));
					}
				} else {
					reject(new Error(`Python script failed with code ${code}: ${errorData}`));
				}
			});
		});
	} catch (error) {
		console.error('Failed to generate description:', error);
		return [];
	}
};
