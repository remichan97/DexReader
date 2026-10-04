import { Switch as FluentSwitch, tokens } from '@fluentui/react-components'
import { BaseComponentProps, DisableableProps } from '@renderer/types/components'

export interface SwitchProps extends BaseComponentProps, DisableableProps {
  /**
   * Whether the switch is checked
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
   * Description text below the label
   */
  description?: string
}

/**
 * Toggle switch component for settings
 *
 * @example
 * ```tsx
 * <Switch
 *   checked={enabled}
 *   onChange={setEnabled}
 *   label="Enable notifications"
 *   description="Receive notifications when new chapters are available"
 * />
 * ```
 */
export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  className = '',
  'aria-label': ariaLabel
}: Readonly<SwitchProps>): React.JSX.Element {
  const switchLabel =
    label || description ? (
      <div>
        {label && <div style={{ fontWeight: tokens.fontWeightSemibold }}>{label}</div>}
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
    <FluentSwitch
      checked={checked}
      onChange={(_ev, data) => onChange(data.checked)}
      label={switchLabel}
      labelPosition="before"
      disabled={disabled}
      className={className}
      aria-label={ariaLabel || label}
      // Fluent's Switch root is inline-flex (shrink-to-fit), so the indicator sits right
      // after the label text instead of pinned to the row's far edge - stretch it full
      // width and push label/indicator to opposite ends, matching the old layout.
      style={{ width: '100%', justifyContent: 'space-between' }}
    />
  )
}
