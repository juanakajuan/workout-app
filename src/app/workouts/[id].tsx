import { randomUUID } from 'expo-crypto';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useReducer, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { exercises, ValidationFailure, workouts } from '@/data/repository';
import { brand, type Exercise, type ExerciseId, type WorkoutId } from '@/data/types';
import {
  describeValidationError,
  draftFromWorkout,
  draftReducer,
  newDraft,
  toWorkoutInput,
  type Draft,
} from '@/features/workouts/draft';
import { useTheme } from '@/hooks/use-theme';

type Loaded = { draft: Draft; exercises: readonly Exercise[]; isNew: boolean };
type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | ({ status: 'ready' } & Loaded);

function leave() {
  if (router.canGoBack()) router.back();
  else router.replace('/workouts');
}

async function load(id: string, freshId: WorkoutId): Promise<Loaded> {
  const all = await exercises.list();
  if (id === 'new') return { draft: newDraft(freshId), exercises: all.items, isNew: true };
  const found = await workouts.get(brand<'WorkoutId'>(id));
  if (found === null) throw new Error('Workout not found.');
  if (!found.ok) throw new Error('This workout is stored in an invalid format.');
  return { draft: draftFromWorkout(found.value), exercises: all.items, isNew: false };
}

export default function WorkoutEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [freshId] = useState(() => brand<'WorkoutId'>(randomUUID()));
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    let current = true;
    load(id, freshId).then(
      (loaded) => current && setState({ status: 'ready', ...loaded }),
      (e: unknown) =>
        current &&
        setState({ status: 'error', message: e instanceof Error ? e.message : String(e) }),
    );
    return () => {
      current = false;
    };
  }, [id, freshId]);

  if (state.status === 'loading') {
    return (
      <Screen>
        <ThemedText themeColor="textSecondary">Loading…</ThemedText>
      </Screen>
    );
  }
  if (state.status === 'error') {
    return (
      <Screen>
        <ThemedText>{state.message}</ThemedText>
        <View style={styles.rowStart}>
          <Button label="Back" onPress={leave} />
        </View>
      </Screen>
    );
  }
  return <Editor initial={state.draft} exercises={state.exercises} isNew={state.isNew} />;
}

type EditorProps = { initial: Draft; exercises: readonly Exercise[]; isNew: boolean };

function Editor({ initial, exercises: catalog, isNew }: EditorProps) {
  const theme = useTheme();
  const [draft, dispatch] = useReducer(draftReducer, initial);
  const [error, setError] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const byId = useMemo(() => new Map(catalog.map((e) => [e.id, e])), [catalog]);

  async function save() {
    setBusy(true);
    try {
      await workouts.save(toWorkoutInput(draft));
      leave();
    } catch (e) {
      setError(e instanceof ValidationFailure ? describeValidationError(e.error) : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    setBusy(true);
    try {
      await workouts.delete(draft.id);
      leave();
    } catch (e) {
      setError(String(e));
      setBusy(false);
    }
  }

  return (
    <Screen>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
        <ThemedText type="subtitle">{isNew ? 'New workout' : 'Edit workout'}</ThemedText>

        <TextInput
          value={draft.name}
          onChangeText={(name) => dispatch({ type: 'rename', name })}
          placeholder="Workout name"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, inputColors(theme)]}
        />

        {draft.exercises.map((exercise, exerciseIndex) => (
          <ThemedView
            key={exerciseIndex}
            type="backgroundElement"
            style={styles.card}>
            <View style={styles.cardHeader}>
              <ThemedText type="smallBold" style={styles.flex}>
                {byId.get(exercise.exerciseId)?.name ?? 'Unknown exercise'}
              </ThemedText>
              <Button
                label="↑"
                disabled={exerciseIndex === 0}
                onPress={() => dispatch({ type: 'moveExercise', index: exerciseIndex, direction: -1 })}
              />
              <Button
                label="↓"
                disabled={exerciseIndex === draft.exercises.length - 1}
                onPress={() => dispatch({ type: 'moveExercise', index: exerciseIndex, direction: 1 })}
              />
              <Button
                label="Remove"
                variant="danger"
                onPress={() => dispatch({ type: 'removeExercise', index: exerciseIndex })}
              />
            </View>

            {exercise.sets.map((set, setIndex) => (
              <View key={setIndex} style={styles.setRow}>
                <ThemedText type="small" themeColor="textSecondary" style={styles.setLabel}>
                  Set {setIndex + 1}
                </ThemedText>
                <SetInput
                  label="reps"
                  value={set.reps}
                  keyboardType="number-pad"
                  onChange={(value) =>
                    dispatch({ type: 'editSet', exerciseIndex, setIndex, field: 'reps', value })
                  }
                />
                <SetInput
                  label="kg"
                  value={set.weightKg}
                  keyboardType="decimal-pad"
                  onChange={(value) =>
                    dispatch({ type: 'editSet', exerciseIndex, setIndex, field: 'weightKg', value })
                  }
                />
                <Button
                  label="✕"
                  variant="danger"
                  onPress={() => dispatch({ type: 'removeSet', exerciseIndex, setIndex })}
                />
              </View>
            ))}

            <View style={styles.rowStart}>
              <Button label="Add set" onPress={() => dispatch({ type: 'addSet', exerciseIndex })} />
            </View>
          </ThemedView>
        ))}

        <View style={styles.rowStart}>
          <Button label="Add exercise" onPress={() => setPicking(true)} />
        </View>

        {error !== null && <ThemedText style={styles.error}>{error}</ThemedText>}

        <View style={styles.actions}>
          <Button label="Save" variant="primary" disabled={busy} onPress={save} />
          <Button label="Cancel" disabled={busy} onPress={leave} />
          {!isNew && (
            <Button
              label={confirmingDelete ? 'Tap again to delete' : 'Delete'}
              variant="danger"
              disabled={busy}
              onPress={remove}
            />
          )}
        </View>
      </ScrollView>

      <ExercisePicker
        visible={picking}
        catalog={catalog}
        onClose={() => setPicking(false)}
        onPick={(exerciseId) => {
          dispatch({ type: 'addExercise', exerciseId });
          setPicking(false);
        }}
      />
    </Screen>
  );
}

