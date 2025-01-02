import { drizzle } from 'drizzle-orm/bun-sqlite';
import { Database } from 'bun:sqlite';
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { eq } from 'drizzle-orm';
import { writeFile, readFile, mkdir } from 'fs/promises';
import * as fs from 'fs';
import * as path from 'path';
import { VideoGenState } from '@shared/types/api/schema';
import { createDefaultVideoGenState } from '@/lib/defaultVideoGenState';
import { ProjectConfig } from '@shared/types/options/config';

const DATA_DIR = './data';
const PROJECT_CONFIGS_DIR = path.join(DATA_DIR, 'project-configs');
const DB_PATH = path.join(DATA_DIR, 'projects.db');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
	fs.mkdirSync(DATA_DIR);
}
if (!fs.existsSync(PROJECT_CONFIGS_DIR)) {
	fs.mkdirSync(PROJECT_CONFIGS_DIR);
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
	CREATE TABLE IF NOT EXISTS project_configs (
		id TEXT PRIMARY KEY,
		name TEXT NOT NULL,
		description TEXT NOT NULL,
		created_at TEXT NOT NULL,
		options TEXT NOT NULL,
		pause_sound_filename TEXT
	)
`);

// Schema definition for Drizzle
const projects = sqliteTable('projects', {
	id: text('id').primaryKey(),
	state: text('state').notNull(),
});

const projectConfigs = sqliteTable('project_configs', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	description: text('description').notNull(),
	createdAt: text('created_at').notNull(),
	options: text('options').notNull(),
	pauseSoundFilename: text('pause_sound_filename'),
});

// Initialize Drizzle
const db = drizzle(sqlite);

export class ProjectStorage {
	async createProject(id: string, projectConfig?: ProjectConfig): Promise<VideoGenState> {
		const defaultState = createDefaultVideoGenState(id, projectConfig);

		await db.insert(projects).values({
			id,
			state: JSON.stringify(defaultState),
		});

		await mkdir(path.join(DATA_DIR, id), { recursive: true });
		await mkdir(path.join(DATA_DIR, id, 'misc'), { recursive: true });

		// If there's a pause sound in the config, copy it to the project
		if (projectConfig) {
			const pausePath = path.join(PROJECT_CONFIGS_DIR, projectConfig.id, 'pause.mp3');
			if (fs.existsSync(pausePath)) {
				await fs.promises.copyFile(pausePath, path.join(DATA_DIR, id, 'misc', 'pause.mp3'));
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

	async createProjectConfig(config: ProjectConfig): Promise<void> {
		const configDir = path.join(PROJECT_CONFIGS_DIR, config.id);
		await mkdir(configDir, { recursive: true });

		await db.insert(projectConfigs).values({
			id: config.id,
			name: config.name,
			description: config.description,
			createdAt: config.createdAt,
			options: JSON.stringify(config.options),
			pauseSoundFilename: config.pauseSoundFilename,
		});
	}

	async getProjectConfig(id: string): Promise<ProjectConfig | null> {
		const result = await db.select().from(projectConfigs).where(eq(projectConfigs.id, id)).limit(1);
		const config = result[0];
		if (!config) return null;

		return {
			id: config.id,
			name: config.name,
			description: config.description,
			createdAt: config.createdAt,
			options: JSON.parse(config.options),
			pauseSoundFilename: config.pauseSoundFilename,
		};
	}

	async getAllProjectConfigs(): Promise<ProjectConfig[]> {
		const results = await db.select().from(projectConfigs);
		return results.map(config => ({
			id: config.id,
			name: config.name,
			description: config.description,
			createdAt: config.createdAt,
			options: JSON.parse(config.options),
			pauseSoundFilename: config.pauseSoundFilename,
		}));
	}

	async updateProjectConfig(config: ProjectConfig): Promise<void> {
		await db
			.update(projectConfigs)
			.set({
				name: config.name,
				description: config.description,
				options: JSON.stringify(config.options),
				pauseSoundFilename: config.pauseSoundFilename,
			})
			.where(eq(projectConfigs.id, config.id));
	}

	async deleteProjectConfig(id: string): Promise<void> {
		await db.delete(projectConfigs).where(eq(projectConfigs.id, id));

		// Delete the config directory and all its contents
		const configDir = path.join(PROJECT_CONFIGS_DIR, id);
		if (fs.existsSync(configDir)) {
			await fs.promises.rm(configDir, { recursive: true, force: true });
		}
	}

	async saveProjectConfigFile(id: string, fileName: string, content: Buffer): Promise<void> {
		const configDir = path.join(PROJECT_CONFIGS_DIR, id);
		await mkdir(configDir, { recursive: true });
		const filePath = path.join(configDir, fileName);
		await writeFile(filePath, content);
	}

	async getProjectConfigFile(configId: string, fileName: string): Promise<Buffer> {
		const filePath = path.join(PROJECT_CONFIGS_DIR, configId, fileName);
		return readFile(filePath);
	}
}

export const projectStorage = new ProjectStorage();
