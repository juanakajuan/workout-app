import { Platform, StyleSheet, View, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MaxContentWidth, Spacing } from '@/constants/theme';

import { ThemedView } from './themed-view';

// The web tab bar floats over the page, so web reserves its height instead of using safe-area insets.
export function Screen({ children, style, ...rest }: ViewProps) {
  const insets = useSafeAreaInsets();
  const paddingTop = Platform.OS === 'web' ? Spacing.six + Spacing.three : insets.top + Spacing.three;

  return (
    <ThemedView style={[styles.root, { paddingTop }]}>
      <View style={[styles.content, style]} {...rest}>
        {children}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
  },
});
