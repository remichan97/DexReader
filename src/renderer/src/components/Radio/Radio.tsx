import { Radio as FluentRadio, tokens } from '@fluentui/react-components'
import { BaseComponentProps, DisableableProps } from '@renderer/types/components'

export interface RadioProps extends BaseComponentProps, DisableableProps {
  /**
   * Radio button value
   */
  value: string

  /**
   * Whether this radio is selected
   * (auto-set by RadioGroup)
   */
  checked?: boolean

  /**
   * Change handler - receives the value when selected
   * (auto-set by RadioGroup)
   */
  onChange?: (value: string) => void

  /**
   * Label text
   */
  label?: string

  /**
   * Description text below the label
   */
  description?: string

  /**
   * Name attribute for form grouping (auto-set by RadioGroup)
   */
  name?: string
}

/**
 * Radio button component with Windows 11 Fluent Design
 *
 * Typically used within a RadioGroup for automatic value management.
 *
 * @example
 * ```tsx
 * <Radio
 *   value="normal"
 *   checked={tier === 'normal'}
 *   onChange={setTier}
 *   label="Normal (200 MB)"
 *   description="3-4 chapters, recommended"
 * />
 * ```
 */
export function Radio({
  value,
  label,
  description,
  disabled = false,
  className = '',
  'aria-label': ariaLabel
}: Readonly<RadioProps>): React.JSX.Element {
  // checked/onChange/name are no longer used here: inside Fluent's RadioGroup, each Radio
  // reads its checked state and name from the ambient RadioGroupProvider context (set by
  // RadioGroup.tsx), not from its own props - kept on RadioProps for API compatibility.
  const radioLabel =
    label || description ? (
      <div>
        {label && <div>{label}</div>}
        {description && (
          <div
            style={{
              fontSize: tokens.fontSizeBase200,
              color: tokens.colorNeutralForeground3
            }}
          >
            {description}
          </div>
        )}
      </div>
    ) : undefined

  return (
    <FluentRadio
      value={value}
      label={radioLabel}
      disabled={disabled}
      className={className}
      aria-label={ariaLabel || label}
    />
  )
}
