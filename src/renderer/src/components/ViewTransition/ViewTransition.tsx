import './ViewTransition.css'

export interface ViewTransitionProps {
  /**
   * Children to render with transition
   */
  children: React.ReactNode
}

/**
 * ViewTransition component for smooth page transitions
 *
 * Wraps view content with fade/slide animation when route changes.
 * Respects prefers-reduced-motion.
 */
export function ViewTransition({ children }: Readonly<ViewTransitionProps>): React.JSX.Element {
  return <div className="view-transition view-transition--fade-in">{children}</div>
}
