import type { JSX, ReactElement } from 'react'
import { Popover } from '@renderer/components/Popover'
import { Select, type SelectOption } from '@renderer/components/Select'
import type { MangaReadingSettings } from '../../../../preload/index.d'

interface ReaderSettingsModalProps {
  readonly isOpen: boolean
  readonly onOpen: () => void
  readonly onClose: () => void
  readonly settings: MangaReadingSettings
  readonly onSettingsChange: (settings: MangaReadingSettings) => void
  readonly children: ReactElement
}

export function ReaderSettingsModal({
  isOpen,
  onOpen,
  onClose,
  settings,
  onSettingsChange,
  children
}: ReaderSettingsModalProps): JSX.Element {
  const readingModeOptions: SelectOption[] = [
    { value: 'single', label: 'Single Page' },
    { value: 'double', label: 'Double Page' },
    { value: 'vertical', label: 'Vertical Scroll' }
  ]

  const handleReadingModeChange = (mode: string | string[]): void => {
    const selectedMode = Array.isArray(mode) ? mode[0] : mode

    // Only include doublePageMode when mode is 'double'
    if (selectedMode === 'double') {
      onSettingsChange({
        readingMode: selectedMode as MangaReadingSettings['readingMode'],
        doublePageMode: settings.doublePageMode ?? {
          skipCoverPages: true,
          readRightToLeft: true
        }
      })
    } else {
      onSettingsChange({
        readingMode: selectedMode as MangaReadingSettings['readingMode']
      })
    }
  }

  const handleDoublePageSettingChange = (
    key: 'skipCoverPages' | 'readRightToLeft',
    value: boolean
  ): void => {
    onSettingsChange({
      ...settings,
      doublePageMode: {
        skipCoverPages: settings.doublePageMode?.skipCoverPages ?? true,
        readRightToLeft: settings.doublePageMode?.readRightToLeft ?? true,
        [key]: value
      }
    })
  }

  const popoverContent = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        padding: '16px',
        minWidth: '280px',
        maxWidth: '320px'
      }}
    >
      {/* Reading Mode Settings */}
      <div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Select
            value={settings.readingMode}
            onChange={handleReadingModeChange}
            options={readingModeOptions}
            label="Mode"
            helperText="How pages are displayed"
          />

          {settings.readingMode === 'double' && (
            <div
              style={{
                padding: '16px',
                background: 'var(--win-bg-subtle)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <h5 style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>Double Page Options</h5>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                <input
                  type="checkbox"
                  checked={settings.doublePageMode?.skipCoverPages ?? true}
                  onChange={(e) =>
                    handleDoublePageSettingChange('skipCoverPages', e.target.checked)
                  }
                  style={{ cursor: 'pointer' }}
                />{' '}
                Skip cover pages
              </label>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                <input
                  type="checkbox"
                  checked={settings.doublePageMode?.readRightToLeft ?? true}
                  onChange={(e) =>
                    handleDoublePageSettingChange('readRightToLeft', e.target.checked)
                  }
                  style={{ cursor: 'pointer' }}
                />{' '}
                Read right-to-left
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Info Text */}
      <p
        style={{
          margin: 0,
          fontSize: '12px',
          color: 'var(--win-text-secondary)',
          borderTop: '1px solid var(--win-border)',
          paddingTop: '12px'
        }}
      >
        Saved for this manga only
      </p>
    </div>
  )

  return (
    <Popover
      content={popoverContent}
      open={isOpen}
      onOpenChange={(open) => {
        if (open) {
          onOpen()
        } else {
          onClose()
        }
      }}
      position="bottom"
      trigger="click"
    >
      {children}
    </Popover>
  )
}
