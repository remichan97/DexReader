import { ipcMain, IpcMainInvokeEvent } from 'electron'
import { serializeError } from './error/error-serializer'
import { mainLog } from '../services/logging/main-logging.service'

type IpcHandler<T = unknown, R = unknown> = (
  event: IpcMainInvokeEvent,
  ...args: T[]
) => Promise<R> | R

export function wrapIpcHandler<T = unknown, R = unknown>(
  channel: string,
  handler: IpcHandler<T, R>
): void {
  ipcMain.handle(channel, async (event, ...args: T[]) => {
    try {
      const result = await handler(event, ...args)
      return { success: true, data: result }
    } catch (error) {
      mainLog.error(`[IPC] Error in "${channel}":`, error)
      return { success: false, error: serializeError(error) }
    }
  })
}
