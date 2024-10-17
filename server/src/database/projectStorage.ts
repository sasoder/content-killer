import { Database } from 'bun:sqlite';
import { mkdir, writeFile, readFile } from 'fs/promises';
import fs from 'fs';
import * as path from 'path';
import { VideoMetadata, VideoGenState } from '@shared/types/api/schema';
import { createDefaultVideoGenState } from '@/util/defaultVideoGenState';

const DATA_DIR = './data';
const DB_PATH = path.join(DATA_DIR, 'projects.db');

interface Project {
	id: string;
	metadata: VideoMetadata;
	state: VideoGenState;
}

class ProjectStorage {
	private db: Database;

	constructor() {
		if (!fs.existsSync(DATA_DIR)) {
			fs.mkdirSync(DATA_DIR);
		}
		this.db = new Database(DB_PATH);
		this.initDatabase();
	}

	private initDatabase() {
		this.db.run(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        metadata TEXT,
        state TEXT
      )
    `);
	}

	async createProject(id: string): Promise<void> {
		const defaultState = createDefaultVideoGenState(id);
		await this.db.run('INSERT INTO projects (id, metadata, state) VALUES (?, ?, ?)', [
			id,
			JSON.stringify({}),
			JSON.stringify(defaultState),
		]);
		await mkdir(path.join(DATA_DIR, id), { recursive: true });
	}

	async getProject(id: string): Promise<Project | null> {
		const row = this.db.query('SELECT * FROM projects WHERE id = ?').get(id) as any;
		if (!row) {
			await this.createProject(id);
			return this.getProject(id);
		}
		return {
			id: row.id,
			metadata: JSON.parse(row.metadata),
			state: JSON.parse(row.state),
		};
	}

	async getVideoIds(): Promise<string[]> {
		const rows = this.db.query('SELECT id FROM projects').all() as any[];
		return rows.map(row => row.id);
	}

	async updateProjectState(id: string, state: VideoGenState): Promise<void> {
		await this.db.run('UPDATE projects SET state = ? WHERE id = ?', [JSON.stringify(state), id]);
	}

	async updateMetadata(id: string, metadata: VideoMetadata): Promise<void> {
		await this.db.run('UPDATE projects SET metadata = ? WHERE id = ?', [JSON.stringify(metadata), id]);
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
