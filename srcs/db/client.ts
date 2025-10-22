// src/db/client.ts
import Database from 'better-sqlite3';
import path from 'path';
import { getOrCreateJwtKey } from '../auth/jwtKey';

const dbPath = path.join(__dirname, '../../data/transcendence.db');
export const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  );
`);

// Generate or load JWT key at the same time
export const jwtKey = getOrCreateJwtKey();
