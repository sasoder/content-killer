import { drizzle } from 'drizzle-orm/bun-sqlite';
import { Database } from 'bun:sqlite';
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { eq } from 'drizzle-orm';
import { writeFile, readFile, mkdir } from 'fs/promises';
import * as fs from 'fs';
import * as path from 'path';
import { Project } from '@shared/types/api/schema';
import { Template } from '@shared/types/options/template';
import { defaultTemplate } from '@shared/types/options/defaultTemplates';
import { createDefaultProject } from '@/lib/defaultProject';
import { createWriteStream } from 'fs';
import archiver from 'archiver';

export const DATA_DIR = './data';
export const PROJECTS_DIR = path.join(DATA_DIR, 'projects');
export const TEMPLATES_DIR = path.join(DATA_DIR, 'templates');
export const DB_PATH = path.join(DATA_DIR, 'projects.db');
export const DEFAULT_TEMPLATE_ID = 'default';

if (!fs.existsSync(DATA_DIR)) {
	fs.mkdirSync(DATA_DIR);
}
if (!fs.existsSync(PROJECTS_DIR)) {
	fs.mkdirSync(PROJECTS_DIR);
}
if (!fs.existsSync(TEMPLATES_DIR)) {
	fs.mkdirSync(TEMPLATES_DIR);
}

const sqlite = new Database(DB_PATH);

sqlite.run(`
    CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY NOT NULL,
		template_id TEXT NOT NULL,
        state TEXT NOT NULL
    )
`);

sqlite.run(`
    CREATE TABLE IF NOT EXISTS templates (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        created_at TEXT NOT NULL,
        options TEXT NOT NULL,
        pause_sound_filename TEXT NOT NULL
    )
`);

const projects = sqliteTable('projects', {
	id: text('id').primaryKey(),
	template_id: text('template_id').notNull(),
	state: text('state').notNull(),
});

const templates = sqliteTable('templates', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	description: text('description').notNull(),
	createdAt: text('created_at').notNull(),
	options: text('options').notNull(),
	pauseSoundFilename: text('pause_sound_filename').notNull(),
});

const db = drizzle(sqlite);

export class ProjectStorage {
	private projectsDir: string;
	private templatesDir: string;

	constructor() {
		this.projectsDir = PROJECTS_DIR;
		this.templatesDir = TEMPLATES_DIR;
	}

	async createProject(id: string, template: Template): Promise<Project> {
		const defaultState = createDefaultProject(id, template);
		if (!fs.existsSync(path.join(this.projectsDir, id))) {
			fs.mkdirSync(path.join(this.projectsDir, id));
			fs.mkdirSync(path.join(this.projectsDir, id, 'video'));
			fs.mkdirSync(path.join(this.projectsDir, id, 'audio'));
			fs.mkdirSync(path.join(this.projectsDir, id, 'misc'));
			// copy template pause sound to project
			const templateDir = path.join(this.templatesDir, template.id);
			const pauseSoundPath = path.join(templateDir, template.pauseSoundFilename);
			const projectPauseSoundPath = path.join(this.projectsDir, id, 'misc', template.pauseSoundFilename);
			await fs.promises.copyFile(pauseSoundPath, projectPauseSoundPath);
		}

		await db.insert(projects).values({
			id,
			template_id: template.id,
			state: JSON.stringify(defaultState),
		});

		return defaultState;
	}

	async getProject(id: string): Promise<Project | null> {
		const result = await db.select().from(projects).where(eq(projects.id, id)).limit(1);

		if (!result.length) {
			return null;
		}

		return JSON.parse(result[0].state);
	}

	async getAllProjects(): Promise<Project[]> {
		const results = await db.select().from(projects);
		return results.map(row => JSON.parse(row.state));
	}

	async updateProjectState(state: Project): Promise<void> {
		await db
			.update(projects)
			.set({
				state: JSON.stringify(state),
			})
			.where(eq(projects.id, state.id));
	}

	async saveFile(id: string, fileName: string, content: Buffer): Promise<void> {
		const projectDir = path.join(this.projectsDir, id);
		await mkdir(projectDir, { recursive: true });
		await writeFile(path.join(projectDir, fileName), content);
	}

	async getVideo(id: string): Promise<Buffer> {
		const projectDir = path.join(this.projectsDir, id);
		const videoDir = path.join(projectDir, 'video');
		const videoFiles = fs.readdirSync(videoDir);
		const videoFile = videoFiles[0];
		return readFile(path.join(videoDir, videoFile));
	}

	async getAudio(id: string): Promise<Buffer> {
		const projectDir = path.join(this.projectsDir, id);
		const audioDir = path.join(projectDir, 'audio');
		const tempZipPath = path.join(projectDir, 'temp-audio.zip');

		const output = createWriteStream(tempZipPath);
		const archive = archiver('zip', {
			zlib: { level: 9 },
			store: false,
		});

		archive.pipe(output);

		const audioFiles = fs.readdirSync(audioDir);
		for (const audioFile of audioFiles) {
			const filePath = path.join(audioDir, audioFile);
			archive.file(filePath, { name: audioFile });
		}

		await archive.finalize();

		await new Promise((resolve, reject) => {
			output.on('close', resolve);
			output.on('error', reject);
			archive.on('error', reject);
		});

		const zipBuffer = await readFile(tempZipPath);
		try {
			await fs.promises.unlink(tempZipPath);
		} catch (error) {
			console.error('Failed to clean up temporary zip file:', error);
		}

		return zipBuffer;
	}

