import { Pressable, StyleSheet } from 'react-native';

import { Spacing } from '@/constants/theme';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

const DANGER = '#d92d20';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
};

export function Button({ label, onPress, variant = 'secondary', disabled = false }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => (pressed || disabled) && styles.dimmed}>
      <ThemedView
        type={variant === 'primary' ? 'text' : 'backgroundSelected'}
        style={styles.button}>
        <ThemedText
          type="smallBold"
          themeColor={variant === 'primary' ? 'background' : 'text'}
          style={variant === 'danger' && { color: DANGER }}>
          {label}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  dimmed: { opacity: 0.6 },
});
