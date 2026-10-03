export interface ISerializeError {
  name: string
  message: string
  code?: string
  details?: unknown
  stack?: string
}

export interface IpcResponse<T = unknown> {
  success: boolean
  data?: T
  error?: ISerializeError
}
