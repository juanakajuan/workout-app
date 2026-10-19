import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { workouts, type ListResult } from '@/data/repository';
import type { Workout } from '@/data/types';
import { useFocusLoad } from '@/hooks/use-focus-load';

const loadWorkouts = () => workouts.list();

export default function WorkoutsScreen() {
  const state = useFocusLoad<ListResult<Workout>>(loadWorkouts);

  return (
    <Screen>
      <View style={styles.titleRow}>
        <ThemedText type="subtitle">Workouts</ThemedText>
        <Button
          label="New workout"
          variant="primary"
          onPress={() => router.push({ pathname: '/workouts/[id]', params: { id: 'new' } })}
        />
      </View>
      {state.status === 'error' && (
        <ThemedText themeColor="textSecondary">Could not load workouts: {state.message}</ThemedText>
      )}
      {state.status === 'ready' && state.data.invalid.length > 0 && (
        <ThemedText themeColor="textSecondary">
          {state.data.invalid.length} stored workout(s) are invalid and hidden.
        </ThemedText>
      )}
      {state.status === 'ready' && state.data.items.length === 0 && (
        <ThemedText themeColor="textSecondary">No workouts yet. Create your first template.</ThemedText>
      )}
      <FlatList
        data={state.status === 'ready' ? state.data.items : []}
        keyExtractor={(w) => w.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={Separator}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push({ pathname: '/workouts/[id]', params: { id: item.id } })}
            style={({ pressed }) => pressed && styles.pressed}>
            <ThemedView type="backgroundElement" style={styles.row}>
              <ThemedText>{item.name}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {item.exercises.length} {item.exercises.length === 1 ? 'exercise' : 'exercises'}
              </ThemedText>
            </ThemedView>
          </Pressable>
        )}
      />
    </Screen>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
    paddingBottom: Spacing.three,
  },
  list: { paddingBottom: BottomTabInset + Spacing.four },
  row: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  separator: { height: Spacing.two },
  pressed: { opacity: 0.7 },
});
