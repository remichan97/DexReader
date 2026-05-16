import { getMainWindow, setHasUnsavedChanges } from '../../window'
import { wrapIpcHandler } from '../wrap-handler'
import i18next from '../../i18n/i18n.config'

export function registerAdditionalDialogHandlers(): void {
  /**
   * Notify main process about unsaved changes state.
   *
   * Updates the window's unsaved changes flag, which affects the behavior of the
   * window close button (shows confirmation dialog if there are unsaved changes).
   * Used to prevent accidental data loss.
   *
   * @param hasChanges - True if there are unsaved changes, false otherwise
   * @returns Promise<boolean> - Always returns true
   *
   * @example
   * // Mark form as having unsaved changes
   * await window.api.setHasUnsavedChanges(true)
   *
   * @example
   * // Clear unsaved changes flag after save
   * await window.api.setHasUnsavedChanges(false)
   */
  wrapIpcHandler('set-has-unsaved-changes', async (_event, hasChanges: unknown) => {
    setHasUnsavedChanges(Boolean(hasChanges))
    return true
  })

  /**
   * Show a native confirmation dialog (Yes/No or custom labels).
   *
   * Displays a modal warning dialog with two buttons. Returns true if user confirms
   * (clicks confirm button), false if cancelled. Blocking - waits for user response.
   *
   * @param message - Main dialog message (required)
   * @param detail - Optional detailed message shown below main message
   * @param confirmLabel - Label for confirm button (default: 'OK')
   * @param cancelLabel - Label for cancel button (default: 'Cancel')
   * @returns Promise<boolean> - True if user confirmed, false if cancelled or window unavailable
   *
   * @example
   * // Simple yes/no confirmation
   * const confirmed = await window.api.showConfirmDialog(
   *   'Delete this manga?',
   *   'This will remove it from your library.'
   * )
   * if (confirmed) {
   *   // Proceed with deletion
   * }
   *
   * @example
   * // Custom button labels
   * const confirmed = await window.api.showConfirmDialog(
   *   'Unsaved changes',
   *   'Do you want to save before closing?',
   *   'Save',
   *   'Discard'
   * )
   */
  wrapIpcHandler(
    'show-confirm-dialog',
    async (
      _event,
      message: unknown,
      detail?: unknown,
      confirmLabel?: unknown,
      cancelLabel?: unknown
    ) => {
      const mainWindow = getMainWindow()
      if (!mainWindow) return false

      const { dialog } = await import('electron')
      const result = await dialog.showMessageBox(mainWindow, {
        type: 'warning',
        buttons: [
          (cancelLabel as string | undefined) || i18next.t('common:button.cancel'),
          (confirmLabel as string | undefined) || i18next.t('common:button.ok')
        ],
        defaultId: 1,
        cancelId: 0,
        message: message as string,
        detail: detail as string | undefined,
        noLink: true
      })

      return result.response === 1
    }
  )

  /**
   * Show a customizable native dialog with multiple options.
   *
   * Displays a modal dialog with full customization: message type (info/error/warning),
   * custom buttons, default selection, and optional checkbox. Returns the button index
   * clicked and checkbox state.
   *
   * @param options - Dialog configuration object
   * @param options.message - Main dialog message (required)
   * @param options.detail - Optional detailed message
   * @param options.buttons - Array of button labels (default: ['OK', 'Cancel'])
   * @param options.type - Dialog type: 'none' | 'info' | 'error' | 'question' | 'warning' (default: 'question')
   * @param options.defaultId - Index of default focused button (default: 0)
   * @param options.cancelId - Index of cancel button for Escape key (default: last button)
   * @param options.noLink - If true, prevents buttons from being rendered as links on macOS (default: false)
   * @param options.checkboxLabel - Optional checkbox label
   * @param options.checkboxChecked - Initial checkbox state (default: false)
   * @returns Promise<{response: number, checkboxChecked: boolean}> - Button index clicked and checkbox state, or {response: -1, checkboxChecked: false} if window unavailable
   *
   * @example
   * // Three-button dialog with checkbox
   * const result = await window.api.showDialog({
   *   type: 'warning',
   *   message: 'Update available',
   *   detail: 'Version 2.0 is ready to install.',
   *   buttons: ['Install Now', 'Remind Later', 'Skip This Version'],
   *   defaultId: 0,
   *   cancelId: 1,
   *   checkboxLabel: 'Download updates automatically',
   *   checkboxChecked: true
   * })
   *
   * if (result.response === 0) {
   *   // Install now
   * } else if (result.response === 2) {
   *   // Skip version
   * }
   * console.log('Auto-download:', result.checkboxChecked)
   *
   * @example
   * // Simple error dialog
   * await window.api.showDialog({
   *   type: 'error',
   *   message: 'Failed to save settings',
   *   detail: 'Check disk space and permissions.',
   *   buttons: ['OK']
   * })
   */
  wrapIpcHandler(
    'show-dialog',
    async (
      _event,
      options: {
        message: string
        detail?: string
        buttons?: string[]
        type?: 'none' | 'info' | 'error' | 'question' | 'warning'
        defaultId?: number
        cancelId?: number
        noLink?: boolean
        checkboxLabel?: string
        checkboxChecked?: boolean
      }
    ) => {
      const mainWindow = getMainWindow()
      if (!mainWindow) {
        return { response: -1, checkboxChecked: false }
      }

      const { dialog } = await import('electron')
      const result = await dialog.showMessageBox(mainWindow, {
        type: options.type || 'question',
        buttons: options.buttons || ['OK', 'Cancel'],
        defaultId: options.defaultId ?? 0,
        cancelId: options.cancelId ?? (options.buttons?.length ?? 1) - 1,
        message: options.message,
        detail: options.detail,
        noLink: options.noLink ?? false,
        checkboxLabel: options.checkboxLabel,
        checkboxChecked: options.checkboxChecked ?? false
      })

      return {
        response: result.response,
        checkboxChecked: result.checkboxChecked
      }
    }
  )
}
