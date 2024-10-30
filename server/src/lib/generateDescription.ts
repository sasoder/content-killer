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
			{ timestamp: '00:00', text: `Test description with options: ${JSON.stringify(options)}` },
			{ timestamp: '00:01', text: `Test description with url: ${url}` },
		];
	}

	try {
		await execAsync('python3 -m venv ./python_env');
		await execAsync('./python_env/bin/pip install google-cloud-aiplatform vertexai');

		const pythonProcess = spawn('./python_env/bin/python', [
			path.join(__dirname, 'generate_description.py'),
			url,
			JSON.stringify(options),
		]);

		const { stdout, stderr } = await new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
			let stdout = '';
			let stderr = '';

			pythonProcess.stdout.on('data', data => (stdout += data));
			pythonProcess.stderr.on('data', data => (stderr += data));
			pythonProcess.on('close', code => {
				if (code === 0) resolve({ stdout, stderr });
				else reject(new Error(stderr));
			});
		});

		const results = z.array(TimestampTextSchema).parse(JSON.parse(stdout));
		return results;
	} catch (error) {
		console.error('Failed to generate description:', error);
		return [];
	}
};
