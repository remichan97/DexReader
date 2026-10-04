import { ProgressBar as FluentProgressBar } from '@fluentui/react-components'
import { ProgressVariant, ComponentSize, BaseComponentProps } from '@renderer/types/components'
import { useTranslation } from '@renderer/hooks/useTranslation'
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
  // Fluent's ProgressBar has no "disable animation" toggle, and no call site in this
  // codebase currently passes this prop - kept for API compatibility.
  className = '',
  'aria-label': ariaLabel
}: Readonly<ProgressBarProps>): React.JSX.Element {
  const { t } = useTranslation(['common'])
  const isIndeterminate = value === undefined
  const clampedValue = isIndeterminate ? 0 : Math.min(100, Math.max(0, value))

  // Determine variant based on progress
  let effectiveVariant = variant
  if (variant === 'default' && !isIndeterminate) {
    if (clampedValue >= 100) {
      effectiveVariant = 'success'
    }
  }
  const color = effectiveVariant === 'default' ? 'brand' : effectiveVariant

  const classNames = ['progress-bar', `progress-bar--${size}`, className].filter(Boolean).join(' ')

  const displayLabel = label || (showLabel && !isIndeterminate ? `${clampedValue}%` : undefined)
  const hasMetadata = speed || eta

  return (
    <div className={classNames}>
      {(displayLabel || hasMetadata) && (
        <div className="progress-bar__header flex items-center justify-between gap-2">
          {displayLabel && <div className="progress-bar__label">{displayLabel}</div>}
          {hasMetadata && (
            <div className="progress-bar__metadata flex items-center gap-2">
              {speed && <span className="progress-bar__speed">{speed}</span>}
              {speed && eta && <span className="progress-bar__separator">•</span>}
              {eta && <span className="progress-bar__eta">{eta}</span>}
            </div>
          )}
        </div>
      )}

      <FluentProgressBar
        value={isIndeterminate ? undefined : clampedValue / 100}
        color={color}
        thickness={size === 'small' ? 'medium' : 'large'}
        aria-label={ariaLabel || t('common:progress.defaultLabel')}
        aria-valuetext={
          isIndeterminate ? t('common:progress.loading') : displayLabel || `${clampedValue}%`
        }
      />
    </div>
  )
}
