import { useMemo } from 'react';
import { SectionList, StyleSheet } from 'react-native';

import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { exercises, type ListResult } from '@/data/repository';
import { MUSCLE_GROUPS, type Exercise } from '@/data/types';
import { useFocusLoad } from '@/hooks/use-focus-load';
import { useTheme } from '@/hooks/use-theme';

const loadExercises = () => exercises.list();

function groupByMuscle(items: readonly Exercise[]) {
  return MUSCLE_GROUPS.map((group) => ({
    title: group,
    data: items.filter((e) => e.muscleGroup === group),
  })).filter((s) => s.data.length > 0);
}

export default function ExercisesScreen() {
  const state = useFocusLoad<ListResult<Exercise>>(loadExercises);
  const theme = useTheme();
  const items = state.status === 'ready' ? state.data.items : null;
  const sections = useMemo(() => (items ? groupByMuscle(items) : []), [items]);

  return (
    <Screen>
      <ThemedText type="subtitle">Exercises</ThemedText>
      {state.status === 'error' && (
        <ThemedText themeColor="textSecondary">Could not load exercises: {state.message}</ThemedText>
      )}
      {state.status === 'ready' && state.data.invalid.length > 0 && (
        <ThemedText themeColor="textSecondary">
          {state.data.invalid.length} stored exercise(s) are invalid and hidden.
        </ThemedText>
      )}
      <SectionList
        sections={sections}
        keyExtractor={(e) => e.id}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.header}>
            {section.title.toUpperCase()}
          </ThemedText>
        )}
        renderItem={({ item }) => (
          <ThemedView type="backgroundElement" style={[styles.row, { borderColor: theme.backgroundSelected }]}>
            <ThemedText>{item.name}</ThemedText>
          </ThemedView>
        )}
        ItemSeparatorComponent={Separator}
      />
    </Screen>
  );
}

function Separator() {
  return <ThemedView style={styles.separator} />;
}

const styles = StyleSheet.create({
  list: { paddingBottom: BottomTabInset + Spacing.four },
  header: { paddingTop: Spacing.three, paddingBottom: Spacing.two },
  row: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: StyleSheet.hairlineWidth,
  },
  separator: { height: Spacing.two, backgroundColor: 'transparent' },
});
