type Brand<Name extends string> = string & { readonly __brand: Name };

export type ExerciseId = Brand<'ExerciseId'>;
export type WorkoutId = Brand<'WorkoutId'>;
export type SessionId = Brand<'SessionId'>;

// The only unchecked cast in the data layer. Callers must have validated `value`.
export function brand<Name extends string>(value: string): Brand<Name> {
  return value as Brand<Name>;
}

export const MUSCLE_GROUPS = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'legs',
  'core',
  'full-body',
  'cardio',
] as const;
export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export type Exercise = {
  readonly id: ExerciseId;
  readonly name: string;
  readonly muscleGroup: MuscleGroup;
};

/** A planned set in a workout template. */
export type PlannedSet = {
  readonly reps: number;
  readonly weightKg: number;
};

/** A set performed during a session. */
export type Set = PlannedSet & {
  readonly completed: boolean;
};

export type WorkoutExercise = {
  readonly exerciseId: ExerciseId;
  readonly targetSets: readonly PlannedSet[];
};

/** A reusable template. */
export type Workout = {
  readonly id: WorkoutId;
  readonly name: string;
  readonly exercises: readonly WorkoutExercise[];
};

export type SessionEntry = {
  readonly exerciseId: ExerciseId;
  readonly sets: readonly Set[];
};

/** A performed workout. Times are epoch milliseconds. */
export type Session = {
  readonly id: SessionId;
  readonly workoutId: WorkoutId;
  readonly startedAt: number;
  readonly endedAt: number | null;
  readonly entries: readonly SessionEntry[];
};

export type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export type ValidationError = {
  /** Path to the bad field, e.g. `entries[1].sets[0].reps`. */
  readonly path: string;
  readonly message: string;
};
