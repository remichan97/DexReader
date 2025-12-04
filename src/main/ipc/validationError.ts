import { IpcError } from './error'

export class ValidationError extends IpcError {
  constructor(field: string, reason: string) {
    super('VALIDATION_ERROR', `Validation failed for field "${field}": ${reason}`, {
      field,
      reason
    })
  }
}
