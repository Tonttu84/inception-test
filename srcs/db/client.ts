// src/db/client.ts
//When this file gets imported the database gets created, further imports are guarded against by const and only creating table if doesnt exist


import Database from 'better-sqlite3';
import path from 'path';
import { getOrCreateJwtKey } from '../auth/jwtKey';

const dbPath = path.join(__dirname, '../../data/transcendence.db');
export const db = new Database(dbPath);



// Generate or load JWT key at the same time
export const jwtKey = getOrCreateJwtKey();


