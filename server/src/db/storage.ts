import { drizzle } from 'drizzle-orm/bun-sqlite';
import { Database } from 'bun:sqlite';
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { eq } from 'drizzle-orm';
import { writeFile, readFile, mkdir } from 'fs/promises';
import * as fs from 'fs';
import * as path from 'path';
import { Project } from '@shared/types/api/schema';
import { ProjectTemplate } from '@shared/types/options/template';
import { defaultProjectTemplate } from '@shared/types/options/defaultTemplates';
import { createDefaultProject } from '@/lib/defaultProject';

const DATA_DIR = './data';
const FILES_DIR = path.join(DATA_DIR, 'files');
const PROJECT_TEMPLATES_DIR = path.join(DATA_DIR, 'project-templates');
const DB_PATH = path.join(DATA_DIR, 'projects.db');
const DEFAULT_TEMPLATE_ID = 'default';

// Ensure directories exist for file storage
if (!fs.existsSync(DATA_DIR)) {
	fs.mkdirSync(DATA_DIR);
}
if (!fs.existsSync(FILES_DIR)) {
	fs.mkdirSync(FILES_DIR);
}
if (!fs.existsSync(PROJECT_TEMPLATES_DIR)) {
	fs.mkdirSync(PROJECT_TEMPLATES_DIR);
}

// Initialize database and tables
const sqlite = new Database(DB_PATH);

// Enable foreign keys and WAL mode for better performance
sqlite.run('PRAGMA foreign_keys = ON;');
sqlite.run('PRAGMA journal_mode = WAL;');

sqlite.run(`
    CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY NOT NULL,
        state TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    )
`);

sqlite.run(`
    CREATE TABLE IF NOT EXISTS project_templates (
        id TEXT PRIMARY KEY NOT NULL,
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
	createdAt: text('created_at').notNull(),
	updatedAt: text('updated_at').notNull(),
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
	private projectsDir: string;
	private templatesDir: string;

	constructor(dataDir: string) {
		this.projectsDir = path.join(dataDir, 'projects');
		this.templatesDir = path.join(dataDir, 'project-templates');
	}

	async createProject(id: string, projectTemplate?: ProjectTemplate): Promise<Project> {
		const now = new Date().toISOString();
		const defaultState = createDefaultProject(id, projectTemplate);

		await db.insert(projects).values({
			id,
			state: JSON.stringify(defaultState),
			createdAt: now,
			updatedAt: now,
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
		const now = new Date().toISOString();

		await db
			.update(projects)
			.set({
				state: JSON.stringify(state),
				updatedAt: now,
			})
			.where(eq(projects.id, state.id));
	}

	async saveFile(id: string, fileName: string, content: Buffer): Promise<void> {
		const projectDir = path.join(this.projectsDir, id);
		await mkdir(projectDir, { recursive: true });
		await writeFile(path.join(projectDir, fileName), content);
	}

	async getFile(id: string, fileName: string): Promise<Buffer> {
		return readFile(path.join(this.projectsDir, id, fileName));
	}

	async createProjectTemplate(template: ProjectTemplate): Promise<void> {
		const templateDir = path.join(this.templatesDir, template.id);
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

	async getAllProjectTemplates(): Promise<ProjectTemplate[]> {
		const results = await db.select().from(projectTemplates);
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

		// Delete the template directory and files
		const templateDir = path.join(this.templatesDir, id);
		if (fs.existsSync(templateDir)) {
			await fs.promises.rm(templateDir, { recursive: true, force: true });
		}
	}

	async updateTemplatePauseSound(id: string, fileName: string, content: Buffer): Promise<void> {
		const template = await this.getProjectTemplate(id);
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

		// Save new pause sound
		await writeFile(path.join(templateDir, fileName), content);

		// Update template record
		await db.update(projectTemplates).set({ pauseSoundFilename: fileName }).where(eq(projectTemplates.id, id));
	}

	async getProjectTemplateFile(templateId: string, fileName: string): Promise<Buffer> {
		return readFile(path.join(this.templatesDir, templateId, fileName));
	}

	async deleteProjectCommentary(id: string): Promise<void> {
		const commentaryDir = path.join(this.projectsDir, id, 'commentary');
		if (fs.existsSync(commentaryDir)) {
			await fs.promises.rm(commentaryDir, { recursive: true, force: true });
		}
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

export const projectStorage = new ProjectStorage(process.env.DATA_DIR || 'data');
