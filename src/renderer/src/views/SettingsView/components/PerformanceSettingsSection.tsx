import React, { useState, useEffect } from 'react'
import { RadioGroup, Radio } from '@renderer/components/Radio'
import { Input } from '@renderer/components/Input'
import { InfoBar } from '@renderer/components/InfoBar'
import { Button } from '@renderer/components/Button'
import { useTranslation } from '@renderer/hooks/useTranslation'
import './PerformanceSettingsSection.css'

type CacheTier = 'low' | 'normal' | 'high' | 'custom'

interface PerformanceSettingsSectionProps {
  readonly cacheTier: CacheTier
  readonly customCacheSize: number
  readonly onCacheTierChange: (tier: CacheTier) => void
  readonly onCustomCacheSizeChange: (size: number) => void
}

export function PerformanceSettingsSection({
  cacheTier,
  customCacheSize,
  onCacheTierChange,
  onCustomCacheSizeChange
}: Readonly<PerformanceSettingsSectionProps>): React.JSX.Element {
  const { t } = useTranslation(['settings', 'common'])

  // Load backend-calculated threshold and dynamic tier values
  const [recommendedMax, setRecommendedMax] = useState(500) // 10% of RAM (soft warning, uncapped)
  const [sanityMaxMB, setSanityMaxMB] = useState(1500) // 30% of RAM (hard ceiling)
  const [systemRAM, setSystemRAM] = useState(16)
  const [lowTierMB, setLowTierMB] = useState(75)
  const [normalTierMB, setNormalTierMB] = useState(200)
  const [highTierMB, setHighTierMB] = useState(350)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadCacheInfo(): Promise<void> {
      const result = await globalThis.settings.getMemoryTierInfo()
      if (result.success && result.data) {
        setRecommendedMax(result.data.recommendedMaxMB) // 10% of RAM (uncapped)
        setSystemRAM(result.data.systemRAM_GB)
        setLowTierMB(result.data.lowTierMB)
        setNormalTierMB(result.data.normalTierMB)
        setHighTierMB(result.data.highTierMB)
        // Calculate 30% of RAM as sanity maximum
        setSanityMaxMB(Math.round(result.data.systemRAM_GB * 1024 * 0.3))
        setIsLoading(false)
      }
    }
    loadCacheInfo()
  }, [])

  const handleCustomCacheSizeChange = (value: string): void => {
    const numValue = Number.parseInt(value, 10)
    if (!Number.isNaN(numValue)) {
      onCustomCacheSizeChange(numValue)
    }
  }

  const handleResetWarnings = (): void => {
    localStorage.removeItem('suppressCacheWarnings')
    // Force re-render to update UI
    globalThis.location.reload()
  }

  // Check if user has suppressed warnings
  const suppressWarnings = localStorage.getItem('suppressCacheWarnings') === 'true'

  const showLowWarning = cacheTier === 'custom' && customCacheSize < 30 && customCacheSize >= 10
  const showHighWarning =
    cacheTier === 'custom' &&
    customCacheSize > recommendedMax &&
    customCacheSize <= sanityMaxMB &&
    !suppressWarnings
  const showError =
    cacheTier === 'custom' && (customCacheSize < 10 || customCacheSize > sanityMaxMB)

  // Calculate inline validation messages for custom cache input
  let errorMessage: string | undefined
  if (showError) {
    if (customCacheSize < 10) {
      errorMessage = t('settings:performance.customCacheError.tooLow')
    } else {
      errorMessage = t('settings:performance.customCacheError.tooHigh', { max: sanityMaxMB })
    }
  }

  let helperMessage: string
  if (showLowWarning) {
    helperMessage = t('settings:performance.customCacheWarning.low')
  } else if (showHighWarning) {
    helperMessage = t('settings:performance.customCacheWarning.high', {
      recommended: recommendedMax
    })
  } else if (suppressWarnings) {
    helperMessage = t('settings:performance.warningsSuppressed')
  } else {
    helperMessage = t('settings:performance.customCacheHelper', { max: sanityMaxMB })
  }

  return (
    <div className="reader-settings__container flex flex-col gap-5">
      <div>
        <h4 className="reader-settings__heading">{t('settings:performance.sectionTitle')}</h4>
        <p className="reader-settings__description">{t('settings:performance.description')}</p>

        <InfoBar
          text={t('settings:performance.systemInfo', {
            ram: systemRAM,
            recommended: recommendedMax,
            max: sanityMaxMB
          })}
        />

        <div className="reader-settings__controls flex flex-col gap-4">
          <RadioGroup
            value={cacheTier}
            onChange={(value) => onCacheTierChange(value as CacheTier)}
            name="cache-tier"
            label={t('settings:performance.cacheTierLabel')}
          >
            <Radio
              value="low"
              label={
                isLoading
                  ? t('settings:performance.cacheTierOptions.low.label', {
                      defaultValue: 'Low',
                      size: ''
                    }).replace(/\s*\(\s*\)/, '')
                  : t('settings:performance.cacheTierOptions.low.label', { size: lowTierMB })
              }
              description={t('settings:performance.cacheTierOptions.low.description')}
            />
            <Radio
              value="normal"
              label={
                isLoading
                  ? t('settings:performance.cacheTierOptions.normal.label', {
                      defaultValue: 'Normal (Recommended)',
                      size: ''
                    }).replace(/\s*\(\s*\)\s*-/, ' -')
                  : t('settings:performance.cacheTierOptions.normal.label', { size: normalTierMB })
              }
              description={t('settings:performance.cacheTierOptions.normal.description')}
            />
            <Radio
              value="high"
              label={
                isLoading
                  ? t('settings:performance.cacheTierOptions.high.label', {
                      defaultValue: 'High',
                      size: ''
                    }).replace(/\s*\(\s*\)/, '')
                  : t('settings:performance.cacheTierOptions.high.label', { size: highTierMB })
              }
              description={t('settings:performance.cacheTierOptions.high.description')}
            />
            <Radio
              value="custom"
              label={t('settings:performance.cacheTierOptions.custom.label')}
              description={t('settings:performance.cacheTierOptions.custom.description')}
            />
          </RadioGroup>

          {cacheTier === 'custom' && (
            <div className="reader-settings__custom-input">
              <label htmlFor="custom-cache-size" className="reader-settings__label">
                {t('settings:performance.customCacheLabel')}
              </label>
              <Input
                id="custom-cache-size"
                type="text"
                placeholder={t('settings:performance.customCachePlaceholder')}
                value={customCacheSize.toString()}
                onChange={handleCustomCacheSizeChange}
                disabled={isLoading}
                error={errorMessage}
                helperText={suppressWarnings ? undefined : helperMessage}
              />
              {suppressWarnings && (
                <div className="input-helper-with-action flex items-center justify-between gap-2">
                  <span className="input-helper flex-1">{helperMessage}</span>
                  <Button variant="ghost" size="small" onClick={handleResetWarnings}>
                    {t('settings:performance.resetWarningsButton')}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
