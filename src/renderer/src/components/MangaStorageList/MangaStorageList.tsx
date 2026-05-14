import type { JSX } from 'react'
import { Book20Regular } from '@fluentui/react-icons'
import { Select, type SelectOption } from '@renderer/components/Select'
import { Checkbox } from '@renderer/components/Checkbox'
import { useTranslation } from '@renderer/hooks/useTranslation'
import { formatBytes } from '@renderer/utils/formatBytes'
import './MangaStorageList.css'

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
  const { t } = useTranslation('settings')

  // Sort options for dropdown
  const sortOptions: SelectOption[] = [
    { value: 'storage-desc', label: t('storage.sortOptions.storageLargest') },
    { value: 'storage-asc', label: t('storage.sortOptions.storageSmallest') },
    { value: 'title-asc', label: t('storage.sortOptions.titleAZ') },
    { value: 'title-desc', label: t('storage.sortOptions.titleZA') }
  ]

  const currentSortValue = `${sortBy}-${sortDirection}`

  const handleSortChange = (value: string | string[]): void => {
    const sortValue = typeof value === 'string' ? value : value[0]
    const [newSortBy, newDirection] = sortValue.split('-') as ['title' | 'storage', 'asc' | 'desc']
    onSortChange(newSortBy, newDirection)
  }

  return (
    <div className="manga-storage-list">
      {/* Semi-Header */}
      <div className="manga-storage-list__header flex justify-between items-center">
        <span className="manga-storage-list__header-title">
          {t('storage.mangaStorageHeader', { size: formatBytes(totalSize) })}
        </span>
        <div style={{ minWidth: '200px' }}>
          <Select value={currentSortValue} onChange={handleSortChange} options={sortOptions} />
        </div>
      </div>

      {/* List Container */}
      <div>
        {items.length === 0 ? (
          // Empty State
          <div className="p-10 text-center text-secondary">{t('storage.emptyState')}</div>
        ) : (
          // List Items
          items.map((item, index) => {
            const isSelected = selectedIds.has(item.mangaId)

            return (
              <div key={item.mangaId}>
                <div
                  role="button"
                  tabIndex={0}
                  className={`manga-storage-list__item ${isSelected ? 'manga-storage-list__item--selected' : ''}`}
                  onClick={() => onToggleSelect(item.mangaId)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onToggleSelect(item.mangaId)
                    }
                  }}
                >
                  {/* Checkbox */}
                  <div className="pt-3">
                    <Checkbox
                      checked={isSelected}
                      onChange={() => onToggleSelect(item.mangaId)}
                      aria-label={`Select ${item.mangaTitle}`}
                    />
                  </div>

                  {/* Cover Image */}
                  <div className="manga-storage-list__cover">
                    {item.coverUrl ? (
                      <img
                        src={item.coverUrl}
                        alt={item.mangaTitle}
                        className="manga-storage-list__cover-img"
                      />
                    ) : (
                      <div className="manga-storage-list__cover-empty flex items-center justify-center">
                        <Book20Regular />
                      </div>
                    )}
                  </div>

                  {/* Title + Chapter Info */}
                  <div style={{ minWidth: 0 }}>
                    <div className="manga-storage-list__title">{item.mangaTitle}</div>
                    <div className="manga-storage-list__chapter-info flex items-center gap-1">
                      <Book20Regular style={{ fontSize: '14px' }} />
                      <span>{item.chapterCount} chapters</span>
                    </div>
                  </div>

                  {/* Storage Size */}
                  <div className="manga-storage-list__storage-size">
                    {formatBytes(item.totalStorageSize)}
                  </div>
                </div>

                {/* Dashed Divider (except for last item) */}
                {index < items.length - 1 && <div className="manga-storage-list__divider" />}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
