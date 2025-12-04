import { ipcMain, IpcMainInvokeEvent } from 'electron'
import { serialiseError } from './errorSerialiser'

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
      console.error(`[IPC Error] "${channel}":`, error)
      return { success: false, error: serialiseError(error) }
    }
  })
}