	async createTemplate(template: Template): Promise<void> {
		const templateDir = path.join(this.templatesDir, template.id);
		await mkdir(templateDir, { recursive: true });
		await db.insert(templates).values({
			id: template.id,
			name: template.name,
			description: template.description,
			createdAt: template.createdAt,
			options: JSON.stringify(template.options),
			pauseSoundFilename: template.pauseSoundFilename,
		});
	}

	async getTemplate(id: string): Promise<Template | null> {
		const result = await db.select().from(templates).where(eq(templates.id, id)).limit(1);

		if (!result.length) {
			return null;
		}

		const template = result[0];
		return {
			id: template.id,
			name: template.name,
			description: template.description,
			createdAt: template.createdAt,
			options: JSON.parse(template.options),
			pauseSoundFilename: template.pauseSoundFilename,
		};
	}

	async getAllTemplates(): Promise<Template[]> {
		const results = await db.select().from(templates);
		return results
			.map(template => ({
				id: template.id,
				name: template.name,
				description: template.description,
				createdAt: template.createdAt,
				options: JSON.parse(template.options),
				pauseSoundFilename: template.pauseSoundFilename,
			}))
			.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
	}

	async updateTemplate(template: Template): Promise<void> {
		await db
			.update(templates)
			.set({
				name: template.name,
				description: template.description,
				options: JSON.stringify(template.options),
				pauseSoundFilename: template.pauseSoundFilename,
			})
			.where(eq(templates.id, template.id));
	}

	async deleteTemplate(id: string): Promise<void> {
		if (id === DEFAULT_TEMPLATE_ID) {
			throw new Error('Cannot delete the default template');
		}

		await db.delete(templates).where(eq(templates.id, id));

		// Delete the template directory and files
		const templateDir = path.join(this.templatesDir, id);
		if (fs.existsSync(templateDir)) {
			await fs.promises.rm(templateDir, { recursive: true, force: true });
		}
	}

	async updateTemplatePauseSound(id: string, fileName: string, content: Buffer): Promise<void> {
		const template = await this.getTemplate(id);
		if (!template) {
			throw new Error('Template not found');
		}

		const templateDir = path.join(this.templatesDir, id);
		await mkdir(templateDir, { recursive: true });

		// Remove old pause sound if it exists and is different
		if (template.pauseSoundFilename && template.pauseSoundFilename !== fileName) {
			const oldPath = path.join(templateDir, template.pauseSoundFilename);
			if (fs.existsSync(oldPath)) {
				await fs.promises.unlink(oldPath);
			}
		}

		// Save new pause sound to template directory
		const templatePauseSoundPath = path.join(templateDir, fileName);
		await writeFile(templatePauseSoundPath, content);

		// Update template record
		await db.update(templates).set({ pauseSoundFilename: fileName }).where(eq(templates.id, id));

		// Update all projects using this template
		await this.updateProjectPauseSound(id, fileName);
	}

	async updateProjectPauseSound(templateId: string, fileName: string): Promise<void> {
		// Get the template and its pause sound file
		const templatePauseSoundPath = path.join(this.templatesDir, templateId, fileName);
		if (!fs.existsSync(templatePauseSoundPath)) {
			throw new Error('Template pause sound file not found');
		}

		// Find all projects using this template
		const projectsWithTemplate = await db.select().from(projects).where(eq(projects.template_id, templateId));

		// Update each project's pause sound
		for (const projectRow of projectsWithTemplate) {
			const project = JSON.parse(projectRow.state) as Project;
			const projectDir = path.join(this.projectsDir, project.id);
			const projectMiscDir = path.join(projectDir, 'misc');

			// Ensure misc directory exists
			await mkdir(projectMiscDir, { recursive: true });

			// Copy new pause sound to project
			const projectPauseSoundPath = path.join(projectMiscDir, fileName);
			await fs.promises.copyFile(templatePauseSoundPath, projectPauseSoundPath);

			// Remove old pause sound if it exists and is different
			if (project.pauseSoundFilename && project.pauseSoundFilename !== fileName) {
				const oldPauseSoundPath = path.join(projectMiscDir, project.pauseSoundFilename);
				if (fs.existsSync(oldPauseSoundPath)) {
					await fs.promises.unlink(oldPauseSoundPath);
				}
			}

			// Update project state with new filename
			project.pauseSoundFilename = fileName;
			await this.updateProjectState(project);
		}
	}

	async getTemplateFile(templateId: string, fileName: string): Promise<Buffer> {
		return readFile(path.join(this.templatesDir, templateId, fileName));
	}

	async deleteProjectAudio(id: string): Promise<void> {
		const audioDir = path.join(this.projectsDir, id, 'audio');
		if (fs.existsSync(audioDir)) {
			await fs.promises.rm(audioDir, { recursive: true, force: true });
		}
	}

	async ensureDefaultTemplateExists(): Promise<void> {
		const template = await this.getTemplate(DEFAULT_TEMPLATE_ID);
		if (!template) {
			const newTemplate = {
				...defaultTemplate,
				id: DEFAULT_TEMPLATE_ID,
				name: 'Default Template',
				description: 'A project template with sensible defaults',
				createdAt: new Date().toISOString(),
				pauseSoundFilename: 'pause_default.wav',
			};

			await this.createTemplate(newTemplate);
		}
	}
}

export const projectStorage = new ProjectStorage();
