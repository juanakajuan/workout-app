import * as SQLite from 'expo-sqlite';

import { SEED_EXERCISES } from './seed';

const DB_NAME = 'workout.db';

export const TABLES = ['exercises', 'workouts', 'sessions'] as const;
export type Table = (typeof TABLES)[number];

let opening: Promise<SQLite.SQLiteDatabase> | null = null;

// File-backed (named) database, so data survives app restarts.
// The shared promise makes concurrent first calls open and migrate once.
export function getDb(): Promise<SQLite.SQLiteDatabase> {
  opening ??= open().catch((e: unknown) => {
    opening = null;
    throw e;
  });
  return opening;
}

async function open(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    ${TABLES.map(
      (t) => `CREATE TABLE IF NOT EXISTS ${t} (id TEXT PRIMARY KEY NOT NULL, data TEXT NOT NULL);`,
    ).join('\n')}
  `);
  // OR IGNORE keeps re-runs from duplicating or overwriting existing rows.
  await db.withTransactionAsync(async () => {
    for (const e of SEED_EXERCISES) {
      await db.runAsync(
        'INSERT OR IGNORE INTO exercises (id, data) VALUES (?, ?)',
        e.id,
        JSON.stringify(e),
      );
    }
  });
  return db;
}
