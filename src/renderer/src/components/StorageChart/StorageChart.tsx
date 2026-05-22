import type { JSX } from 'react'
import { formatBytes } from '@renderer/utils/formatBytes'
import { useTranslation } from '@renderer/hooks/useTranslation'
import './StorageChart.css'

interface DiskSpaceData {
  total: number
  free: number
  used: number
}

interface StorageChartProps {
  diskSpace: DiskSpaceData
  dexReaderSize: number
}

export function StorageChart({
  diskSpace,
  dexReaderSize
}: Readonly<StorageChartProps>): JSX.Element {
  const { t } = useTranslation(['settings'])
  // Calculate percentages for disk-level bar
  const dexReaderPercent = (dexReaderSize / diskSpace.total) * 100
  const otherAppsSize = diskSpace.used - dexReaderSize
  const otherAppsPercent = (otherAppsSize / diskSpace.total) * 100
  const freePercent = (diskSpace.free / diskSpace.total) * 100

  // Determine if segment is large enough to show label (>8% of bar)
  const shouldShowLabel = (percent: number): boolean => percent > 8

  return (
    <div className="storage-chart p-4">
      {/* Chart Header */}
      <h3 className="storage-chart__title mb-3">{t('settings:storage.chartTitle')}</h3>

      {/* Top Bar: Disk-Level Context */}
      <div className="mb-2">
        <div className="storage-chart__bar storage-chart__bar--large flex">
          {/* DexReader Segment */}
          {dexReaderPercent > 0 && (
            <div
              className="storage-chart__segment flex items-center justify-center"
              style={{
                width: `${dexReaderPercent}%`,
                backgroundColor: 'var(--accent-color)',
                opacity: 0.9
              }}
              title={t('settings:storage.dexReaderTooltip', { size: formatBytes(dexReaderSize) })}
            >
              {shouldShowLabel(dexReaderPercent) && (
                <span
                  className="storage-chart__label storage-chart__label--large"
                  style={{ color: 'white' }}
                >
                  {t('settings:storage.dexReaderLabel', { size: formatBytes(dexReaderSize) })}
                </span>
              )}
            </div>
          )}

          {/* Other Apps Segment */}
          {otherAppsPercent > 0 && (
            <div
              className="storage-chart__segment flex items-center justify-center"
              style={{
                width: `${otherAppsPercent}%`,
                backgroundColor: 'color-mix(in srgb, var(--win-text-secondary) 15%, transparent)'
              }}
              title={t('settings:storage.otherTooltip', { size: formatBytes(otherAppsSize) })}
            >
              {shouldShowLabel(otherAppsPercent) && (
                <span
                  className="storage-chart__label storage-chart__label--large"
                  style={{ color: 'var(--win-text-primary)' }}
                >
                  {t('settings:storage.otherLabel', { size: formatBytes(otherAppsSize) })}
                </span>
              )}
            </div>
          )}

          {/* Free Space Segment */}
          {freePercent > 0 && (
            <div
              className="storage-chart__segment flex items-center justify-center"
              style={{
                width: `${freePercent}%`,
                backgroundColor: 'color-mix(in srgb, var(--win-text-secondary) 8%, transparent)'
              }}
              title={t('settings:storage.freeTooltip', { size: formatBytes(diskSpace.free) })}
            >
              {shouldShowLabel(freePercent) && (
                <span
                  className="storage-chart__label storage-chart__label--large"
                  style={{ color: 'var(--win-text-secondary)' }}
                >
                  {t('settings:storage.freeLabel', { size: formatBytes(diskSpace.free) })}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
