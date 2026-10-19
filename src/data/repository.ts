import { getDb, type Table } from './db';
import {
  parseExercise,
  parseSession,
  parseWorkout,
} from './validate';
import type {
  Exercise,
  ExerciseId,
  Result,
  Session,
  SessionId,
  ValidationError,
  Workout,
  WorkoutId,
} from './types';

export type StorageError =
  | { readonly kind: 'invalid-json'; readonly message: string }
  | { readonly kind: 'invalid-data'; readonly error: ValidationError };

export type InvalidRow = { readonly id: string; readonly error: StorageError };

export type ListResult<T> = {
  readonly items: T[];
  readonly invalid: InvalidRow[];
};

/** Thrown by save when the value fails validation; nothing is written. */
export class ValidationFailure extends Error {
  constructor(readonly error: ValidationError) {
    super(`${error.path}: ${error.message}`);
    this.name = 'ValidationFailure';
  }
}

type Row = { id: string; data: string };

type Entity<T, Id extends string> = {
  save(value: unknown): Promise<T>;
  get(id: Id): Promise<Result<T, StorageError> | null>;
  list(): Promise<ListResult<T>>;
  delete(id: Id): Promise<boolean>;
};

function decode<T>(
  raw: string,
  parse: (input: unknown) => Result<T, ValidationError>,
): Result<T, StorageError> {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch (e) {
    return { ok: false, error: { kind: 'invalid-json', message: String(e) } };
  }
  const parsed = parse(json);
  return parsed.ok
    ? parsed
    : { ok: false, error: { kind: 'invalid-data', error: parsed.error } };
}

function entity<T extends { readonly id: Id }, Id extends string>(
  table: Table,
  parse: (input: unknown) => Result<T, ValidationError>,
): Entity<T, Id> {
  return {
    async save(value) {
      const parsed = parse(value);
      if (!parsed.ok) throw new ValidationFailure(parsed.error);
      const db = await getDb();
      await db.runAsync(
        `INSERT OR REPLACE INTO ${table} (id, data) VALUES (?, ?)`,
        parsed.value.id,
        JSON.stringify(parsed.value),
      );
      return parsed.value;
    },

    // null means no row; a Result error means a row exists but is corrupt.
    async get(id) {
      const db = await getDb();
      const row = await db.getFirstAsync<Row>(`SELECT id, data FROM ${table} WHERE id = ?`, id);
      return row === null ? null : decode(row.data, parse);
    },

    async list() {
      const db = await getDb();
      const rows = await db.getAllAsync<Row>(`SELECT id, data FROM ${table} ORDER BY rowid`);
      const items: T[] = [];
      const invalid: InvalidRow[] = [];
      for (const row of rows) {
        const r = decode(row.data, parse);
        if (r.ok) items.push(r.value);
        else invalid.push({ id: row.id, error: r.error });
      }
      return { items, invalid };
    },

    async delete(id) {
      const db = await getDb();
      const res = await db.runAsync(`DELETE FROM ${table} WHERE id = ?`, id);
      return res.changes > 0;
    },
  };
}

export const exercises: Entity<Exercise, ExerciseId> = entity('exercises', parseExercise);
export const workouts: Entity<Workout, WorkoutId> = entity('workouts', parseWorkout);
export const sessions: Entity<Session, SessionId> = entity('sessions', parseSession);
