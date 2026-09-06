import React from 'react'
import { Lightbulb16Regular } from '@fluentui/react-icons'
import { Button } from '@renderer/components/Button'
import { Input } from '@renderer/components/Input'
import { NumberSpinner } from '@renderer/components/NumberSpinner'
import { RadioGroup, Radio } from '@renderer/components/Radio'
import { useTranslation } from '@renderer/hooks/useTranslation'
import './DownloadsSettings.css'

interface DownloadsSettingsProps {
  downloadsPath: string
  isLoadingPath: boolean
  isChangingPath: boolean
  downloadConfirmation: 'always' | 'batch-only' | 'never'
  defaultQuality: 'data' | 'data-saver'
  maxConcurrentDownloads: number
  onSelectDownloadsFolder: () => void
  onDownloadConfirmationChange: (confirmation: string) => void
  onDefaultQualityChange: (quality: string) => void
  onMaxConcurrentDownloadsChange: (count: number) => void
}

export function DownloadsSettings({
  downloadsPath,
  isLoadingPath,
  isChangingPath,
  downloadConfirmation,
  defaultQuality,
  maxConcurrentDownloads,
  onSelectDownloadsFolder,
  onDownloadConfirmationChange,
  onDefaultQualityChange,
  onMaxConcurrentDownloadsChange
}: Readonly<DownloadsSettingsProps>): React.JSX.Element {
  const { t } = useTranslation(['settings', 'common'])

  return (
    <div className="downloads-settings__container flex flex-col gap-5">
      <div>
        <h4 className="downloads-settings__heading">{t('downloads.locationSection')}</h4>
        <p className="downloads-settings__description">{t('downloads.locationDescription')}</p>
        <div className="downloads-settings__controls">
          <Input
            type="text"
            value={isLoadingPath ? t('common:state.loadingEllipsis') : downloadsPath}
            onChange={() => {}}
            readOnly
            className="downloads-settings__path-display"
          />
          <Button
            variant="secondary"
            onClick={onSelectDownloadsFolder}
            loading={isChangingPath}
            disabled={isLoadingPath}
          >
            {t('downloads.browseButton')}
          </Button>
        </div>
        <p className="downloads-settings__info-box flex items-center gap-1.5">
          <Lightbulb16Regular className="downloads-settings__info-icon" />
          <span>{t('downloads.locationTip')}</span>
        </p>
      </div>

      {/* Download Confirmation Settings */}
      <div className="downloads-settings__divider">
        <h4 className="downloads-settings__heading">{t('downloads.confirmationSection')}</h4>
        <p className="downloads-settings__description">{t('downloads.confirmationDescription')}</p>

        <div>
          <RadioGroup
            value={downloadConfirmation}
            onChange={(value) =>
              onDownloadConfirmationChange(value as 'always' | 'batch-only' | 'never')
            }
            name="download-confirmation"
            label={t('downloads.confirmationLabel')}
          >
            <Radio
              value="always"
              label={t('downloads.confirmationOptions.always.label')}
              description={t('downloads.confirmationOptions.always.description')}
            />
            <Radio
              value="batch-only"
              label={t('downloads.confirmationOptions.batchOnly.label')}
              description={t('downloads.confirmationOptions.batchOnly.description')}
            />
            <Radio
              value="never"
              label={t('downloads.confirmationOptions.never.label')}
              description={t('downloads.confirmationOptions.never.description')}
            />
          </RadioGroup>
        </div>
      </div>

      {/* Download Quality Settings */}
      <div className="downloads-settings__divider">
        <h4 className="downloads-settings__heading">{t('downloads.qualitySection')}</h4>
        <p className="downloads-settings__description">
          {downloadConfirmation === 'never'
            ? t('downloads.qualityDescription')
            : t('downloads.qualityDescriptionWithConfirm')}
        </p>

        <div>
          <RadioGroup
            value={defaultQuality}
            onChange={(value) => onDefaultQualityChange(value as 'data' | 'data-saver')}
            name="default-quality"
            label={t('downloads.qualityLabel')}
          >
            <Radio
              value="data"
              label={t('common:quality.highQuality')}
              description={t('reader.imageQuality.highQuality.description')}
            />
            <Radio
              value="data-saver"
              label={t('common:quality.dataSaver')}
              description={t('reader.imageQuality.dataSaver.description')}
            />
          </RadioGroup>
        </div>
      </div>

      {/* Concurrent Downloads Settings */}
      <div className="downloads-settings__divider">
        <h4 className="downloads-settings__heading">{t('downloads.concurrentSection')}</h4>
        <p className="downloads-settings__description">{t('downloads.concurrentDescription')}</p>

        <div>
          <NumberSpinner
            value={maxConcurrentDownloads}
            onChange={onMaxConcurrentDownloadsChange}
            min={1}
            max={5}
            label={t('downloads.concurrentLabel')}
            helperText={t('downloads.concurrentHelper')}
          />
        </div>
      </div>
    </div>
  )
}
