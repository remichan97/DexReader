import { useLayoutEffect, useRef } from 'react'
import './ViewTransition.css'

export interface ViewTransitionProps {
  /**
   * Children to render with transition
   */
  children: React.ReactNode
}

/** Safety net in case `animationend` never fires (animation cancelled, element detached). */
const RELEASE_FALLBACK_MS = 500

/** Nearest ancestor that scrolls vertically, if any. */
function findScrollContainer(element: HTMLElement): HTMLElement | undefined {
  for (let node = element.parentElement; node; node = node.parentElement) {
    const { overflowY } = getComputedStyle(node)
    if (overflowY === 'auto' || overflowY === 'scroll') {
      return node
    }
  }
  return undefined
}

/**
 * ViewTransition component for smooth page transitions
 *
 * Wraps view content with fade/slide animation when route changes.
 * Respects prefers-reduced-motion.
 *
 * The slide is a `translateY(8px) -> 0` transform, and transforms count towards an
 * ancestor's scrollable overflow. A view that exactly fills its scroll container (empty
 * views, or views that host their own scrolling) therefore briefly overflows it by 8px,
 * flashing a scrollbar - and the 12px it takes shifts the layout - for the length of the
 * animation. While the animation runs, hold the container's overflow hidden, but only when
 * the view doesn't genuinely overflow (in which case its scrollbar belongs there).
 */
export function ViewTransition({ children }: Readonly<ViewTransitionProps>): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const element = ref.current
    if (!element || getComputedStyle(element).animationName === 'none') {
      return
    }

    const container = findScrollContainer(element)
    // offsetHeight ignores transforms, so this is the view's real height.
    if (!container || element.offsetHeight > container.clientHeight) {
      return
    }

    const previousOverflowY = container.style.overflowY
    container.style.overflowY = 'hidden'

    let released = false
    const release = (): void => {
      if (released) return
      released = true
      container.style.overflowY = previousOverflowY
      element.removeEventListener('animationend', release)
      element.removeEventListener('animationcancel', release)
      clearTimeout(fallback)
    }
    const fallback = setTimeout(release, RELEASE_FALLBACK_MS)
    element.addEventListener('animationend', release)
    element.addEventListener('animationcancel', release)

    return release
  }, [])

  return (
    <div ref={ref} className="view-transition view-transition--fade-in">
      {children}
    </div>
  )
}
