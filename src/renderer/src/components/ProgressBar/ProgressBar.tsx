import { ProgressVariant, ComponentSize, BaseComponentProps } from '@renderer/types/components'
import './ProgressBar.css'

export interface ProgressBarProps extends BaseComponentProps {
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
   * Size of the progress bar
   * @default 'medium'
   */
  size?: ComponentSize

  /**
   * Show label with percentage
   * @default false
   */
  showLabel?: boolean

  /**
   * Custom label text (overrides percentage)
   */
  label?: string

  /**
   * Show download speed
   */
  speed?: string

  /**
   * Show estimated time remaining
   */
  eta?: string

  /**
   * Whether the progress bar is animated
   * @default true
   */
  animated?: boolean
}

/**
 * Linear progress indicator component
 *
 * @example
 * ```tsx
 * // Determinate progress
 * <ProgressBar value={75} showLabel />
 *
 * // Indeterminate progress
 * <ProgressBar />
 *
 * // Download progress
 * <ProgressBar
 *   value={45}
 *   showLabel
 *   speed="2.5 MB/s"
 *   eta="30s remaining"
 * />
 * ```
 */
export function ProgressBar({
  value,
  variant = 'default',
  size = 'medium',
  showLabel = false,
  label,
  speed,
  eta,
  animated = true,
  className = '',
  'aria-label': ariaLabel
}: ProgressBarProps): React.JSX.Element {
  const isIndeterminate = value === undefined
  const clampedValue = isIndeterminate ? 0 : Math.min(100, Math.max(0, value))

  // Determine variant based on progress
  let effectiveVariant = variant
  if (variant === 'default' && !isIndeterminate) {
    if (clampedValue >= 100) {
      effectiveVariant = 'success'
    }
  }

  const classNames = [
    'progress-bar',
    `progress-bar--${size}`,
    isIndeterminate && 'progress-bar--indeterminate',
    animated && 'progress-bar--animated',
    className
  ]
    .filter(Boolean)
    .join(' ')

  const trackClassNames = ['progress-bar__track', `progress-bar__track--${effectiveVariant}`].join(
    ' '
  )

  const fillClassNames = [
    'progress-bar__fill',
    `progress-bar__fill--${effectiveVariant}`,
    isIndeterminate && 'progress-bar__fill--indeterminate'
  ]
    .filter(Boolean)
    .join(' ')

  const displayLabel = label || (showLabel && !isIndeterminate ? `${clampedValue}%` : undefined)
  const hasMetadata = speed || eta

  return (
    <div className={classNames}>
      {(displayLabel || hasMetadata) && (
        <div className="progress-bar__header">
          {displayLabel && <div className="progress-bar__label">{displayLabel}</div>}
          {hasMetadata && (
            <div className="progress-bar__metadata">
              {speed && <span className="progress-bar__speed">{speed}</span>}
              {speed && eta && <span className="progress-bar__separator">•</span>}
              {eta && <span className="progress-bar__eta">{eta}</span>}
            </div>
          )}
        </div>
      )}

      <div
        className={trackClassNames}
        role="progressbar"
        aria-label={ariaLabel || 'Progress'}
        aria-valuenow={isIndeterminate ? undefined : clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={isIndeterminate ? 'Loading...' : displayLabel || `${clampedValue}%`}
      >
        <div
          className={fillClassNames}
          style={
            isIndeterminate
              ? undefined
              : {
                  width: `${clampedValue}%`
                }
          }
        />
      </div>
    </div>
  )
}
