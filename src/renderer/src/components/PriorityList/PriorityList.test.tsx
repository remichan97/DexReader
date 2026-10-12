import { fireEvent, render, screen } from '@testing-library/react'
import { PriorityList, type PriorityListItem } from './PriorityList'

vi.mock('@renderer/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      (options?.defaultValue as string | undefined) ?? key
  })
}))

const availableItems: PriorityListItem[] = [
  { value: 'en', label: 'English' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' }
]

describe('PriorityList', () => {
  it('lets items be removed by default', () => {
    const onChange = vi.fn()
    render(<PriorityList items={['en']} availableItems={availableItems} onChange={onChange} />)

    fireEvent.click(screen.getByRole('button', { name: 'Remove English from list' }))

    expect(onChange).toHaveBeenCalledWith([])
  })

  describe('with minItems', () => {
    it('blocks removing, and reordering, while down to the minimum', () => {
      const onChange = vi.fn()
      render(
        <PriorityList
          items={['en']}
          availableItems={availableItems}
          onChange={onChange}
          minItems={1}
        />
      )

      // Every control on the only row is disabled: nothing to reorder, and removing it would
      // leave the list below its minimum
      expect(screen.getByRole('button', { name: 'Remove English from list' })).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Move English up in priority' })).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Move English down in priority' })).toBeDisabled()
    })

    it('explains why removal is blocked', () => {
      render(
        <PriorityList
          items={['en']}
          availableItems={availableItems}
          onChange={vi.fn()}
          minItems={1}
        />
      )

      expect(screen.getByRole('button', { name: 'Remove English from list' })).toHaveAttribute(
        'title',
        'At least 1 required'
      )
    })

    it('does not call onChange when a blocked remove is attempted', () => {
      const onChange = vi.fn()
      render(
        <PriorityList
          items={['en']}
          availableItems={availableItems}
          onChange={onChange}
          minItems={1}
        />
      )

      fireEvent.click(screen.getByRole('button', { name: 'Remove English from list' }))

      expect(onChange).not.toHaveBeenCalled()
    })

    it('allows removal again as soon as another item is on the list', () => {
      const onChange = vi.fn()
      render(
        <PriorityList
          items={['en', 'ja']}
          availableItems={availableItems}
          onChange={onChange}
          minItems={1}
        />
      )

      const removeEnglish = screen.getByRole('button', { name: 'Remove English from list' })
      expect(removeEnglish).toBeEnabled()
      expect(removeEnglish).toHaveAttribute('title', 'Remove')

      fireEvent.click(removeEnglish)

      expect(onChange).toHaveBeenCalledWith(['ja'])
    })

    it('still lets items be added while at the minimum', () => {
      render(
        <PriorityList
          items={['en']}
          availableItems={availableItems}
          onChange={vi.fn()}
          minItems={1}
        />
      )

      expect(screen.getByRole('combobox')).toBeEnabled()
    })
  })
})
