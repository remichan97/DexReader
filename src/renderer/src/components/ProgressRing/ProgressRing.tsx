import { Spinner } from '@fluentui/react-components'
import { ComponentSize, BaseComponentProps } from '@renderer/types/components'

export interface ProgressRingProps extends BaseComponentProps {
  /**
   * Size of the spinner
   * @default 'medium'
   */
  size?: ComponentSize
}

/**
 * Indeterminate circular loading indicator.
 *
 * Fluent has no determinate circular/ring progress component (its Spinner is
 * indeterminate-only), so there is no `value` prop. Use `ProgressBar` for known progress.
 *
 * @example
 * ```tsx
 * <ProgressRing size="large" />
 * ```
 */
export function ProgressRing({
  size = 'medium',
  className = '',
  'aria-label': ariaLabel
}: ProgressRingProps): React.JSX.Element {
  return <Spinner size={size} className={className} aria-label={ariaLabel || 'Loading'} />
}
