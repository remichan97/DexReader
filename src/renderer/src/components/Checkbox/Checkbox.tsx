import { Checkbox as FluentCheckbox } from '@fluentui/react-components'
import { BaseComponentProps, DisableableProps } from '@renderer/types/components'

export interface CheckboxProps extends BaseComponentProps, DisableableProps {
  /**
   * Whether the checkbox is checked
   */
  checked: boolean

  /**
   * Change handler
   */
  onChange: (checked: boolean) => void

  /**
   * Label text
   */
  label?: string

  /**
   * Indeterminate state (partially checked)
   * @default false
   */
  indeterminate?: boolean

  /**
   * Name attribute for form submission
   */
  name?: string

  /**
   * Value attribute for form submission
   */
  value?: string
}

/**
 * Checkbox component with Windows 11 Fluent Design
 *
 * @example
 * ```tsx
 * <Checkbox
 *   checked={agreed}
 *   onChange={setAgreed}
 *   label="I agree to the terms"
 * />
 * ```
 */
export function Checkbox({
  checked,
  onChange,
  label,
  indeterminate = false,
  disabled = false,
  name,
  value,
  className = '',
  'aria-label': ariaLabel
}: Readonly<CheckboxProps>): React.JSX.Element {
  return (
    <FluentCheckbox
      checked={indeterminate ? 'mixed' : checked}
      onChange={(_ev, data) => onChange(data.checked === true)}
      label={label}
      disabled={disabled}
      name={name}
      value={value}
      className={className}
      aria-label={ariaLabel || label}
    />
  )
}
