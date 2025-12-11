import { ErrorResponse } from 'react-router-dom'

export class MangaDexApiError extends Error {
  constructor(
    public message: string,
    public error?: ErrorResponse,
    public requestId?: string
  ) {
    super(`MangaDex API Error: ${message}`)
    this.name = 'MangaDexApiError'
  }
}

export class MangaDexNetworkError extends Error {
  constructor(
    public message: string,
    public url: string
  ) {
    super(`Network Error on ${url}: ${message}`)
    this.name = 'MangaDexNetworkError'
  }
}
