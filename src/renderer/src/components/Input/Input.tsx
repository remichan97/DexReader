import { useState, InputHTMLAttributes } from 'react'
import {
  Field,
  Input as FluentInput,
  makeStyles,
  shorthands,
  tokens,
  type InputOnChangeData
} from '@fluentui/react-components'
import { Dismiss16Regular, Eye16Regular, EyeOff16Regular } from '@fluentui/react-icons'
import { useTranslation } from '@renderer/hooks/useTranslation'
import { InputType, BaseComponentProps, DisableableProps } from '@renderer/types/components'

export interface InputProps
  extends
    BaseComponentProps,
    DisableableProps,
    Omit<
      InputHTMLAttributes<HTMLInputElement>,
      'className' | 'type' | 'onChange' | 'children' | 'size' | 'defaultValue'
    > {
  /**
   * Input type
   * @default 'text'
   */
  type?: InputType

  /**
   * Input label (optional)
   */
  label?: string

  /**
   * Placeholder text
   */
  placeholder?: string

  /**
   * Current value
   */
  value: string

  /**
   * Change handler
   */
  onChange: (value: string) => void

  /**
   * Error message (shows error state)
   */
  error?: string

  /**
   * Helper text (shown below input)
   */
  helperText?: string

  /**
   * Maximum character length
   */
  maxLength?: number

  /**
   * Show character counter
   */
  showCounter?: boolean

  /**
   * Icon to display at start of input
   */
  icon?: React.ReactElement
}

const useStyles = makeStyles({
  icon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: tokens.colorNeutralForeground3
  },
  actionButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '20px',
    height: '20px',
    ...shorthands.padding(0),
    ...shorthands.border('none'),
    ...shorthands.borderRadius(tokens.borderRadiusSmall),
    backgroundColor: 'transparent',
    color: tokens.colorNeutralForeground3,
    cursor: 'pointer',
    ':hover': {
      backgroundColor: tokens.colorSubtleBackgroundHover,
      color: tokens.colorNeutralForeground1
    },
    ':active': {
      backgroundColor: tokens.colorSubtleBackgroundPressed
    }
  },
  footerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: tokens.spacingHorizontalS,
    width: '100%'
  },
  counter: {
    whiteSpace: 'nowrap',
    color: tokens.colorNeutralForeground3,
    marginLeft: 'auto'
  }
})

/**
 * Input component, built on Fluent 2's `Field` + `Input` (@fluentui/react-components).
 *
 * @example
 * ```tsx
 * // Basic text input
 * <Input
 *   type="text"
 *   label="Username"
 *   value={username}
 *   onChange={setUsername}
 *   placeholder="Enter username"
 * />
 *
 * // Password input with error
 * <Input
 *   type="password"
 *   label="Password"
 *   value={password}
 *   onChange={setPassword}
 *   error="Password is required"
 * />
 *
 * // Email with helper text
 * <Input
 *   type="email"
 *   label="Email"
 *   value={email}
 *   onChange={setEmail}
 *   helperText="We'll never share your email"
 * />
 * ```
 */
export function Input({
  type = 'text',
  label,
  placeholder,
  value,
  onChange,
  error,
  helperText,
  disabled = false,
  maxLength,
  showCounter = false,
  icon,
  className,
  'aria-label': ariaLabel,
  ...rest
}: InputProps): React.JSX.Element {
  const { t } = useTranslation('common')
  const styles = useStyles()
  const [showPassword, setShowPassword] = useState(false)

  const hasError = Boolean(error)
  const currentLength = value.length
  const hasMaxLength = maxLength !== undefined
  const hasCounter = showCounter && hasMaxLength

  const handleChange = (
    _event: React.ChangeEvent<HTMLInputElement>,
    data: InputOnChangeData
  ): void => {
    onChange(data.value)
  }

  const handleClear = (): void => {
    onChange('')
  }

  const togglePasswordVisibility = (): void => {
    setShowPassword((previous) => !previous)
  }

  const inputType = type === 'password' && showPassword ? 'text' : type

  // Error and helper text share the same footer row as the character counter (when shown),
  // so both go through Field's validationMessage/hint slots rather than a separate element -
  // Field only renders one or the other based on validationState, matching the original's
  // "error takes priority over helper text" behaviour.
  const counterNode = hasCounter && (
    <span className={styles.counter} aria-live="polite">
      {currentLength}/{maxLength}
    </span>
  )

  const footer = (text?: string): React.ReactElement | undefined =>
    text || counterNode ? (
      <span className={styles.footerRow}>
        <span>{text}</span>
        {counterNode}
      </span>
    ) : undefined

  return (
    <Field
      className={className}
      label={label}
      validationState={hasError ? 'error' : 'none'}
      validationMessage={hasError ? footer(error) : undefined}
      hint={!hasError ? footer(helperText) : undefined}
    >
      <FluentInput
        type={inputType}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        maxLength={maxLength}
        aria-label={ariaLabel}
        contentBefore={icon && <span className={styles.icon}>{icon}</span>}
        contentAfter={
          <>
            {type === 'search' && value && !disabled && (
              <button
                type="button"
                className={styles.actionButton}
                onClick={handleClear}
                aria-label={t('aria.clearSearch')}
                tabIndex={-1}
              >
                <Dismiss16Regular />
              </button>
            )}
            {type === 'password' && !disabled && (
              <button
                type="button"
                className={styles.actionButton}
                onClick={togglePasswordVisibility}
                aria-label={showPassword ? t('aria.hidePassword') : t('aria.showPassword')}
                tabIndex={-1}
              >
                {showPassword ? <Eye16Regular /> : <EyeOff16Regular />}
              </button>
            )}
          </>
        }
        {...rest}
      />
    </Field>
  )
}
