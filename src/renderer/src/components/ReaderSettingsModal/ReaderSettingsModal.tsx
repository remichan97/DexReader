import type { JSX, ReactElement } from 'react'
import { Popover } from '@renderer/components/Popover'
import { Select, type SelectOption } from '@renderer/components/Select'
import type { MangaReadingSettings } from '../../../../preload/index.d'
import { useTranslation } from '@renderer/hooks/useTranslation'
import './ReaderSettingsModal.css'

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
  const { t } = useTranslation(['dialogs', 'common'])
  const readingModeOptions: SelectOption[] = [
    { value: 'single', label: t('dialogs:readerSettings.mode.options.single') },
    { value: 'double', label: t('dialogs:readerSettings.mode.options.double') },
    { value: 'vertical', label: t('dialogs:readerSettings.mode.options.vertical') }
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
    <div className="reader-settings-modal__content flex flex-col gap-4 p-4">
      {/* Reading Mode Settings */}
      <div>
        <div className="flex flex-col gap-3">
          <Select
            value={settings.readingMode}
            onChange={handleReadingModeChange}
            options={readingModeOptions}
            label={t('dialogs:readerSettings.mode.label')}
            helperText={t('dialogs:readerSettings.mode.helperText')}
          />

          {settings.readingMode === 'double' && (
            <div className="reader-settings-modal__double-page-options p-4 flex flex-col gap-3">
              <h5 className="reader-settings-modal__options-title m-0">
                {t('dialogs:readerSettings.doublePageOptions.title')}
              </h5>
              <label className="reader-settings-modal__checkbox-label flex items-center gap-2">
                <input
                  type="checkbox"
                  className="reader-settings-modal__checkbox"
                  checked={settings.doublePageMode?.skipCoverPages ?? true}
                  onChange={(e) =>
                    handleDoublePageSettingChange('skipCoverPages', e.target.checked)
                  }
                />{' '}
                {t('dialogs:readerSettings.doublePageOptions.skipCoverPages')}
              </label>
              <label className="reader-settings-modal__checkbox-label flex items-center gap-2">
                <input
                  type="checkbox"
                  className="reader-settings-modal__checkbox"
                  checked={settings.doublePageMode?.readRightToLeft ?? true}
                  onChange={(e) =>
                    handleDoublePageSettingChange('readRightToLeft', e.target.checked)
                  }
                />{' '}
                {t('dialogs:readerSettings.doublePageOptions.readRightToLeft')}
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Info Text */}
      <p className="reader-settings-modal__info m-0 text-secondary pt-3">
        {t('dialogs:readerSettings.savedForMangaOnly')}
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
