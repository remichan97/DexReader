import { useEffect } from 'react'
import {
  Toast as FluentToast,
  ToastTitle,
  ToastBody,
  makeStyles,
  mergeClasses,
  shorthands,
  tokens
} from '@fluentui/react-components'
import {
  CheckmarkCircle16Filled,
  Dismiss16Regular,
  DismissCircle16Filled,
  Info16Filled,
  Warning16Filled
} from '@fluentui/react-icons'
import { useTranslation } from '@renderer/hooks/useTranslation'
import { ToastVariant, BaseComponentProps } from '@renderer/types/components'
import { ProgressRing } from '../ProgressRing'

export interface ToastProps extends BaseComponentProps {
  /**
   * Unique toast identifier
   */
  id: string

  /**
   * Toast variant
   */
  variant: ToastVariant

  /**
   * Toast title
   */
  title: string

  /**
   * Optional message
   */
  message?: string

  /**
   * Auto-dismiss duration in milliseconds (0 to disable)
   * @default 5000
   */
  duration?: number

  /**
   * Close handler
   */
  onClose: (id: string) => void
}

// Fluent's ToastTitle can derive a default per-intent icon/colour from a
// ToastContainerContextProvider, but that's wired up for the imperative
// dispatchToast()/Toaster flow - this component stays declarative (driven by
// the existing toastStore, see src/renderer/src/stores/toastStore.ts) so call
// sites don't change, which means no such provider is mounted. Icon and
// colour are supplied directly instead, reusing the same --win-info/-success/
// -warning/-error tokens the rest of the app's non-Toast surfaces already use
// (tokens.css), rather than guessing at Fluent's status palette.
const useStyles = makeStyles({
  root: {
    minWidth: '320px',
    maxWidth: '400px',
    // ToastContainer's wrapper sets pointer-events: none (Toast.css, .toast-container) so the
    // click-through gap between toasts doesn't block the page, restoring it on each toast - the
    // old .toast class did the same, but Fluent's Toast renders its own fui-Toast class instead
    // of .toast, so that CSS rule no longer matches and every toast silently lost interactivity
    // (close button clicks were swallowed; only the JS auto-dismiss timer still worked).
    pointerEvents: 'auto'
  },
  info: { color: 'var(--win-info)' },
  success: { color: 'var(--win-success)' },
  warning: { color: 'var(--win-warning)' },
  error: { color: 'var(--win-error)' },
  closeButton: {
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
  }
})

/**
 * Toast notification component, built on Fluent 2's `Toast`/`ToastTitle`/
 * `ToastBody` (@fluentui/react-components).
 *
 * @example
 * ```tsx
 * <Toast
 *   id="toast-1"
 *   variant="success"
 *   title="Changes saved"
 *   message="Your settings have been updated"
 *   onClose={handleClose}
 * />
 * ```
 */
export function Toast({
  id,
  variant,
  title,
  message,
  duration = 5000,
  onClose,
  className,
  'aria-label': ariaLabel
}: ToastProps): React.JSX.Element {
  const { t } = useTranslation()
  const styles = useStyles()

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id)
      }, duration)

      return (): void => {
        clearTimeout(timer)
      }
    }
    return undefined
  }, [id, duration, onClose])

  const handleClose = (): void => {
    onClose(id)
  }

  const icons: Record<ToastVariant, React.ReactElement> = {
    info: <Info16Filled className={styles.info} />,
    success: <CheckmarkCircle16Filled className={styles.success} />,
    warning: <Warning16Filled className={styles.warning} />,
    error: <DismissCircle16Filled className={styles.error} />,
    loading: <ProgressRing size="small" aria-label={t('state.loading')} />
  }

  return (
    <FluentToast
      className={mergeClasses(styles.root, className)}
      role="alert"
      aria-live="assertive"
      aria-label={ariaLabel || `${variant}: ${title}`}
    >
      <ToastTitle
        media={icons[variant]}
        action={
          <button
            type="button"
            className={styles.closeButton}
            onClick={handleClose}
            aria-label={t('aria.closeNotification')}
          >
            <Dismiss16Regular />
          </button>
        }
      >
        {title}
      </ToastTitle>
      {message && <ToastBody>{message}</ToastBody>}
    </FluentToast>
  )
}
