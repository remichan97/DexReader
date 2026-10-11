import { fireEvent, render, screen } from '@testing-library/react'
import { MangaStorageList } from './MangaStorageList'

vi.mock('@renderer/hooks/useTranslation', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}))

const items = [
  { mangaId: 'manga-1', mangaTitle: 'Berserk', chapterCount: 3, totalStorageSize: 1024 }
]

function renderList(onToggleSelect: (mangaId: string) => void): void {
  render(
    <MangaStorageList
      items={items}
      totalSize={1024}
      selectedIds={new Set()}
      sortBy="storage"
      sortDirection="desc"
      onToggleSelect={onToggleSelect}
      onSortChange={vi.fn()}
    />
  )
}

describe('MangaStorageList', () => {
  it('toggles an item once when its checkbox is clicked', () => {
    const onToggleSelect = vi.fn()
    renderList(onToggleSelect)

    // The click bubbles to the row too; both toggling would cancel the selection out
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select Berserk' }))

    expect(onToggleSelect).toHaveBeenCalledTimes(1)
    expect(onToggleSelect).toHaveBeenCalledWith('manga-1')
  })

  it('toggles an item once when the rest of the row is clicked', () => {
    const onToggleSelect = vi.fn()
    renderList(onToggleSelect)

    fireEvent.click(screen.getByText('Berserk'))

    expect(onToggleSelect).toHaveBeenCalledTimes(1)
    expect(onToggleSelect).toHaveBeenCalledWith('manga-1')
  })
})
