import { brand, type Exercise, type MuscleGroup } from './types';

function seed(id: string, name: string, muscleGroup: MuscleGroup): Exercise {
  return { id: brand<'ExerciseId'>(id), name, muscleGroup };
}

export const SEED_EXERCISES: readonly Exercise[] = [
  seed('bench-press', 'Bench Press', 'chest'),
  seed('incline-dumbbell-press', 'Incline Dumbbell Press', 'chest'),
  seed('push-up', 'Push-Up', 'chest'),
  seed('cable-fly', 'Cable Fly', 'chest'),
  seed('deadlift', 'Deadlift', 'back'),
  seed('pull-up', 'Pull-Up', 'back'),
  seed('barbell-row', 'Barbell Row', 'back'),
  seed('lat-pulldown', 'Lat Pulldown', 'back'),
  seed('overhead-press', 'Overhead Press', 'shoulders'),
  seed('lateral-raise', 'Lateral Raise', 'shoulders'),
  seed('face-pull', 'Face Pull', 'shoulders'),
  seed('barbell-curl', 'Barbell Curl', 'biceps'),
  seed('hammer-curl', 'Hammer Curl', 'biceps'),
  seed('triceps-pushdown', 'Triceps Pushdown', 'triceps'),
  seed('skull-crusher', 'Skull Crusher', 'triceps'),
  seed('dip', 'Dip', 'triceps'),
  seed('squat', 'Squat', 'legs'),
  seed('leg-press', 'Leg Press', 'legs'),
  seed('romanian-deadlift', 'Romanian Deadlift', 'legs'),
  seed('lunge', 'Lunge', 'legs'),
  seed('calf-raise', 'Calf Raise', 'legs'),
  seed('plank', 'Plank', 'core'),
  seed('hanging-leg-raise', 'Hanging Leg Raise', 'core'),
  seed('clean-and-press', 'Clean and Press', 'full-body'),
  seed('burpee', 'Burpee', 'full-body'),
  seed('rowing-machine', 'Rowing Machine', 'cardio'),
  seed('running', 'Running', 'cardio'),
];
