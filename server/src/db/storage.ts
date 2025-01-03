import { drizzle } from 'drizzle-orm/bun-sqlite';
import { Database } from 'bun:sqlite';
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { eq } from 'drizzle-orm';
import { writeFile, readFile, mkdir } from 'fs/promises';
import * as fs from 'fs';
import * as path from 'path';
import { VideoGenState } from '@shared/types/api/schema';
import { createDefaultVideoGenState } from '@/lib/defaultVideoGenState';
import { ProjectTemplate } from '@shared/types/options/template';
import { defaultProjectTemplate } from '@shared/types/options/defaultTemplates';

const DATA_DIR = './data';
const PROJECT_TEMPLATES_DIR = path.join(DATA_DIR, 'project-templates');
const DB_PATH = path.join(DATA_DIR, 'projects.db');
const DEFAULT_TEMPLATE_ID = 'default';

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
	fs.mkdirSync(DATA_DIR);
}
if (!fs.existsSync(PROJECT_TEMPLATES_DIR)) {
	fs.mkdirSync(PROJECT_TEMPLATES_DIR);
}

// Initialize database and tables
const sqlite = new Database(DB_PATH);
sqlite.run(`
	CREATE TABLE IF NOT EXISTS projects (
		id TEXT PRIMARY KEY,
		state TEXT NOT NULL
	)
`);
sqlite.run(`
	CREATE TABLE IF NOT EXISTS project_templates (
		id TEXT PRIMARY KEY,
		name TEXT NOT NULL,
		description TEXT NOT NULL,
		created_at TEXT NOT NULL,
		options TEXT NOT NULL,
		pause_sound_filename TEXT NOT NULL
	)
`);

// Schema definition for Drizzle
const projects = sqliteTable('projects', {
	id: text('id').primaryKey(),
	state: text('state').notNull(),
});

const projectTemplates = sqliteTable('project_templates', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	description: text('description').notNull(),
	createdAt: text('created_at').notNull(),
	options: text('options').notNull(),
	pauseSoundFilename: text('pause_sound_filename').notNull(),
});

// Initialize Drizzle
const db = drizzle(sqlite);

export class ProjectStorage {
	async createProject(id: string, projectTemplate?: ProjectTemplate): Promise<VideoGenState> {
		const defaultState = createDefaultVideoGenState(id, projectTemplate);

		await db.insert(projects).values({
			id,
			state: JSON.stringify(defaultState),
		});

		await mkdir(path.join(DATA_DIR, id), { recursive: true });
		await mkdir(path.join(DATA_DIR, id, 'misc'), { recursive: true });

		// If there's a pause sound in the template, copy it to the project
		if (projectTemplate && projectTemplate.pauseSoundFilename) {
			const pausePath = path.join(PROJECT_TEMPLATES_DIR, projectTemplate.id, projectTemplate.pauseSoundFilename);
			if (fs.existsSync(pausePath)) {
				await fs.promises.copyFile(pausePath, path.join(DATA_DIR, id, 'misc', projectTemplate.pauseSoundFilename));
			}
		}

		return defaultState;
	}

	async getProject(id: string): Promise<VideoGenState | null> {
		const result = await db.select().from(projects).where(eq(projects.id, id)).limit(1);

		const project = result[0];
		return project ? JSON.parse(project.state) : null;
	}

	async getAllVideoGenStates(): Promise<VideoGenState[]> {
		const results = await db.select().from(projects);
		return results.map(row => JSON.parse(row.state));
	}

	async updateProjectState(state: VideoGenState): Promise<void> {
		await db
			.update(projects)
			.set({ state: JSON.stringify(state) })
			.where(eq(projects.id, state.id));
	}

	async saveFile(id: string, fileName: string, content: Buffer): Promise<void> {
		const filePath = path.join(DATA_DIR, id, fileName);
		await writeFile(filePath, content);
	}

	async getFile(id: string, fileName: string): Promise<Buffer> {
		const filePath = path.join(DATA_DIR, id, fileName);
		return readFile(filePath);
	}

