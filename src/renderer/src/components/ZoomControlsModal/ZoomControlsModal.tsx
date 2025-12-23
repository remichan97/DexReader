import type { JSX, ReactElement } from 'react'
import { Popover } from '@renderer/components/Popover'
import { Button } from '@renderer/components/Button'

interface ZoomControlsModalProps {
  readonly isOpen: boolean
  readonly onOpen: () => void
  readonly onClose: () => void
  readonly fitMode: 'width' | 'height' | 'actual' | 'custom'
  readonly zoomLevel: number
  readonly onFitWidth: () => void
  readonly onFitHeight: () => void
  readonly onActualSize: () => void
  readonly onZoomIn: () => void
  readonly onZoomOut: () => void
  readonly onReset: () => void
  readonly children: ReactElement
}

export function ZoomControlsModal({
  isOpen,
  onOpen,
  onClose,
  fitMode,
  zoomLevel,
  onFitWidth,
  onFitHeight,
  onActualSize,
  onZoomIn,
  onZoomOut,
  onReset,
  children
}: ZoomControlsModalProps): JSX.Element {
  const zoomPercentage = Math.round(zoomLevel * 100)

  const popoverContent = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        padding: '16px',
        minWidth: '220px'
      }}
    >
      {/* Fit modes section */}
      <div>
        <h5 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 600 }}>Fit Mode</h5>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            variant={fitMode === 'width' ? 'primary' : 'ghost'}
            size="small"
            onClick={() => {
              onFitWidth()
              onClose()
            }}
            aria-label="Fit to width"
            title="Fit image to page width"
            style={{ flex: 1 }}
          >
            Width
          </Button>
          <Button
            variant={fitMode === 'height' ? 'primary' : 'ghost'}
            size="small"
            onClick={() => {
              onFitHeight()
              onClose()
            }}
            aria-label="Fit to height"
            title="Fit image to page height"
            style={{ flex: 1 }}
          >
            Height
          </Button>
          <Button
            variant={fitMode === 'actual' ? 'primary' : 'ghost'}
            size="small"
            onClick={() => {
              onActualSize()
              onClose()
            }}
            aria-label="Actual size"
            title="Show at 100% size (actual size)"
            style={{ flex: 1 }}
          >
            100%
          </Button>
        </div>
      </div>

      {/* Zoom controls section */}
      <div>
        <h5 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 600 }}>Zoom</h5>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Button
            variant="ghost"
            size="small"
            onClick={onZoomOut}
            disabled={zoomLevel <= 0.25}
            aria-label="Zoom out"
            title="Zoom out (Ctrl + -)"
          >
            −
          </Button>
          <span
            style={{
              flex: 1,
              textAlign: 'center',
              fontSize: '14px',
              fontWeight: 500,
              minWidth: '60px'
            }}
            title="Current zoom level"
          >
            {zoomPercentage}%
          </span>
          <Button
            variant="ghost"
            size="small"
            onClick={onZoomIn}
            disabled={zoomLevel >= 4}
            aria-label="Zoom in"
            title="Zoom in (Ctrl + =)"
          >
            +
          </Button>
        </div>
      </div>

      {/* Reset button */}
      <Button
        variant="ghost"
        size="small"
        onClick={() => {
          onReset()
          onClose()
        }}
        aria-label="Reset zoom"
        title="Reset to default (fit to height)"
        style={{ width: '100%' }}
      >
        Reset
      </Button>
    </div>
  )

  return (
    <Popover open={isOpen} onOpenChange={onOpen} content={popoverContent} position="bottom">
      {children}
    </Popover>
  )
}
