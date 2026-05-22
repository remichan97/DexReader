import { useState } from 'react'
import { BaseComponentProps, DisableableProps } from '@renderer/types/components'
import { Select, SelectOption } from '@renderer/components/Select'
import { Button } from '@renderer/components/Button'
import { useTranslation } from '@renderer/hooks/useTranslation'
import { ChevronUp20Regular, ChevronDown20Regular, Dismiss20Regular } from '@fluentui/react-icons'
import './PriorityList.css'

export interface PriorityListItem {
  value: string
  label: string
  disabled?: boolean
}

export interface PriorityListProps extends BaseComponentProps, DisableableProps {
  /**
   * Current order of selected items (index 0 = highest priority)
   */
  items: string[]

  /**
   * All available options to choose from
   */
  availableItems: PriorityListItem[]

  /**
   * Change handler called when items reorder or change
   */
  onChange: (items: string[]) => void

  /**
   * Maximum number of items allowed
   * @default 5
   */
  maxItems?: number

  /**
   * Label text
   */
  label?: string

  /**
   * Helper text below the list
   */
  helperText?: string

  /**
   * Label for the add button
   * @default "Add item"
   */
  addButtonLabel?: string
}

/**
 * Priority list component with up/down reordering buttons
 *
 * Displays selected items in priority order (top = highest priority) with
 * controls to reorder, remove, and add items. Follows familiar browser
 * language preferences UX patterns.
 *
 * @example
 * ```tsx
 * <PriorityList
 *   items={['en', 'vi', 'ja']}
 *   availableItems={[
 *     { value: 'en', label: 'English' },
 *     { value: 'vi', label: 'Vietnamese' },
 *     { value: 'ja', label: 'Japanese' }
 *   ]}
 *   onChange={setItems}
 *   maxItems={5}
 *   label="Preferred languages"
 * />
 * ```
 */
export function PriorityList({
  items,
  availableItems,
  onChange,
  maxItems = 5,
  disabled = false,
  label,
  helperText,
  addButtonLabel,
  className = '',
  'aria-label': ariaLabel
}: Readonly<PriorityListProps>): React.JSX.Element {
  const { t } = useTranslation('common')
  const [selectedToAdd, setSelectedToAdd] = useState<string>('')

  // Get label for an item value
  const getItemLabel = (value: string): string => {
    return availableItems.find((item) => item.value === value)?.label || value
  }

  // Get available options (exclude already selected items)
  const availableOptions: SelectOption[] = availableItems
    .filter((item) => !items.includes(item.value) && !item.disabled)
    .map((item) => ({
      value: item.value,
      label: item.label
    }))

  // Move item up in priority
  const moveUp = (index: number): void => {
    if (index === 0 || disabled) return
    const newItems = [...items]
    ;[newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]]
    onChange(newItems)
  }

  // Move item down in priority
  const moveDown = (index: number): void => {
    if (index === items.length - 1 || disabled) return
    const newItems = [...items]
    ;[newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]]
    onChange(newItems)
  }

  // Remove item from list
  const removeItem = (index: number): void => {
    if (disabled) return
    const newItems = items.filter((_, i) => i !== index)
    onChange(newItems)
  }

  // Add new item to list
  const handleAdd = (value: string | string[]): void => {
    if (disabled) return
    const valueToAdd = Array.isArray(value) ? value[0] : value
    if (!valueToAdd || items.includes(valueToAdd)) return
    if (items.length >= maxItems) return

    onChange([...items, valueToAdd])
    setSelectedToAdd('')
  }

  const maxItemsReached = items.length >= maxItems
  const defaultAddLabel = addButtonLabel || t('priorityList.add', { defaultValue: 'Add item' })

  return (
    <fieldset
      className={`priority-list ${className}`}
      aria-label={ariaLabel || label}
      disabled={disabled}
    >
      {label && <legend className="priority-list__label">{label}</legend>}

      <div className="priority-list__items">
        {items.length === 0 ? (
          <div className="priority-list__empty">
            {t('priorityList.empty', { defaultValue: 'No items selected' })}
          </div>
        ) : (
          <ul className="priority-list__list">
            {items.map((itemValue, index) => (
              <li
                key={itemValue}
                className="priority-list__item"
                aria-label={`${getItemLabel(itemValue)}, position ${index + 1} of ${items.length}`}
              >
                <span className="priority-list__item-label">{getItemLabel(itemValue)}</span>

                <div className="priority-list__item-controls">
                  <Button
                    variant="secondary"
                    size="small"
                    icon={<ChevronUp20Regular />}
                    onClick={() => moveUp(index)}
                    disabled={disabled || index === 0}
                    aria-label={t('priorityList.moveUpAriaLabel', {
                      item: getItemLabel(itemValue),
                      defaultValue: `Move ${getItemLabel(itemValue)} up in priority`
                    })}
                    title={t('priorityList.moveUp', { defaultValue: 'Move up' })}
                  />

                  <Button
                    variant="secondary"
                    size="small"
                    icon={<ChevronDown20Regular />}
                    onClick={() => moveDown(index)}
                    disabled={disabled || index === items.length - 1}
                    aria-label={t('priorityList.moveDownAriaLabel', {
                      item: getItemLabel(itemValue),
                      defaultValue: `Move ${getItemLabel(itemValue)} down in priority`
                    })}
                    title={t('priorityList.moveDown', { defaultValue: 'Move down' })}
                  />

                  <Button
                    variant="secondary"
                    size="small"
                    icon={<Dismiss20Regular />}
                    onClick={() => removeItem(index)}
                    disabled={disabled}
                    aria-label={t('priorityList.removeAriaLabel', {
                      item: getItemLabel(itemValue),
                      defaultValue: `Remove ${getItemLabel(itemValue)} from list`
                    })}
                    title={t('priorityList.remove', { defaultValue: 'Remove' })}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {!maxItemsReached && availableOptions.length > 0 && (
        <div className="priority-list__add">
          <Select
            value={selectedToAdd}
            onChange={handleAdd}
            options={availableOptions}
            placeholder={defaultAddLabel}
            disabled={disabled}
            aria-label={defaultAddLabel}
          />
        </div>
      )}

      {maxItemsReached && (
        <div className="priority-list__max-notice">
          {t('priorityList.maxReached', {
            max: maxItems,
            defaultValue: `Maximum ${maxItems} items allowed`
          })}
        </div>
      )}

      {helperText && <div className="priority-list__helper">{helperText}</div>}
    </fieldset>
  )
}
