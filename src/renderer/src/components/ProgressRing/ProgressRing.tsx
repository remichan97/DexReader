import { ProgressVariant, ComponentSize, BaseComponentProps } from '@renderer/types/components'
import './ProgressRing.css'

export interface ProgressRingProps extends BaseComponentProps {
  /**
   * Progress value (0-100)
   * If undefined, shows indeterminate state
   */
  value?: number

  /**
   * Progress variant
   * @default 'default'
   */
  variant?: ProgressVariant

  /**
   * Size of the progress ring
   * @default 'medium'
   */
  size?: ComponentSize

  /**
   * Stroke width in pixels
   * @default 4
   */
  strokeWidth?: number

  /**
   * Whether the progress ring is animated
   * @default true
   */
  animated?: boolean
}

/**
 * Circular progress indicator component
 *
 * @example
 * ```tsx
 * // Determinate progress
 * <ProgressRing value={75} />
 *
 * // Indeterminate progress (loading spinner)
 * <ProgressRing />
 *
 * // Large spinner for full-page loading
 * <ProgressRing size="large" />
 * ```
 */
export function ProgressRing({
  value,
  variant = 'default',
  size = 'medium',
  strokeWidth = 4,
  animated = true,
  className = '',
  'aria-label': ariaLabel
}: ProgressRingProps): React.JSX.Element {
  const isIndeterminate = value === undefined
  const clampedValue = isIndeterminate ? 0 : Math.min(100, Math.max(0, value))

  // Size mapping
  const sizeMap = {
    small: 24,
    medium: 40,
    large: 64
  }

  const diameter = sizeMap[size]
  const radius = (diameter - strokeWidth * 2) / 2
  const circumference = 2 * Math.PI * radius
  const center = diameter / 2

  // Calculate stroke-dashoffset for determinate progress
  // Progress fills clockwise from top
  const offset = isIndeterminate ? 0 : circumference - (clampedValue / 100) * circumference

  const classNames = [
    'progress-ring',
    `progress-ring--${size}`,
    `progress-ring--${variant}`,
    isIndeterminate && 'progress-ring--indeterminate',
    animated && 'progress-ring--animated',
    className
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classNames}>
      <svg
        className="progress-ring__svg"
        width={diameter}
        height={diameter}
        viewBox={`0 0 ${diameter} ${diameter}`}
        role="progressbar"
        aria-label={ariaLabel || 'Progress'}
        aria-valuenow={isIndeterminate ? undefined : clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={isIndeterminate ? 'Loading...' : `${clampedValue}%`}
      >
        {/* Background circle */}
        <circle
          className="progress-ring__circle progress-ring__circle--bg"
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
        />

        {/* Progress circle */}
        <circle
          className="progress-ring__circle progress-ring__circle--progress"
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeDasharray={isIndeterminate ? undefined : circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
        />
      </svg>
    </div>
  )
}
