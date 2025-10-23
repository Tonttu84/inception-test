// src/db/schema.ts
import { db } from './client';

export function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tournaments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      status INTEGER NOT NULL DEFAULT 0, -- 0 = created, 1 = started, 2 = finished
      created_by TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tournament_players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tournament_id INTEGER NOT NULL,
      username TEXT NOT NULL,
      alias TEXT NOT NULL,
      wins INTEGER NOT NULL DEFAULT 0,
      alive INTEGER NOT NULL DEFAULT 1, -- 1 = alive, 0 = eliminated
      FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
      UNIQUE(tournament_id, username),
      UNIQUE(tournament_id, alias)
    );
  `);
}

