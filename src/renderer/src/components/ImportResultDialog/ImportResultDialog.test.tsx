import { fireEvent, render, screen } from '@testing-library/react'
import { ImportResultDialog, type ImportResult } from './ImportResultDialog'

// Fluent's dialog animates in a way happy-dom can't run; only the dialog's content matters here
vi.mock('../Modal', () => ({
  Modal: (props: { open: boolean; children: React.ReactNode; footer: React.ReactNode }) =>
    props.open ? (
      <div>
        {props.children}
        {props.footer}
      </div>
    ) : null
}))

vi.mock('@renderer/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { count?: number }) =>
      options?.count === undefined ? key : `${key}:${options.count}`
  })
}))

const RESULT: ImportResult = {
  importedMangaCount: 3,
  skippedMangaCount: 0,
  failedMangaCount: 0,
  skippedOtherLanguage: [
    { mangaId: 'vi-1', title: 'Truyen Mot' },
    { mangaId: 'vi-2', title: 'Truyen Hai' }
  ],
  ignoredOtherSourceCount: 4
}

function renderDialog(overrides: Partial<Parameters<typeof ImportResultDialog>[0]> = {}): {
  onAddSkipped: ReturnType<typeof vi.fn<(mangaIds: string[]) => void>>
} {
  const onAddSkipped = vi.fn<(mangaIds: string[]) => void>()
  render(
    <ImportResultDialog
      open
      result={RESULT}
      onClose={vi.fn()}
      onAddSkipped={onAddSkipped}
      {...overrides}
    />
  )
  return { onAddSkipped }
}

function addButton(): HTMLButtonElement {
  return screen.getByRole('button', {
    name: /dialogs:importResult\.skippedLanguages\.(add|adding)/
  })
}

describe('skipped other-language titles', () => {
  it('lists each title with a checkbox, none picked to begin with', () => {
    renderDialog()

    expect(screen.getByText('Truyen Mot')).toBeTruthy()
    expect(screen.getByText('Truyen Hai')).toBeTruthy()
    expect(screen.getByRole('checkbox', { name: 'Truyen Mot' })).toHaveProperty('checked', false)
    expect(addButton()).toHaveProperty('disabled', true)
  })

  it('adds back only the titles that were picked', () => {
    const { onAddSkipped } = renderDialog()

    fireEvent.click(screen.getByRole('checkbox', { name: 'Truyen Hai' }))
    expect(addButton().textContent).toContain(':1')
    fireEvent.click(addButton())

    expect(onAddSkipped).toHaveBeenCalledWith(['vi-2'])
  })

  it('picks every title with select all, and clears them again', () => {
    const { onAddSkipped } = renderDialog()
    const selectAll = screen.getByRole('checkbox', {
      name: 'dialogs:importResult.skippedLanguages.selectAll'
    })

    fireEvent.click(selectAll)
    fireEvent.click(addButton())
    expect(onAddSkipped).toHaveBeenCalledWith(['vi-1', 'vi-2'])

    fireEvent.click(selectAll)
    expect(addButton()).toHaveProperty('disabled', true)
  })

  it('locks the list and the button while the titles are being added', () => {
    renderDialog({ isAddingSkipped: true })

    expect(screen.getByRole('checkbox', { name: 'Truyen Mot' })).toHaveProperty('disabled', true)
    expect(addButton().textContent).toContain('dialogs:importResult.skippedLanguages.adding')
  })

  it('is not offered when the caller cannot add titles back', () => {
    renderDialog({ onAddSkipped: undefined })

    expect(screen.queryByText('Truyen Mot')).toBeNull()
  })

  it('is not shown when nothing was left out', () => {
    renderDialog({ result: { ...RESULT, skippedOtherLanguage: [] } })

    expect(screen.queryByText('Truyen Mot')).toBeNull()
  })

  it('drops a title from the selection once it has been added', () => {
    const { onAddSkipped } = renderDialog()
    fireEvent.click(screen.getByRole('checkbox', { name: 'Truyen Mot' }))

    // The same dialog, now with that title gone from the list
    render(
      <ImportResultDialog
        open
        result={{ ...RESULT, skippedOtherLanguage: [{ mangaId: 'vi-2', title: 'Truyen Hai' }] }}
        onClose={vi.fn()}
        onAddSkipped={onAddSkipped}
      />
    )

    expect(screen.getAllByRole('button', { name: /skippedLanguages\.add/ }).at(-1)).toHaveProperty(
      'disabled',
      true
    )
  })
})

describe('entries from other sources', () => {
  it('says how many were ignored', () => {
    renderDialog()

    expect(screen.getByText('dialogs:importResult.ignoredSources:4')).toBeTruthy()
  })

  it('says nothing when none were', () => {
    renderDialog({ result: { ...RESULT, ignoredOtherSourceCount: 0 } })

    expect(screen.queryByText(/ignoredSources/)).toBeNull()
  })
})
