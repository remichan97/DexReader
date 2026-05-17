import { JSX } from 'react'
import { useTranslation } from '@renderer/hooks/useTranslation'
import { ProgressRing } from '../ProgressRing'
import { SkeletonGrid } from '../Skeleton'
import './LoadingState.css'

export interface LoadingStateProps {
  /**
   * Optional loading message
   * @example "Loading history..."
   */
  message?: string

  /**
   * Size of the loading indicator
   * @default 'large'
   */
  size?: 'small' | 'medium' | 'large'

  /**
   * Loading state variant
   * - 'spinner': Shows a ProgressRing with optional message
   * - 'skeleton': Shows a SkeletonGrid for content loading
   * @default 'spinner'
   */
  variant?: 'spinner' | 'skeleton'

  /**
   * Number of skeleton items to show (only for 'skeleton' variant)
   * @default 12
   */
  skeletonCount?: number
}

/**
 * LoadingState component for consistent loading UX
 *
 * Provides unified loading indicators across views with either
 * a spinner (ProgressRing) or skeleton grid for content placeholders.
 *
 * @example
 * // Spinner with message
 * <LoadingState message="Loading history..." />
 *
 * @example
 * // Skeleton grid for content
 * <LoadingState variant="skeleton" skeletonCount={12} />
 *
 * @example
 * // Small spinner without message
 * <LoadingState size="small" />
 */
export function LoadingState({
  message,
  size = 'large',
  variant = 'spinner',
  skeletonCount = 12
}: Readonly<LoadingStateProps>): JSX.Element {
  const { t } = useTranslation()

  if (variant === 'skeleton') {
    return <SkeletonGrid count={skeletonCount} />
  }

  return (
    <div className="loading-state" role="status" aria-live="polite">
      <ProgressRing size={size} aria-label={message || t('state.loading')} />
      {message && <p className="loading-state__message">{message}</p>}
    </div>
  )
}
