import { SkeletonVariant, BaseComponentProps } from '@renderer/types/components'
import './Skeleton.css'

export interface SkeletonProps extends BaseComponentProps {
  /**
   * Skeleton variant
   * @default 'text'
   */
  variant?: SkeletonVariant

  /**
   * Width (CSS value or number in pixels)
   */
  width?: string | number

  /**
   * Height (CSS value or number in pixels)
   */
  height?: string | number

  /**
   * Number of lines (for text variant)
   * @default 1
   */
  lines?: number

  /**
   * Disable shimmer animation
   */
  noAnimation?: boolean
}

/**
 * Skeleton loading placeholder with shimmer animation
 *
 * @example
 * ```tsx
 * // Text skeleton
 * <Skeleton variant="text" width="200px" />
 * <Skeleton variant="text" lines={3} />
 *
 * // Card skeleton
 * <Skeleton variant="card" />
 *
 * // Circle skeleton (avatar)
 * <Skeleton variant="circle" width={48} height={48} />
 *
 * // Custom rectangle
 * <Skeleton variant="rectangle" width="100%" height={200} />
 * ```
 */
export function Skeleton({
  variant = 'text',
  width,
  height,
  lines = 1,
  noAnimation = false,
  className = '',
  'aria-label': ariaLabel
}: SkeletonProps): React.JSX.Element {
  const classNames = [
    'skeleton',
    `skeleton--${variant}`,
    noAnimation && 'skeleton--no-animation',
    className
  ]
    .filter(Boolean)
    .join(' ')

  const formatSize = (size: string | number | undefined): string | undefined => {
    if (size === undefined) return undefined
    return typeof size === 'number' ? `${size}px` : size
  }

  const style: React.CSSProperties = {
    width: formatSize(width),
    height: formatSize(height)
  }

  // Text variant with multiple lines
  if (variant === 'text' && lines > 1) {
    return (
      <div
        className="skeleton-group"
        role="status"
        aria-busy="true"
        aria-label={ariaLabel || 'Loading...'}
      >
        {Array.from({ length: lines }, (_, index) => {
          const isLastLine = index === lines - 1
          const lineWidth = isLastLine && !width ? '80%' : formatSize(width)

          return (
            <div
              key={index}
              className={classNames}
              style={{ ...style, width: lineWidth }}
              aria-hidden="true"
            />
          )
        })}
      </div>
    )
  }

  // Single skeleton
  return (
    <div
      className={classNames}
      style={style}
      role="status"
      aria-busy="true"
      aria-label={ariaLabel || 'Loading...'}
    />
  )
}
