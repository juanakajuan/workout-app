import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

export type LoadState<T> =
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly message: string }
  | { readonly status: 'ready'; readonly data: T };

/** Runs `load` each time the screen gains focus. `load` must be a stable reference. */
export function useFocusLoad<T>(load: () => Promise<T>): LoadState<T> {
  const [state, setState] = useState<LoadState<T>>({ status: 'loading' });

  useFocusEffect(
    useCallback(() => {
      let current = true;
      load().then(
        (data) => current && setState({ status: 'ready', data }),
        (e: unknown) =>
          current &&
          setState({ status: 'error', message: e instanceof Error ? e.message : String(e) }),
      );
      return () => {
        current = false;
      };
    }, [load]),
  );

  return state;
}
