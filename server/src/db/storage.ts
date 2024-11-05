import { drizzle } from 'drizzle-orm/bun-sqlite';
import { Database } from 'bun:sqlite';
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { eq } from 'drizzle-orm';
import { writeFile, readFile, mkdir } from 'fs/promises';
import * as fs from 'fs';
import * as path from 'path';
import { VideoGenState } from '@shared/types/api/schema';
import { createDefaultVideoGenState } from '@/lib/defaultVideoGenState';

const DATA_DIR = './data';
const DB_PATH = path.join(DATA_DIR, 'projects.db');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
	fs.mkdirSync(DATA_DIR);
}

// Initialize database and table
const sqlite = new Database(DB_PATH);
sqlite.run(`
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    state TEXT NOT NULL
  )
`);

// Schema definition for Drizzle
const projects = sqliteTable('projects', {
	id: text('id').primaryKey(),
	state: text('state').notNull(),
});

// Initialize Drizzle
const db = drizzle(sqlite);

export class ProjectStorage {
	async createProject(id: string): Promise<VideoGenState> {
		const defaultState = createDefaultVideoGenState(id);

		await db.insert(projects).values({
			id,
			state: JSON.stringify(defaultState),
		});

		await mkdir(path.join(DATA_DIR, id), { recursive: true });
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
}

export const projectStorage = new ProjectStorage();
