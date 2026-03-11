import { IpcResponse, ISerializeError } from '../../../preload/ipc.types'

export function isIpcSuccess<T>(
  response: IpcResponse<T>
): response is IpcResponse<T> & { success: true; data: T } {
  return response.success === true && response.data !== undefined
}

export function isIpcError<T>(
  response: IpcResponse<T>
): response is IpcResponse<T> & { success: false; error: ISerializeError } {
  return response.success === false && response.error !== undefined
}