	async createProjectTemplate(template: ProjectTemplate): Promise<void> {
		const templateDir = path.join(PROJECT_TEMPLATES_DIR, template.id);
		await mkdir(templateDir, { recursive: true });

		await db.insert(projectTemplates).values({
			id: template.id,
			name: template.name,
			description: template.description,
			createdAt: template.createdAt,
			options: JSON.stringify(template.options),
			pauseSoundFilename: template.pauseSoundFilename,
		});
	}

	async getProjectTemplate(id: string): Promise<ProjectTemplate | null> {
		const result = await db.select().from(projectTemplates).where(eq(projectTemplates.id, id)).limit(1);
		const template = result[0];
		if (!template) return null;

		return {
			id: template.id,
			name: template.name,
			description: template.description,
			createdAt: template.createdAt,
			options: JSON.parse(template.options),
			pauseSoundFilename: template.pauseSoundFilename,
		};
	}

	async getAllProjectTemplates(): Promise<ProjectTemplate[]> {
		const results = await db.select().from(projectTemplates);
		return results.map(template => ({
			id: template.id,
			name: template.name,
			description: template.description,
			createdAt: template.createdAt,
			options: JSON.parse(template.options),
			pauseSoundFilename: template.pauseSoundFilename,
		}));
	}

	async updateProjectTemplate(template: ProjectTemplate): Promise<void> {
		await db
			.update(projectTemplates)
			.set({
				name: template.name,
				description: template.description,
				options: JSON.stringify(template.options),
				pauseSoundFilename: template.pauseSoundFilename,
			})
			.where(eq(projectTemplates.id, template.id));
	}

	async deleteProjectTemplate(id: string): Promise<void> {
		if (id === DEFAULT_TEMPLATE_ID) {
			throw new Error('Cannot delete the default template');
		}

		await db.delete(projectTemplates).where(eq(projectTemplates.id, id));

		// Delete the template directory and all its contents
		const templateDir = path.join(PROJECT_TEMPLATES_DIR, id);
		if (fs.existsSync(templateDir)) {
			await fs.promises.rm(templateDir, { recursive: true, force: true });
		}
	}

	async updateTemplatePauseSound(id: string, fileName: string, content: Buffer): Promise<void> {
		// Get the current template to find the existing pause sound file
		const template = await this.getProjectTemplate(id);
		if (!template) {
			throw new Error('Template not found');
		}

		const templateDir = path.join(PROJECT_TEMPLATES_DIR, id);
		await mkdir(templateDir, { recursive: true });

		// Remove the existing pause sound file if it exists and is different
		if (template.pauseSoundFilename && template.pauseSoundFilename !== fileName) {
			const existingFilePath = path.join(templateDir, template.pauseSoundFilename);
			if (fs.existsSync(existingFilePath)) {
				await fs.promises.unlink(existingFilePath);
			}
		}

		// Write the new pause sound file
		const filePath = path.join(templateDir, fileName);
		await writeFile(filePath, content);

		// Update the template in the database with the new filename
		await db.update(projectTemplates).set({ pauseSoundFilename: fileName }).where(eq(projectTemplates.id, id));
	}

	async getProjectTemplateFile(templateId: string, fileName: string): Promise<Buffer> {
		const filePath = path.join(PROJECT_TEMPLATES_DIR, templateId, fileName);
		return readFile(filePath);
	}

	async ensureDefaultTemplateExists(): Promise<void> {
		const defaultTemplate = await this.getProjectTemplate(DEFAULT_TEMPLATE_ID);
		if (!defaultTemplate) {
			const template = {
				...defaultProjectTemplate,
				id: DEFAULT_TEMPLATE_ID,
				name: 'Default Template',
				description: 'A project template with sensible defaults',
				createdAt: new Date().toISOString(),
				pauseSoundFilename: 'pause_default.wav',
			};

			await this.createProjectTemplate(template);
		}
	}
}

export const projectStorage = new ProjectStorage();
