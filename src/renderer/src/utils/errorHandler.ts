import { useToastStore } from '@renderer/stores'

interface ErrorLogEntry {
  timestamp: string
  type: 'error' | 'unhandledRejection'
  message: string
  stack?: string
  url?: string
  line?: number
  column?: number
}

class GlobalErrorHandler {
  private errorLog: ErrorLogEntry[] = []
  private readonly maxLogSize = 50

  initialize(): void {
    // Catch uncaught exceptions
    globalThis.onerror = (message, source, lineno, colno, error) => {
      this.handleError({
        type: 'error',
        timestamp: new Date().toISOString(),
        message: typeof message === 'string' ? message : JSON.stringify(message),
        stack: error?.stack,
        url: source,
        line: lineno,
        column: colno
      })
      return true // Prevent default browser error handling
    }

    // Catch unhandled promise rejections
    globalThis.onunhandledrejection = (event) => {
      this.handleError({
        type: 'unhandledRejection',
        timestamp: new Date().toISOString(),
        message: event.reason?.message || JSON.stringify(event.reason),
        stack: event.reason?.stack
      })
      event.preventDefault()
    }
  }

  private handleError(entry: ErrorLogEntry): void {
    console.error('[Global Error]', entry)

    // Add to log (circular buffer)
    this.errorLog.push(entry)
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift()
    }

    // Show user-friendly toast
    const toast = useToastStore.getState()
    toast.show({
      variant: 'error',
      title: 'Something went wrong',
      message: this.getUserFriendlyMessage(entry.message),
      duration: 5000
    })

    // Future: Send to crash reporting service (Phase 6)
  }

  private getUserFriendlyMessage(technicalMessage: string): string {
    // Map technical errors to user-friendly messages (casual tone)
    if (technicalMessage.includes('network') || technicalMessage.includes('fetch')) {
      return 'Check your internet connection and give it another shot.'
    }
    if (technicalMessage.includes('ENOENT') || technicalMessage.includes('file not found')) {
      return "Can't find that file. Maybe it was moved or deleted?"
    }
    if (technicalMessage.includes('EACCES') || technicalMessage.includes('permission denied')) {
      return "Don't have permission to access that. Check your file permissions."
    }
    if (technicalMessage.includes('ENOSPC') || technicalMessage.includes('disk space')) {
      return 'Running out of space. Clear some room and try again.'
    }
    if (technicalMessage.includes('timeout')) {
      return 'That took too long. Try again?'
    }
    if (technicalMessage.includes('parse') || technicalMessage.includes('JSON')) {
      return 'Got some garbled data. Try reloading.'
    }
    return "Well, that's weird. Try again or restart the app if it keeps happening."
  }

  getErrorLog(): ErrorLogEntry[] {
    return [...this.errorLog]
  }

  clearErrorLog(): void {
    this.errorLog = []
  }
}

export const globalErrorHandler = new GlobalErrorHandler()
export type { ErrorLogEntry }
