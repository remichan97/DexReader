import { useKeyboardShortcuts } from '@renderer/hooks/useKeyboardShortcuts'

/**
 * Component wrapper that calls useKeyboardShortcuts hook.
 * This allows the hook to be used within the SecureNavigationProvider context.
 */
export function KeyboardShortcutsHandler(): null {
  useKeyboardShortcuts()
  return null
}
