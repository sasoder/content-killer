import { Database } from 'bun:sqlite';
import { mkdir, writeFile, readFile } from 'fs/promises';
import * as fs from 'fs';
import * as path from 'path';
import { VideoMetadata, VideoGenState } from '@shared/types/api/schema';
import { createDefaultVideoGenState } from '@/lib/defaultVideoGenState';

const DATA_DIR = './data';
const DB_PATH = path.join(DATA_DIR, 'projects.db');

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
        state TEXT
      )
    `);
	}

	async createProject(id: string): Promise<VideoGenState> {
		const defaultState = createDefaultVideoGenState(id);
		await this.db.run('INSERT INTO projects (id, state) VALUES (?, ?)', [id, JSON.stringify(defaultState)]);
		await mkdir(path.join(DATA_DIR, id), { recursive: true });
		return defaultState;
	}

	async getProject(id: string): Promise<VideoGenState | null> {
		const row = this.db.query('SELECT * FROM projects WHERE id = ?').get(id) as any;
		if (!row) {
			return null;
		}
		console.log('--------------GET PROJECT-------------------');
		console.log(JSON.parse(row.state));
		console.log('--------------GET PROJECT-------------------');
		return JSON.parse(row.state);
	}

	async getAllVideoGenStates(): Promise<VideoGenState[]> {
		const rows = this.db.query('SELECT id, state FROM projects').all() as any[];
		return rows.map(row => JSON.parse(row.state));
	}

	async updateProjectState(state: VideoGenState): Promise<void> {
		await this.db.run('UPDATE projects SET state = ? WHERE id = ?', [JSON.stringify(state), state.id]);
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
