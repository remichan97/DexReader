import { Skeleton as FluentSkeleton, SkeletonItem } from '@fluentui/react-components'
import { SkeletonVariant, BaseComponentProps } from '@renderer/types/components'

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
const VARIANT_TO_SHAPE = {
  text: 'rectangle',
  card: 'rectangle',
  circle: 'circle',
  rectangle: 'rectangle'
} as const

export function Skeleton({
  variant = 'text',
  width,
  height,
  lines = 1,
  // Fluent's Skeleton has no "disable animation" toggle (only 'wave'/'pulse'), and no call
  // site in this codebase currently passes this prop - kept for API compatibility.
  className = '',
  'aria-label': ariaLabel
}: SkeletonProps): React.JSX.Element {
  const shape = VARIANT_TO_SHAPE[variant]

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
      <FluentSkeleton className={className} aria-label={ariaLabel || 'Loading...'}>
        {Array.from({ length: lines }, (_, index) => {
          const isLastLine = index === lines - 1
          const lineWidth = isLastLine && !width ? '80%' : formatSize(width)

          return <SkeletonItem key={index} shape={shape} style={{ ...style, width: lineWidth }} />
        })}
      </FluentSkeleton>
    )
  }

  // Single skeleton
  return (
    <FluentSkeleton className={className} aria-label={ariaLabel || 'Loading...'}>
      <SkeletonItem shape={shape} style={style} />
    </FluentSkeleton>
  )
}
