import type { ExerciseId, ValidationError, Workout, WorkoutId } from '@/data/types';

export type DraftSet = { reps: string; weightKg: string };
export type DraftExercise = { exerciseId: ExerciseId; sets: DraftSet[] };
export type Draft = { id: WorkoutId; name: string; exercises: DraftExercise[] };

export type DraftAction =
  | { type: 'rename'; name: string }
  | { type: 'addExercise'; exerciseId: ExerciseId }
  | { type: 'removeExercise'; index: number }
  | { type: 'moveExercise'; index: number; direction: -1 | 1 }
  | { type: 'addSet'; exerciseIndex: number }
  | { type: 'removeSet'; exerciseIndex: number; setIndex: number }
  | {
      type: 'editSet';
      exerciseIndex: number;
      setIndex: number;
      field: keyof DraftSet;
      value: string;
    };

const DEFAULT_SET: DraftSet = { reps: '8', weightKg: '0' };

export function newDraft(id: WorkoutId): Draft {
  return { id, name: '', exercises: [] };
}

export function draftFromWorkout(w: Workout): Draft {
  return {
    id: w.id,
    name: w.name,
    exercises: w.exercises.map((e) => ({
      exerciseId: e.exerciseId,
      sets: e.targetSets.map((s) => ({ reps: String(s.reps), weightKg: String(s.weightKg) })),
    })),
  };
}

function mapExercise(
  exercises: DraftExercise[],
  index: number,
  update: (e: DraftExercise) => DraftExercise,
): DraftExercise[] {
  return exercises.map((e, i) => (i === index ? update(e) : e));
}

export function draftReducer(draft: Draft, action: DraftAction): Draft {
  switch (action.type) {
    case 'rename':
      return { ...draft, name: action.name };
    case 'addExercise':
      return {
        ...draft,
        exercises: [...draft.exercises, { exerciseId: action.exerciseId, sets: [{ ...DEFAULT_SET }] }],
      };
    case 'removeExercise':
      return { ...draft, exercises: draft.exercises.filter((_, i) => i !== action.index) };
    case 'moveExercise': {
      const target = action.index + action.direction;
      if (target < 0 || target >= draft.exercises.length || action.index < 0) return draft;
      const exercises = [...draft.exercises];
      const [moved] = exercises.splice(action.index, 1);
      if (moved === undefined) return draft;
      exercises.splice(target, 0, moved);
      return { ...draft, exercises };
    }
    case 'addSet':
      return {
        ...draft,
        exercises: mapExercise(draft.exercises, action.exerciseIndex, (e) => {
          const last = e.sets[e.sets.length - 1];
          return { ...e, sets: [...e.sets, { ...(last ?? DEFAULT_SET) }] };
        }),
      };
    case 'removeSet':
      return {
        ...draft,
        exercises: mapExercise(draft.exercises, action.exerciseIndex, (e) => ({
          ...e,
          sets: e.sets.filter((_, i) => i !== action.setIndex),
        })),
      };
    case 'editSet':
      return {
        ...draft,
        exercises: mapExercise(draft.exercises, action.exerciseIndex, (e) => ({
          ...e,
          sets: e.sets.map((s, i) =>
            i === action.setIndex ? { ...s, [action.field]: action.value } : s,
          ),
        })),
      };
  }
}

// Number('') is 0, which would silently accept a blank field. NaN makes validation reject it.
function toNumber(text: string): number {
  return text.trim() === '' ? NaN : Number(text);
}

export function toWorkoutInput(d: Draft): unknown {
  return {
    id: d.id,
    name: d.name.trim(),
    exercises: d.exercises.map((e) => ({
      exerciseId: e.exerciseId,
      targetSets: e.sets.map((s) => ({ reps: toNumber(s.reps), weightKg: toNumber(s.weightKg) })),
    })),
  };
}

const SET_FIELD_MESSAGES: Record<string, string> = {
  reps: 'reps must be a whole number ≥ 0',
  weightKg: 'weight must be a number ≥ 0',
};

/** Turns a parser path like `$.exercises[1].targetSets[0].reps` into a message for the editor. */
export function describeValidationError(error: ValidationError): string {
  if (error.path === '$.name') return 'Name is required';
  const set = /^\$\.exercises\[(\d+)\]\.targetSets\[(\d+)\]\.(\w+)$/.exec(error.path);
  if (set) {
    const [, e, s, field] = set;
    const what = SET_FIELD_MESSAGES[field ?? ''] ?? error.message;
    return `Exercise ${Number(e) + 1}, set ${Number(s) + 1}: ${what}`;
  }
  const exercise = /^\$\.exercises\[(\d+)\]/.exec(error.path);
  if (exercise) return `Exercise ${Number(exercise[1]) + 1}: ${error.message}`;
  return `${error.path}: ${error.message}`;
}
