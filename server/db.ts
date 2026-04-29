import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'historic-hero.db');

const db = new Database(dbPath, { readonly: true });
db.pragma('journal_mode = WAL');

export default db;
