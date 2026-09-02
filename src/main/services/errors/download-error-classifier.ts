/**
 * Download Error Classification System
 *
 * Categorizes errors to determine retry eligibility and user messaging.
 * Prevents wasteful retries on permanent errors (disk full, 404, etc.)
 */

import { MangaDexApiError, MangaDexNetworkError } from '../../api/shared/error.shared'
import { toError } from '@shared/utils/to-error.util'
import { DownloadErrorCategory } from './enums/download-error.enum'

export interface ErrorClassification {
  category: DownloadErrorCategory
  isRetryable: boolean
  userMessage: string
  suggestedDelayMs?: number // For rate limits with Retry-After header
  requiresUserAction: boolean // True if user needs to fix something (disk space, permissions)
}

/**
 * Classify an error to determine retry behavior
 *
 * @param error - The error thrown during download
 * @returns Classification with retry decision and user-friendly message
 */
export function classifyDownloadError(error: unknown): ErrorClassification {
  // Handle custom API errors
  if (error instanceof MangaDexNetworkError) {
    return {
      category: DownloadErrorCategory.TRANSIENT_NETWORK,
      isRetryable: true,
      userMessage: 'Network connection issue. Retrying...',
      requiresUserAction: false
    }
  }

  if (error instanceof MangaDexApiError) {
    return classifyApiError(error)
  }

  // Handle Node.js filesystem errors
  if (isNodeError(error)) {
    return classifyFilesystemError(error)
  }

  // Handle generic Error objects by message content
  const errorMessage = toError(error).message

  // Check for rate limit patterns
  if (errorMessage.includes('429') || errorMessage.toLowerCase().includes('rate limit')) {
    return {
      category: DownloadErrorCategory.RATE_LIMIT,
      isRetryable: true,
      userMessage: 'Too many requests. Slowing down downloads...',
      requiresUserAction: false
    }
  }

  // Check for Not Found patterns
  if (
    errorMessage.includes('404') ||
    errorMessage.toLowerCase().includes('not found') ||
    errorMessage.includes('Failed to fetch chapter metadata')
  ) {
    return {
      category: DownloadErrorCategory.PERMANENT_API,
      isRetryable: false,
      userMessage: 'This chapter is no longer available on MangaDex.',
      requiresUserAction: false
    }
  }

  // Check for filesystem error keywords in message
  if (errorMessage.includes('ENOSPC')) {
    return {
      category: DownloadErrorCategory.PERMANENT_FILESYSTEM,
      isRetryable: false,
      userMessage: 'Not enough disk space. Free up space and try again.',
      requiresUserAction: true
    }
  }

  if (errorMessage.includes('EPERM') || errorMessage.includes('EACCES')) {
    return {
      category: DownloadErrorCategory.PERMANENT_FILESYSTEM,
      isRetryable: false,
      userMessage: 'Permission denied. Check folder access rights.',
      requiresUserAction: true
    }
  }

  // Default: unknown error, retry conservatively
  return {
    category: DownloadErrorCategory.UNKNOWN,
    isRetryable: true,
    userMessage: 'Download failed. Retrying...',
    requiresUserAction: false
  }
}

/**
 * Classify MangaDex API errors based on error details
 */
