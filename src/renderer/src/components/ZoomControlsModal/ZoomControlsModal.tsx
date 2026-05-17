import type { JSX, ReactElement } from 'react'
import { Popover } from '@renderer/components/Popover'
import { Button } from '@renderer/components/Button'
import { useTranslation } from '@renderer/hooks/useTranslation'
import './ZoomControlsModal.css'

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
  const { t } = useTranslation(['reader', 'common'])
  const zoomPercentage = Math.round(zoomLevel * 100)

  const popoverContent = (
    <div className="zoom-controls-modal__content flex flex-col gap-4 p-4">
      {/* Fit modes section */}
      <div>
        <h5 className="zoom-controls-modal__section-title mb-2">
          {t('reader:zoomControls.sectionTitle.fitMode')}
        </h5>
        <div className="flex gap-2">
          <Button
            variant={fitMode === 'width' ? 'primary' : 'ghost'}
            size="small"
            onClick={() => {
              onFitWidth()
              onClose()
            }}
            aria-label={t('reader:zoomControls.ariaLabels.fitWidth')}
            title={t('reader:zoomControls.tooltips.fitWidth')}
            className="flex-1"
          >
            {t('reader:zoomControls.fitWidth')}
          </Button>
          <Button
            variant={fitMode === 'height' ? 'primary' : 'ghost'}
            size="small"
            onClick={() => {
              onFitHeight()
              onClose()
            }}
            aria-label={t('reader:zoomControls.ariaLabels.fitHeight')}
            title={t('reader:zoomControls.tooltips.fitHeight')}
            className="flex-1"
          >
            {t('reader:zoomControls.fitHeight')}
          </Button>
          <Button
            variant={fitMode === 'actual' ? 'primary' : 'ghost'}
            size="small"
            onClick={() => {
              onActualSize()
              onClose()
            }}
            aria-label={t('reader:zoomControls.ariaLabels.actualSize')}
            title={t('reader:zoomControls.tooltips.actualSize')}
            className="flex-1"
          >
            {t('reader:zoomControls.actualSize')}
          </Button>
        </div>
      </div>

      {/* Zoom controls section */}
      <div>
        <h5 className="zoom-controls-modal__section-title mb-2">
          {t('reader:zoomControls.sectionTitle.zoom')}
        </h5>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="small"
            onClick={onZoomOut}
            disabled={zoomLevel <= 0.25}
            aria-label={t('reader:zoomControls.ariaLabels.zoomOut')}
            title={t('reader:zoomControls.tooltips.zoomOut')}
          >
            −
          </Button>
          <span
            className="flex-1 text-center"
            style={{ fontSize: '14px', fontWeight: 500, minWidth: '60px' }}
            title={t('reader:zoomControls.tooltips.currentZoom')}
          >
            {zoomPercentage}%
          </span>
          <Button
            variant="ghost"
            size="small"
            onClick={onZoomIn}
            disabled={zoomLevel >= 4}
            aria-label={t('reader:zoomControls.ariaLabels.zoomIn')}
            title={t('reader:zoomControls.tooltips.zoomIn')}
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
        aria-label={t('reader:zoomControls.ariaLabels.reset')}
        title={t('reader:zoomControls.tooltips.reset')}
        style={{ width: '100%' }}
      >
        {t('reader:zoomControls.reset')}
      </Button>
    </div>
  )

  return (
    <Popover open={isOpen} onOpenChange={onOpen} content={popoverContent} position="bottom">
      {children}
    </Popover>
  )
}
