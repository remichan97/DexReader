/**
 * Common component types and interfaces for DexReader UI components
 */

/**
 * Common component sizes
 */
export type ComponentSize = 'small' | 'medium' | 'large'

/**
 * Common button variants
 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'accent' | 'danger'

/**
 * Common input types
 */
export type InputType = 'text' | 'password' | 'email' | 'search'

/**
 * Manga status types
 */
export type MangaStatus = 'ongoing' | 'completed' | 'hiatus' | 'cancelled'

/**
 * Toast notification variants
 */
export type ToastVariant = 'info' | 'success' | 'warning' | 'error' | 'loading'

/**
 * Progress indicator variants
 */
export type ProgressVariant = 'default' | 'success' | 'error'

/**
 * Skeleton variants
 */
export type SkeletonVariant = 'text' | 'card' | 'circle' | 'rectangle'

/**
 * Modal sizes
 */
export type ModalSize = 'small' | 'medium' | 'large'

/**
 * Common base props for all components
 */
export interface BaseComponentProps {
  className?: string
  'aria-label'?: string
}

/**
 * Props for components with disabled state
 */
export interface DisableableProps {
  disabled?: boolean
}

/**
 * Props for components with loading state
 */
export interface LoadableProps {
  loading?: boolean
}
