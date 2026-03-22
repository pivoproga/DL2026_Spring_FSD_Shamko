import Database from 'better-sqlite3';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';

const DB_DIR = path.join(__dirname, '..', '..', 'data');
const DB_PATH = path.join(DB_DIR, 'memes.db');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

// WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS memes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL,
    category TEXT NOT NULL CHECK(category IN ('hot','cold','rain','snow','wind','cloudy','clear')),
    likes INTEGER DEFAULT 0,
    dislikes INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS meme_votes (
    meme_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    vote TEXT NOT NULL CHECK(vote IN ('like', 'dislike')),
    created_at TEXT DEFAULT (datetime('now')),
    PRIMARY KEY (meme_id, user_id),
    FOREIGN KEY(meme_id) REFERENCES memes(id) ON DELETE CASCADE,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);

export interface AuthUser {
  id: number;
  username: string;
}

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export function createSession(userId: number): string {
  const token = crypto.randomBytes(32).toString('hex');
  db.prepare('INSERT INTO sessions (token, user_id) VALUES (?, ?)').run(token, userId);
  return token;
}

export function getUserByToken(token: string): AuthUser | null {
  const row = db.prepare(`
    SELECT u.id, u.username
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token = ?
  `).get(token) as AuthUser | undefined;
  return row ?? null;
}

export function deleteSession(token: string): void {
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

export default db;
