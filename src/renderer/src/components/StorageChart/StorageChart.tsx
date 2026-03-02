import type { JSX } from 'react'

interface DiskSpaceData {
  total: number
  free: number
  used: number
}

interface MangaSegment {
  mangaId: string
  title: string
  size: number
}

interface StorageChartProps {
  diskSpace: DiskSpaceData
  dexReaderSize: number
  topManga: MangaSegment[] // Top 3-5 manga by size
  othersSize: number // Sum of remaining manga
}

export function StorageChart({
  diskSpace,
  dexReaderSize,
  topManga,
  othersSize
}: Readonly<StorageChartProps>): JSX.Element {
  // Calculate percentages for disk-level bar
  const dexReaderPercent = (dexReaderSize / diskSpace.total) * 100
  const otherAppsSize = diskSpace.used - dexReaderSize
  const otherAppsPercent = (otherAppsSize / diskSpace.total) * 100
  const freePercent = (diskSpace.free / diskSpace.total) * 100

  // Calculate percentages for manga breakdown bar
  const mangaSegments = topManga.map((manga) => ({
    ...manga,
    percent: (manga.size / dexReaderSize) * 100
  }))
  const othersPercent = (othersSize / dexReaderSize) * 100

  // Format bytes to human-readable
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`
  }

  // Determine if segment is large enough to show label (>8% of bar)
  const shouldShowLabel = (percent: number): boolean => percent > 8

  return (
    <div
      style={{
        border: '1px solid var(--win-border-default)',
        borderRadius: '6px',
        padding: '16px',
        backgroundColor: 'var(--win-surface-default)'
      }}
    >
      {/* Chart Header */}
      <h3
        style={{
          fontSize: '14px',
          fontWeight: 600,
          marginBottom: '12px',
          color: 'var(--win-text-primary)'
        }}
      >
        DexReader Storage Breakdown
      </h3>

      {/* Top Bar: Disk-Level Context */}
      <div style={{ marginBottom: '8px' }}>
        <div
          style={{
            display: 'flex',
            height: '40px',
            borderRadius: '4px',
            overflow: 'hidden',
            backgroundColor: 'var(--win-surface-tertiary)'
          }}
        >
          {/* DexReader Segment */}
          {dexReaderPercent > 0 && (
            <div
              style={{
                width: `${dexReaderPercent}%`,
                backgroundColor: 'var(--accent-color)',
                opacity: 0.9,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 8px',
                position: 'relative'
              }}
              title={`DexReader: ${formatBytes(dexReaderSize)}`}
            >
              {shouldShowLabel(dexReaderPercent) && (
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 500,
                    color: 'white',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  DexReader • {formatBytes(dexReaderSize)}
                </span>
              )}
            </div>
          )}

          {/* Other Apps Segment */}
          {otherAppsPercent > 0 && (
            <div
              style={{
                width: `${otherAppsPercent}%`,
                backgroundColor: 'color-mix(in srgb, var(--win-text-secondary) 15%, transparent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 8px'
              }}
              title={`Other Apps: ${formatBytes(otherAppsSize)}`}
            >
              {shouldShowLabel(otherAppsPercent) && (
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 500,
                    color: 'var(--win-text-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  Other • {formatBytes(otherAppsSize)}
                </span>
              )}
            </div>
          )}

          {/* Free Space Segment */}
          {freePercent > 0 && (
            <div
              style={{
                width: `${freePercent}%`,
                backgroundColor: 'color-mix(in srgb, var(--win-text-secondary) 8%, transparent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 8px'
              }}
              title={`Free Space: ${formatBytes(diskSpace.free)}`}
            >
              {shouldShowLabel(freePercent) && (
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 500,
                    color: 'var(--win-text-secondary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  Free • {formatBytes(diskSpace.free)}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Bar: Manga Breakdown */}
      {dexReaderSize > 0 && (
        <div>
          <div
            style={{
              display: 'flex',
              height: '32px',
              borderRadius: '4px',
              overflow: 'hidden',
              backgroundColor: 'var(--win-surface-tertiary)'
            }}
          >
            {/* Individual Manga Segments */}
            {mangaSegments.map((manga, index) => (
              <div
                key={manga.mangaId}
                style={{
                  width: `${manga.percent}%`,
                  backgroundColor: `color-mix(in srgb, var(--accent-color) ${90 - index * 15}%, transparent)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 8px'
                }}
                title={`${manga.title}: ${formatBytes(manga.size)}`}
              >
                {shouldShowLabel(manga.percent) && (
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 500,
                      color: index === 0 ? 'white' : 'var(--win-text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {manga.title} • {formatBytes(manga.size)}
                  </span>
                )}
              </div>
            ))}

            {/* Others Segment */}
            {othersPercent > 0 && (
              <div
                style={{
                  width: `${othersPercent}%`,
                  backgroundColor: 'color-mix(in srgb, var(--win-text-secondary) 20%, transparent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 8px'
                }}
                title={`Others: ${formatBytes(othersSize)}`}
              >
                {shouldShowLabel(othersPercent) && (
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 500,
                      color: 'var(--win-text-secondary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    Others • {formatBytes(othersSize)}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
