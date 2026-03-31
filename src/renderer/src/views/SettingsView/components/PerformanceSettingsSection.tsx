import React, { useState, useEffect } from 'react'
import { RadioGroup, Radio } from '@renderer/components/Radio'
import { Input } from '@renderer/components/Input'
import { InfoBar } from '@renderer/components/InfoBar'
import { Button } from '@renderer/components/Button'
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
      errorMessage = 'Cache size must be at least 10 MB'
    } else {
      errorMessage = `Cache size cannot exceed ${sanityMaxMB} MB (30% of system RAM)`
    }
  }

  let helperMessage: string
  if (showLowWarning) {
    helperMessage = `Low cache may cause frequent reloads. Recommended minimum: 30 MB`
  } else if (showHighWarning) {
    helperMessage = `This exceeds recommended ${recommendedMax} MB (10% of system RAM). High cache may impact system performance.`
  } else if (suppressWarnings) {
    helperMessage = 'Warnings suppressed'
  } else {
    helperMessage = `Enter cache size in MB (10 - ${sanityMaxMB})`
  }

  return (
    <div className="reader-settings__container flex flex-col gap-5">
      <div>
        <h4 className="reader-settings__heading">Performance</h4>
        <p className="reader-settings__description">
          Configure how much memory DexReader can use for caching manga chapters. Higher tiers load
          more chapters in advance.
        </p>

        <InfoBar
          text={`System RAM: ${systemRAM} GB | Recommended: ${recommendedMax} MB (10%) | Maximum: ${sanityMaxMB} MB (30%)`}
        />

        <div className="reader-settings__controls flex flex-col gap-4">
          <RadioGroup
            value={cacheTier}
            onChange={(value) => onCacheTierChange(value as CacheTier)}
            name="cache-tier"
            label="Chapter Cache Size"
          >
            <Radio
              value="low"
              label={isLoading ? 'Low' : `Low (${lowTierMB} MB)`}
              description="1-2 chapters cached | Best for low-end systems"
            />
            <Radio
              value="normal"
              label={
                isLoading ? 'Normal (Recommended)' : `Normal (${normalTierMB} MB) - Recommended`
              }
              description="3-4 chapters cached | Balanced performance"
            />
            <Radio
              value="high"
              label={isLoading ? 'High' : `High (${highTierMB} MB)`}
              description="5-7 chapters cached | Smoother reading"
            />
            <Radio value="custom" label="Custom" description="Advanced users only" />
          </RadioGroup>

          {cacheTier === 'custom' && (
            <div className="reader-settings__custom-input">
              <label htmlFor="custom-cache-size" className="reader-settings__label">
                Custom Cache Size (MB)
              </label>
              <Input
                id="custom-cache-size"
                type="text"
                placeholder="200"
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
                    Reset warnings
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
