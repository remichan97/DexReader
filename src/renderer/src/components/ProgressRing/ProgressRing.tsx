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
 * indeterminate-only) - this used to also support a determinate `value` prop via a
 * hand-rolled SVG ring, but no call site ever actually fed it a real value (the one
 * that tried, ImportProgressDialog, was wired to hardcoded current={0}/total={0} in
 * LibraryView, so it was permanently stuck indeterminate anyway), so that support was
 * dropped rather than carried over as dead API surface.
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
