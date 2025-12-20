import type { JSX } from 'react'
import { useEffect, useCallback } from 'react'
import { Select, type SelectOption } from '../Select'
import './ReadingModeSelector.css'

export type ReadingMode = 'single' | 'double' | 'vertical'

export interface ReadingModeSelectorProps {
  value: ReadingMode
  onChange: (mode: ReadingMode) => void
  disabled?: boolean
}

export function ReadingModeSelector({
  value,
  onChange,
  disabled = false
}: ReadingModeSelectorProps): JSX.Element {
  // Cycle through modes with M key
  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger if user is typing in an input field
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
      }

      if (event.key === 'm' || event.key === 'M') {
        event.preventDefault()
        const modes: ReadingMode[] = ['single', 'double', 'vertical']
        const currentIndex = modes.indexOf(value)
        const nextIndex = (currentIndex + 1) % modes.length
        onChange(modes[nextIndex])
      }
    },
    [value, onChange]
  )

  useEffect(() => {
    globalThis.addEventListener('keydown', handleKeyPress)
    return () => globalThis.removeEventListener('keydown', handleKeyPress)
  }, [handleKeyPress])

  const options: SelectOption[] = [
    {
      value: 'single',
      label: 'Single Page'
    },
    {
      value: 'double',
      label: 'Double Page'
    },
    {
      value: 'vertical',
      label: 'Vertical Scroll'
    }
  ]

  return (
    <div className="reading-mode-selector">
      <Select
        value={value}
        onChange={(newValue) => onChange(newValue as ReadingMode)}
        options={options}
        disabled={disabled}
        label="Reading Mode"
        helperText="Press M to cycle modes"
      />
    </div>
  )
}