function classifyApiError(error: MangaDexApiError): ErrorClassification {
  const statusCode = error.statusCode
  const errorString = JSON.stringify(error.error || {})

  // Rate limit (429) - retryable with suggested delay from Retry-After header
  if (
    statusCode === 429 ||
    errorString.includes('429') ||
    error.message.toLowerCase().includes('rate limit')
  ) {
    const suggestedDelayMs = error.retryAfterSeconds ? error.retryAfterSeconds * 1000 : undefined
    return {
      category: DownloadErrorCategory.RATE_LIMIT,
      isRetryable: true,
      userMessage: 'Too many requests. Slowing down downloads...',
      suggestedDelayMs,
      requiresUserAction: false
    }
  }

  // Not Found (404), Gone (410) - chapter deleted, not retryable
  if (
    statusCode === 404 ||
    statusCode === 410 ||
    errorString.includes('404') ||
    errorString.includes('410') ||
    error.message.toLowerCase().includes('not found')
  ) {
    return {
      category: DownloadErrorCategory.PERMANENT_API,
      isRetryable: false,
      userMessage: 'This chapter is no longer available on MangaDex.',
      requiresUserAction: false
    }
  }

  // Forbidden (403) - permissions issue, not retryable
  if (
    statusCode === 403 ||
    errorString.includes('403') ||
    error.message.toLowerCase().includes('forbidden')
  ) {
    return {
      category: DownloadErrorCategory.PERMANENT_API,
      isRetryable: false,
      userMessage: 'Access forbidden. This chapter may be restricted.',
      requiresUserAction: false
    }
  }

  // Server errors (5xx) - transient, retryable
  if (
    (statusCode && statusCode >= 500 && statusCode < 600) ||
    errorString.includes('500') ||
    errorString.includes('502') ||
    errorString.includes('503')
  ) {
    return {
      category: DownloadErrorCategory.TRANSIENT_SERVER,
      isRetryable: true,
      userMessage: 'Server temporarily unavailable. Retrying...',
      requiresUserAction: false
    }
  }

  // Default API error - could be transient
  return {
    category: DownloadErrorCategory.TRANSIENT_SERVER,
    isRetryable: true,
    userMessage: 'API error. Retrying...',
    requiresUserAction: false
  }
}

/**
 * Classify Node.js filesystem errors
 */
function classifyFilesystemError(error: NodeJS.ErrnoException): ErrorClassification {
  switch (error.code) {
    case 'ENOSPC':
      return {
        category: DownloadErrorCategory.PERMANENT_FILESYSTEM,
        isRetryable: false,
        userMessage: 'Not enough disk space. Free up space and try again.',
        requiresUserAction: true
      }

    case 'EPERM':
    case 'EACCES':
      return {
        category: DownloadErrorCategory.PERMANENT_FILESYSTEM,
        isRetryable: false,
        userMessage: 'Permission denied. Check folder access rights.',
        requiresUserAction: true
      }

    case 'EROFS':
      return {
        category: DownloadErrorCategory.PERMANENT_FILESYSTEM,
        isRetryable: false,
        userMessage: 'File system is read-only. Cannot save downloads.',
        requiresUserAction: true
      }

    case 'ENOENT':
      // Missing directory - might be fixable by recreating
      return {
        category: DownloadErrorCategory.PERMANENT_FILESYSTEM,
        isRetryable: false,
        userMessage: 'Download folder not found. Check downloads path in settings.',
        requiresUserAction: true
      }

    case 'EMFILE':
    case 'ENFILE':
      // Too many open files - transient, system will recover
      return {
        category: DownloadErrorCategory.TRANSIENT_SERVER,
        isRetryable: true,
        userMessage: 'Too many files open. Retrying...',
        requiresUserAction: false
      }

    default:
      // Unknown filesystem error, don't retry to be safe
      return {
        category: DownloadErrorCategory.PERMANENT_FILESYSTEM,
        isRetryable: false,
        userMessage: `File system error: ${error.code || 'unknown'}. Check downloads folder.`,
        requiresUserAction: true
      }
  }
}

/**
 * Type guard for Node.js errors with errno codes
 */
function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as NodeJS.ErrnoException).code === 'string'
  )
}

/**
 * Get user-friendly error summary for logging/debugging
 */
export function getErrorSummary(error: unknown): string {
  const classification = classifyDownloadError(error)

  if (error instanceof Error) {
    return `[${classification.category}] ${error.name}: ${error.message}`
  }

  const errorStr =
    typeof error === 'object' && error !== null ? JSON.stringify(error) : String(error)
  return `[${classification.category}] ${errorStr}`
}
