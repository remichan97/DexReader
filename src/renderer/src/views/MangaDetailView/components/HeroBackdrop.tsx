import type { JSX } from 'react'
import { useCanvasStore } from '@renderer/stores'
import './HeroBackdrop.css'

interface HeroBackdropProps {
  readonly coverUrl: string | null
}

/**
 * HeroBackdrop - Renders a backdrop behind the hero section based on canvas mode
 *
 * Supports four modes:
 * - none: No backdrop (default solid background)
 * - blurred: Blurred version of the cover art
 * - gradient: Cover art that fades from left to right
 * - accent: Solid background using the app's accent color
 */
export function HeroBackdrop({ coverUrl }: HeroBackdropProps): JSX.Element | null {
  const canvasMode = useCanvasStore((state) => state.canvasMode)

  // If mode is 'none', don't render anything
  if (canvasMode === 'none') {
    return null
  }

  // If no cover URL and mode requires cover art, don't render
  if (!coverUrl && (canvasMode === 'blurred' || canvasMode === 'gradient')) {
    return null
  }

  return (
    <div className="hero-backdrop" data-mode={canvasMode}>
      {canvasMode === 'accent' && <div className="hero-backdrop__accent" />}

      {canvasMode === 'blurred' && coverUrl && (
        <div
          className="hero-backdrop__blurred"
          style={{
            backgroundImage: `url(${coverUrl})`
          }}
        />
      )}

      {canvasMode === 'gradient' && coverUrl && (
        <div
          className="hero-backdrop__gradient"
          style={{
            backgroundImage: `url(${coverUrl})`
          }}
        />
      )}
    </div>
  )
}
