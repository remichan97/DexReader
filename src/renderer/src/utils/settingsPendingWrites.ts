/**
 * Renderer-side writes to the settings:update-section IPC channel, for the autosave
 * migration (buffered save/discard -> immediate-apply).
 *
 * - `writeSettingsSection` is for discrete controls (toggles/Select/RadioGroup/
 *   NumberSpinner): write immediately, no debounce.
 * - `queueSettingsWrite`/`flushPendingSettingsWrites` are for the two continuous inputs
 *   (accent colour picker, custom cache size): debounce ~500ms and skip the write
 *   entirely while the value is invalid at commit time - the caller re-queues once it
 *   becomes valid again. Mirrors progressStore.ts's module-level pending-saves pattern,
 *   and is flushed via the same 'flush-pending-saves'/'flush-complete' handshake in
 *   App.tsx.
 *
 * Both paths share the same error handling: log + a user-facing toast on failure.
 *
 * Also the single choke point every settings write passes through, which makes it the
 * natural place to hang `subscribeToSettingsChange` - used by the restart-required
 * banner (SettingsView.tsx) to clear its "dismissed" state on any further edit, per the
 * settings-autosave migration plan's Phase 5 dismiss semantics. The same reset backs
 * `markRestartLeaveNudgeShown`/`hasRestartLeaveNudgeBeenShown` - a one-time native-dialog
 * nudge shown when leaving the Settings page with a restart-required field still stale,
 * tracked at module scope (not component state) so it survives SettingsView
 * unmounting/remounting across navigation, and resets the moment anything changes again.
 */

import { rendererLog } from '@renderer/services/logging.service'
import { useToastStore } from '@renderer/stores'
import { toError } from '@shared/utils/to-error.util'

const DEBOUNCE_MS = 500

const changeListeners = new Set<() => void>()

/**
 * Notified once per settings write initiated (immediate or queued), before the async
 * IPC round-trip - not once per successful persist. Returns an unsubscribe function.
 */
export function subscribeToSettingsChange(listener: () => void): () => void {
  changeListeners.add(listener)
  return () => changeListeners.delete(listener)
}

let hasShownRestartLeaveNudge = false

function notifySettingsChanged(): void {
  hasShownRestartLeaveNudge = false
  for (const listener of changeListeners) {
    listener()
  }
}

export function markRestartLeaveNudgeShown(): void {
  hasShownRestartLeaveNudge = true
}

export function hasRestartLeaveNudgeBeenShown(): boolean {
  return hasShownRestartLeaveNudge
}

function notifyWriteFailed(section: string, error: unknown): void {
  rendererLog.error(`[SettingsWrites] Failed to save section '${section}':`, toError(error))
  useToastStore.getState().show({
    variant: 'error',
    title: 'Failed to save setting',
    message: 'Your change could not be saved. Please try again.',
    duration: 5000
  })
}

/**
 * Write a settings section immediately - no debounce, no validity gate. Use for
 * discrete controls where every change is already a complete, valid value.
 */
export async function writeSettingsSection(section: string, value: unknown): Promise<void> {
  notifySettingsChanged()

  try {
    const response = await globalThis.settings.updateSection(section, value)
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to save setting')
    }
  } catch (error) {
    notifyWriteFailed(section, error)
  }
}

interface PendingSettingsWrite {
  section: string
  value: unknown
  isValid: () => boolean
  confirmBeforeWrite?: () => Promise<boolean>
}

const writeTimers = new Map<string, ReturnType<typeof setTimeout>>()
const pendingWrites = new Map<string, PendingSettingsWrite>()

async function commitWrite(pending: PendingSettingsWrite): Promise<void> {
  if (!pending.isValid()) {
    return
  }

  if (pending.confirmBeforeWrite && !(await pending.confirmBeforeWrite())) {
    return
  }

  await writeSettingsSection(pending.section, pending.value)
}

/**
 * @param confirmBeforeWrite - Optional async gate for a soft warning (e.g. "this value
 * is unusually high, proceed anyway?"), checked after `isValid` passes. Return false to
 * skip the write - unlike `isValid`, this may show a dialog, so it only runs once the
 * debounce has actually settled, not on every keystroke.
 */
export function queueSettingsWrite(
  key: string,
  section: string,
  value: unknown,
  isValid: () => boolean,
  confirmBeforeWrite?: () => Promise<boolean>
): void {
  notifySettingsChanged()

  const existingTimer = writeTimers.get(key)
  if (existingTimer) {
    clearTimeout(existingTimer)
  }

  pendingWrites.set(key, { section, value, isValid, confirmBeforeWrite })

  const timer = setTimeout(() => {
    writeTimers.delete(key)
    const pending = pendingWrites.get(key)
    if (!pending) return

    pendingWrites.delete(key)
    void commitWrite(pending)
  }, DEBOUNCE_MS)

  writeTimers.set(key, timer)
}

/**
 * Flush all pending debounced settings writes immediately.
 * Called before the app closes to ensure no in-flight edit is lost.
 */
export async function flushPendingSettingsWrites(): Promise<void> {
  for (const timer of writeTimers.values()) {
    clearTimeout(timer)
  }
  writeTimers.clear()

  const writes = Array.from(pendingWrites.entries())
  pendingWrites.clear()

  await Promise.all(writes.map(([, pending]) => commitWrite(pending)))
}