function inputColors(theme: ReturnType<typeof useTheme>) {
  return { color: theme.text, backgroundColor: theme.backgroundSelected };
}

type SetInputProps = {
  label: string;
  value: string;
  keyboardType: 'number-pad' | 'decimal-pad';
  onChange: (value: string) => void;
};

function SetInput({ label, value, keyboardType, onChange }: SetInputProps) {
  const theme = useTheme();
  return (
    <View style={styles.setField}>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType}
        accessibilityLabel={label}
        style={[styles.input, styles.setInput, inputColors(theme)]}
      />
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
  );
}

type PickerProps = {
  visible: boolean;
  catalog: readonly Exercise[];
  onClose: () => void;
  onPick: (id: ExerciseId) => void;
};

function ExercisePicker({ visible, catalog, onClose, onPick }: PickerProps) {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalog.filter((e) => e.name.toLowerCase().includes(q));
  }, [catalog, query]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} onShow={() => setQuery('')}>
      <Screen style={styles.picker}>
        <View style={styles.cardHeader}>
          <ThemedText type="subtitle" style={styles.flex}>
            Add exercise
          </ThemedText>
          <Button label="Close" onPress={onClose} />
        </View>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search exercises"
          placeholderTextColor={theme.textSecondary}
          autoCorrect={false}
          style={[styles.input, inputColors(theme)]}
        />
        <FlatList
          data={matches}
          keyExtractor={(e) => e.id}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={<ThemedText themeColor="textSecondary">No matching exercises.</ThemedText>}
          renderItem={({ item }) => (
            <Pressable onPress={() => onPick(item.id)} style={({ pressed }) => pressed && styles.pressed}>
              <ThemedView type="backgroundElement" style={styles.pickerRow}>
                <ThemedText>{item.name}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {item.muscleGroup}
                </ThemedText>
              </ThemedView>
            </Pressable>
          )}
        />
      </Screen>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  picker: { gap: Spacing.three },
  scroll: { gap: Spacing.three, paddingBottom: Spacing.six },
  rowStart: { flexDirection: 'row', justifyContent: 'flex-start' },
  input: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  card: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.two },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, flexWrap: 'wrap' },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  setLabel: { width: 48 },
  setField: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  setInput: { flex: 1, minWidth: 0, textAlign: 'center' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  error: { color: '#d92d20' },
  pickerRow: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    marginBottom: Spacing.two,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pressed: { opacity: 0.7 },
});
