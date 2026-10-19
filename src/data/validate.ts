import {
  brand,
  MUSCLE_GROUPS,
  type Exercise,
  type ExerciseId,
  type MuscleGroup,
  type PlannedSet,
  type Result,
  type Session,
  type SessionEntry,
  type SessionId,
  type Set,
  type ValidationError,
  type Workout,
  type WorkoutExercise,
  type WorkoutId,
} from './types';

// Parsers throw this internally; the public parse* functions turn it into a Result.
class Invalid extends Error {
  constructor(
    readonly path: string,
    message: string,
  ) {
    super(message);
  }
}

type Rec = Record<string, unknown>;

function record(v: unknown, path: string): Rec {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) {
    throw new Invalid(path, 'expected object');
  }
  return Object.fromEntries(Object.entries(v));
}

function field(r: Rec, key: string, path: string): unknown {
  if (!(key in r)) throw new Invalid(`${path}${key}`, 'missing field');
  return r[key];
}

function str(v: unknown, path: string): string {
  if (typeof v !== 'string' || v.length === 0) {
    throw new Invalid(path, 'expected non-empty string');
  }
  return v;
}

function bool(v: unknown, path: string): boolean {
  if (typeof v !== 'boolean') throw new Invalid(path, 'expected boolean');
  return v;
}

function nonNegInt(v: unknown, path: string): number {
  if (typeof v !== 'number' || !Number.isInteger(v) || v < 0) {
    throw new Invalid(path, 'expected integer >= 0');
  }
  return v;
}

function nonNegNumber(v: unknown, path: string): number {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) {
    throw new Invalid(path, 'expected finite number >= 0');
  }
  return v;
}

function array<T>(
  v: unknown,
  path: string,
  item: (x: unknown, p: string) => T,
): T[] {
  if (!Array.isArray(v)) throw new Invalid(path, 'expected array');
  return v.map((x, i) => item(x, `${path}[${i}]`));
}

function muscleGroup(v: unknown, path: string): MuscleGroup {
  const found = MUSCLE_GROUPS.find((g) => g === v);
  if (found === undefined) {
    throw new Invalid(path, `expected one of ${MUSCLE_GROUPS.join(', ')}`);
  }
  return found;
}

const exerciseId = (v: unknown, p: string): ExerciseId => brand<'ExerciseId'>(str(v, p));
const workoutId = (v: unknown, p: string): WorkoutId => brand<'WorkoutId'>(str(v, p));
const sessionId = (v: unknown, p: string): SessionId => brand<'SessionId'>(str(v, p));

function plannedSet(v: unknown, path: string): PlannedSet {
  const r = record(v, path);
  return {
    reps: nonNegInt(field(r, 'reps', `${path}.`), `${path}.reps`),
    weightKg: nonNegNumber(field(r, 'weightKg', `${path}.`), `${path}.weightKg`),
  };
}

function set(v: unknown, path: string): Set {
  const r = record(v, path);
  return {
    ...plannedSet(v, path),
    completed: bool(field(r, 'completed', `${path}.`), `${path}.completed`),
  };
}

function workoutExercise(v: unknown, path: string): WorkoutExercise {
  const r = record(v, path);
  return {
    exerciseId: exerciseId(field(r, 'exerciseId', `${path}.`), `${path}.exerciseId`),
    targetSets: array(field(r, 'targetSets', `${path}.`), `${path}.targetSets`, plannedSet),
  };
}

function sessionEntry(v: unknown, path: string): SessionEntry {
  const r = record(v, path);
  return {
    exerciseId: exerciseId(field(r, 'exerciseId', `${path}.`), `${path}.exerciseId`),
    sets: array(field(r, 'sets', `${path}.`), `${path}.sets`, set),
  };
}

function guard<T>(parse: () => T): Result<T, ValidationError> {
  try {
    return { ok: true, value: parse() };
  } catch (e) {
    if (e instanceof Invalid) {
      return { ok: false, error: { path: e.path, message: e.message } };
    }
    throw e;
  }
}

export function parseExercise(input: unknown): Result<Exercise, ValidationError> {
  return guard(() => {
    const r = record(input, '$');
    return {
      id: exerciseId(field(r, 'id', '$.'), '$.id'),
      name: str(field(r, 'name', '$.'), '$.name'),
      muscleGroup: muscleGroup(field(r, 'muscleGroup', '$.'), '$.muscleGroup'),
    };
  });
}

export function parseWorkout(input: unknown): Result<Workout, ValidationError> {
  return guard(() => {
    const r = record(input, '$');
    return {
      id: workoutId(field(r, 'id', '$.'), '$.id'),
      name: str(field(r, 'name', '$.'), '$.name'),
      exercises: array(field(r, 'exercises', '$.'), '$.exercises', workoutExercise),
    };
  });
}

export function parseSession(input: unknown): Result<Session, ValidationError> {
  return guard(() => {
    const r = record(input, '$');
    const startedAt = nonNegInt(field(r, 'startedAt', '$.'), '$.startedAt');
    const rawEnd = field(r, 'endedAt', '$.');
    const endedAt = rawEnd === null ? null : nonNegInt(rawEnd, '$.endedAt');
    if (endedAt !== null && endedAt < startedAt) {
      throw new Invalid('$.endedAt', 'must not be before startedAt');
    }
    return {
      id: sessionId(field(r, 'id', '$.'), '$.id'),
      workoutId: workoutId(field(r, 'workoutId', '$.'), '$.workoutId'),
      startedAt,
      endedAt,
      entries: array(field(r, 'entries', '$.'), '$.entries', sessionEntry),
    };
  });
}
