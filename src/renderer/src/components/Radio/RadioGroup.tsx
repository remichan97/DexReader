import { RadioGroup as FluentRadioGroup } from '@fluentui/react-components'
import { BaseComponentProps } from '@renderer/types/components'

export interface RadioGroupProps extends BaseComponentProps {
  /**
   * Current selected value
   */
  value: string

  /**
   * Change handler
   */
  onChange: (value: string) => void

  /**
   * Group label (optional, for accessibility)
   */
  label?: string

  /**
   * Name for all radio buttons in this group
   */
  name: string

  /**
   * Radio button children
   */
  children: React.ReactNode

  /**
   * Display layout orientation
   * @default 'vertical'
   */
  orientation?: 'vertical' | 'horizontal'
}

/**
 * Radio group container with automatic value management and keyboard navigation
 *
 * Automatically passes name, checked state, and onChange handler to child Radio components.
 *
 * @example
 * ```tsx
 * <RadioGroup value={tier} onChange={setTier} name="cache-tier" label="Cache Size">
 *   <Radio value="low" label="Low (75 MB)" description="1-2 chapters" />
 *   <Radio value="normal" label="Normal (200 MB)" description="3-4 chapters" />
 *   <Radio value="high" label="High (350 MB)" description="5-7 chapters" />
 * </RadioGroup>
 * ```
 */
export function RadioGroup({
  value,
  onChange,
  label,
  name,
  children,
  orientation = 'vertical',
  className = ''
}: Readonly<RadioGroupProps>): React.JSX.Element {
  return (
    <div className={className}>
      {label && <div className="radio-group__label">{label}</div>}
      <FluentRadioGroup
        name={name}
        value={value}
        onChange={(_ev, data) => onChange(data.value)}
        layout={orientation === 'horizontal' ? 'horizontal' : 'vertical'}
        aria-label={label}
      >
        {children}
      </FluentRadioGroup>
    </div>
  )
}
