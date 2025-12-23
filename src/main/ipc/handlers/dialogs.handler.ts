import { getMainWindow } from '../../window'
import { wrapIpcHandler } from '../wrapHandler'

export function registerAdditionalDialogHandlers(): void {
  // IPC handler for confirm dialog
  // Simple yes/no confirmation dialog
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
          (cancelLabel as string | undefined) || 'Cancel',
          (confirmLabel as string | undefined) || 'OK'
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
