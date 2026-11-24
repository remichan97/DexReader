import { ipcMain, IpcMainInvokeEvent } from 'electron'
import { serializeError } from './error/error-serializer'
import { mainLog } from '../services/logging/main-logging.service'
import { performance } from 'node:perf_hooks'
import { recordIpc } from '../perf/perf-probe'

type IpcHandler<T = unknown, R = unknown> = (
  event: IpcMainInvokeEvent,
  ...args: T[]
) => Promise<R> | R

export function wrapIpcHandler<T = unknown, R = unknown>(
  channel: string,
  handler: IpcHandler<T, R>
): void {
  ipcMain.handle(channel, async (event, ...args: T[]) => {
    const perfStart = performance.now() // PERF PROBE (throwaway)
    try {
      const result = await handler(event, ...args)
      return { success: true, data: result }
    } catch (error) {
      mainLog.error(`[IPC] Error in "${channel}":`, error)
      return { success: false, error: serializeError(error) }
    } finally {
      recordIpc(channel, performance.now() - perfStart)
    }
  })
}
