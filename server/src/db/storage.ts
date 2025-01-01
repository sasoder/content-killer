import { drizzle } from 'drizzle-orm/bun-sqlite';
import { Database } from 'bun:sqlite';
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { eq } from 'drizzle-orm';
import { writeFile, readFile, mkdir } from 'fs/promises';
import * as fs from 'fs';
import * as path from 'path';
import { VideoGenState } from '@shared/types/api/schema';
import { createDefaultVideoGenState } from '@/lib/defaultVideoGenState';
import { OptionConfig } from '@shared/types/options/config';

const DATA_DIR = './data';
const OPTION_CONFIGS_DIR = path.join(DATA_DIR, 'option-configs');
const DB_PATH = path.join(DATA_DIR, 'projects.db');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
	fs.mkdirSync(DATA_DIR);
}
if (!fs.existsSync(OPTION_CONFIGS_DIR)) {
	fs.mkdirSync(OPTION_CONFIGS_DIR);
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
	CREATE TABLE IF NOT EXISTS option_configs (
		id TEXT PRIMARY KEY,
		name TEXT NOT NULL,
		description TEXT NOT NULL,
		created_at TEXT NOT NULL,
		options TEXT NOT NULL,
		pause_sound_path TEXT
	)
`);

// Schema definition for Drizzle
const projects = sqliteTable('projects', {
	id: text('id').primaryKey(),
	state: text('state').notNull(),
});

const optionConfigs = sqliteTable('option_configs', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	description: text('description').notNull(),
	createdAt: text('created_at').notNull(),
	options: text('options').notNull(),
	pauseSoundPath: text('pause_sound_path'),
});

// Initialize Drizzle
const db = drizzle(sqlite);

export class ProjectStorage {
	async createProject(id: string, optionConfig?: OptionConfig): Promise<VideoGenState> {
		const defaultState = createDefaultVideoGenState(id, optionConfig);

		await db.insert(projects).values({
			id,
			state: JSON.stringify(defaultState),
		});

		await mkdir(path.join(DATA_DIR, id), { recursive: true });

		// If there's a pause sound in the option config, copy it to the project directory
		if (optionConfig?.pauseSoundPath) {
			const sourcePath = path.join(OPTION_CONFIGS_DIR, optionConfig.pauseSoundPath);
			const destPath = path.join(DATA_DIR, id, 'pause.mp3');
			if (fs.existsSync(sourcePath)) {
				await fs.promises.copyFile(sourcePath, destPath);
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

	async createOptionConfig(config: OptionConfig): Promise<void> {
		await db.insert(optionConfigs).values({
			id: config.id,
			name: config.name,
			description: config.description,
			createdAt: config.createdAt,
			options: JSON.stringify(config.options),
			pauseSoundPath: config.pauseSoundPath || null,
		});
	}

	async getOptionConfig(id: string): Promise<OptionConfig | null> {
		const result = await db.select().from(optionConfigs).where(eq(optionConfigs.id, id)).limit(1);
		const config = result[0];
		if (!config) return null;

		return {
			id: config.id,
			name: config.name,
			description: config.description,
			createdAt: config.createdAt,
			options: JSON.parse(config.options),
			pauseSoundPath: config.pauseSoundPath || '',
		};
	}

	async getAllOptionConfigs(): Promise<OptionConfig[]> {
		const results = await db.select().from(optionConfigs);
		return results.map(config => ({
			id: config.id,
			name: config.name,
			description: config.description,
			createdAt: config.createdAt,
			options: JSON.parse(config.options),
			pauseSoundPath: config.pauseSoundPath || '',
		}));
	}

	async updateOptionConfig(config: OptionConfig): Promise<void> {
		await db
			.update(optionConfigs)
			.set({
				name: config.name,
				description: config.description,
				options: JSON.stringify(config.options),
				pauseSoundPath: config.pauseSoundPath || '',
			})
			.where(eq(optionConfigs.id, config.id));
	}

	async deleteOptionConfig(id: string): Promise<void> {
		await db.delete(optionConfigs).where(eq(optionConfigs.id, id));
		// Also delete the pause sound file if it exists
		const config = await this.getOptionConfig(id);
		if (config?.pauseSoundPath) {
			const filePath = path.join(OPTION_CONFIGS_DIR, config.pauseSoundPath);
			if (fs.existsSync(filePath)) {
				await fs.promises.unlink(filePath);
			}
		}
	}

	async saveOptionConfigFile(id: string, fileName: string, content: Buffer): Promise<string> {
		const filePath = path.join(OPTION_CONFIGS_DIR, `${id}_${fileName}`);
		await writeFile(filePath, content);
		return `${id}_${fileName}`;
	}

	async getOptionConfigFile(fileName: string): Promise<Buffer> {
		const filePath = path.join(OPTION_CONFIGS_DIR, fileName);
		return readFile(filePath);
	}
}

export const projectStorage = new ProjectStorage();
