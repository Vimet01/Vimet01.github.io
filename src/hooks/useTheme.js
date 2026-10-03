import { useSyncExternalStore } from 'react'
import { getTheme, subscribeTheme } from '../lib/theme'

/** Current colour theme, 'light' or 'dark'. Re-renders when it changes. */
export default function useTheme() {
  return useSyncExternalStore(subscribeTheme, getTheme, () => 'dark')
}
