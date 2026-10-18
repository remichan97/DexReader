import { Radio as FluentRadio, tokens } from '@fluentui/react-components'
import { BaseComponentProps, DisableableProps } from '@renderer/types/components'

export interface RadioProps extends BaseComponentProps, DisableableProps {
  /**
   * Radio button value
   */
  value: string

  /**
   * Label text
   */
  label?: string

  /**
   * Description text below the label
   */
  description?: string
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
  // Inside Fluent's RadioGroup, each Radio reads its checked state and name from the ambient
  // RadioGroupProvider context (set by RadioGroup.tsx), so none of those are props here.
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
