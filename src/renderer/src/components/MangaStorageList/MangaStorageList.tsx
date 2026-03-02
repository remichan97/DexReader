import type { JSX } from 'react'
import { Book20Regular } from '@fluentui/react-icons'
import { Select, type SelectOption } from '@renderer/components/Select'
import { Checkbox } from '@renderer/components/Checkbox'

interface MangaStorageItem {
  mangaId: string
  mangaTitle: string
  coverUrl?: string
  chapterCount: number
  totalStorageSize: number
}

interface MangaStorageListProps {
  items: MangaStorageItem[]
  totalSize: number
  selectedIds: Set<string>
  sortBy: 'title' | 'storage'
  sortDirection: 'asc' | 'desc'
  onToggleSelect: (mangaId: string) => void
  onSortChange: (sortBy: 'title' | 'storage', direction: 'asc' | 'desc') => void
}

export function MangaStorageList({
  items,
  totalSize,
  selectedIds,
  sortBy,
  sortDirection,
  onToggleSelect,
  onSortChange
}: Readonly<MangaStorageListProps>): JSX.Element {
  // Format bytes to human-readable
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`
  }

  // Sort options for dropdown
  const sortOptions: SelectOption[] = [
    { value: 'storage-desc', label: 'Storage (Largest First)' },
    { value: 'storage-asc', label: 'Storage (Smallest First)' },
    { value: 'title-asc', label: 'Title (A-Z)' },
    { value: 'title-desc', label: 'Title (Z-A)' }
  ]

  const currentSortValue = `${sortBy}-${sortDirection}`

  const handleSortChange = (value: string | string[]): void => {
    const sortValue = typeof value === 'string' ? value : value[0]
    const [newSortBy, newDirection] = sortValue.split('-') as ['title' | 'storage', 'asc' | 'desc']
    onSortChange(newSortBy, newDirection)
  }

  return (
    <div
      style={{
        border: '1px solid var(--win-border-default)',
        borderRadius: '6px',
        overflow: 'hidden',
        backgroundColor: 'var(--win-surface-default)'
      }}
    >
      {/* Semi-Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          backgroundColor: 'var(--win-surface-secondary)',
          borderBottom: '1px solid var(--win-border-default)'
        }}
      >
        <span
          style={{
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--win-text-primary)'
          }}
        >
          Manga Storage ({formatBytes(totalSize)})
        </span>
        <div style={{ minWidth: '200px' }}>
          <Select value={currentSortValue} onChange={handleSortChange} options={sortOptions} />
        </div>
      </div>

      {/* List Container */}
      <div>
        {items.length === 0 ? (
          // Empty State
          <div
            style={{
              padding: '40px 16px',
              textAlign: 'center',
              color: 'var(--win-text-secondary)'
            }}
          >
            No downloads found
          </div>
        ) : (
          // List Items
          items.map((item, index) => {
            const isSelected = selectedIds.has(item.mangaId)

            return (
              <div key={item.mangaId}>
                <div
                  role="button"
                  tabIndex={0}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'auto auto 1fr auto',
                    gap: '12px',
                    alignItems: 'start',
                    padding: '12px 16px',
                    backgroundColor: isSelected ? 'var(--win-surface-tertiary)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'background-color 0.1s'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'var(--win-surface-secondary)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }
                  }}
                  onClick={() => onToggleSelect(item.mangaId)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onToggleSelect(item.mangaId)
                    }
                  }}
                >
                  {/* Checkbox */}
                  <div style={{ paddingTop: '14px' }}>
                    <Checkbox
                      checked={isSelected}
                      onChange={() => onToggleSelect(item.mangaId)}
                      aria-label={`Select ${item.mangaTitle}`}
                    />
                  </div>

                  {/* Cover Image */}
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      backgroundColor: 'var(--win-surface-tertiary)',
                      flexShrink: 0
                    }}
                  >
                    {item.coverUrl ? (
                      <img
                        src={item.coverUrl}
                        alt={item.mangaTitle}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--win-text-tertiary)'
                        }}
                      >
                        <Book20Regular />
                      </div>
                    )}
                  </div>

                  {/* Title + Chapter Info */}
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: 500,
                        color: 'var(--win-text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        marginBottom: '4px'
                      }}
                    >
                      {item.mangaTitle}
                    </div>
                    <div
                      style={{
                        fontSize: '12px',
                        color: 'var(--win-text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Book20Regular style={{ fontSize: '14px' }} />
                      <span>{item.chapterCount} chapters</span>
                    </div>
                  </div>

                  {/* Storage Size */}
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: 500,
                      color: 'var(--win-text-primary)',
                      textAlign: 'right',
                      whiteSpace: 'nowrap',
                      paddingTop: '2px'
                    }}
                  >
                    {formatBytes(item.totalStorageSize)}
                  </div>
                </div>

                {/* Dashed Divider (except for last item) */}
                {index < items.length - 1 && (
                  <div
                    style={{
                      height: '1px',
                      background:
                        'repeating-linear-gradient(to right, var(--win-border-default) 0, var(--win-border-default) 4px, transparent 4px, transparent 8px)',
                      margin: '0'
                    }}
                  />
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
