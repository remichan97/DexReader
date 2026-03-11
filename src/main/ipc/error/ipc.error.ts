export class IpcError extends Error {
  constructor(
    public code: string,
    message?: string,
    public details?: unknown
  ) {
    super(message)
    this.name = 'IpcError'
  }
}
