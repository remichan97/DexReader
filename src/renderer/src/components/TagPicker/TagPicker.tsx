import { useState, type ComponentType, type JSX, type SyntheticEvent } from 'react'
import {
  TagPicker as FluentTagPicker,
  TagPickerControl,
  TagPickerGroup,
  TagPickerInput,
  TagPickerList,
  TagPickerOption,
  TagPickerOptionGroup,
  Tag,
  makeStyles,
  mergeClasses,
  tokens,
  type TagPickerOnOptionSelectData,
  type TagPickerOptionProps
} from '@fluentui/react-components'
import { useTranslation } from '@renderer/hooks/useTranslation'

// TagPickerOption delegates to the same useOption_unstable() as Dropdown's Option underneath
// (confirmed in @fluentui/react-combobox/lib/components/Listbox/useOption.js), which does
// read and honour a `disabled` prop - TagPickerOptionProps just doesn't declare it publicly.
// Bridges that typing gap rather than disabling it via an undocumented cast at every call site.
//
// Fluent's own styling hook for this component (useTagPickerOptionStyles_unstable) hardcodes
// `disabled: false` when delegating to the shared Option styling - a deliberate upstream
// choice, not an oversight, since `disabled` isn't an officially supported prop here. The
// click-blocking behaviour still works (it's wired lower, in the shared Option hook), but
// nothing about the rendered option looks different, which would be worse than not disabling
// it at all - a tag a user can click with no visible reason it does nothing. useOptionStyles
// (combobox/Option/useOptionStyles.styles.raw.js) styles its own disabled state as
// `color: tokens.colorNeutralForegroundDisabled; cursor: default` - matched here for visual
// consistency with the rest of the app's disabled options (e.g. Select).
const useStyles = makeStyles({
  disabledOption: {
    color: tokens.colorNeutralForegroundDisabled,
    cursor: 'default'
  }
})

const DisableableTagPickerOption = TagPickerOption as ComponentType<
  TagPickerOptionProps & { disabled?: boolean }
>

export interface TagPickerTagOption {
  readonly id: string
  readonly name: string
  readonly group: string
}

export interface TagPickerProps {
  /**
   * Full set of pickable tags, flattened across all groups - grouped back into
   * `TagPickerOptionGroup`s internally via each option's `group`.
   */
  readonly options: readonly TagPickerTagOption[]

  /**
   * Currently selected tag ids
   */
  readonly selectedIds: readonly string[]

  /**
   * Tag ids to show but not allow selecting - used to cross-exclude this picker's
   * selection from a paired picker's (e.g. a tag already excluded can't also be included)
   */
  readonly disabledIds?: readonly string[]

  /**
   * Called with the full new set of selected ids whenever the selection changes
   */
  readonly onChange: (ids: string[]) => void

  readonly placeholder?: string
  readonly 'aria-label'?: string
}

/**
 * Searchable, multi-select tag picker built on Fluent 2's `TagPicker` compound component
 * (@fluentui/react-components). Selected tags render as dismissible chips in the field
 * itself; the suggestion list is grouped and filtered as the user types - replaces showing
 * every tag at once in a flat checkbox grid, which worked for power users who knew exactly
 * what they wanted but overwhelmed everyone else.
 */
export function TagPicker({
  options,
  selectedIds,
  disabledIds = [],
  onChange,
  placeholder,
  'aria-label': ariaLabel
}: TagPickerProps): JSX.Element {
  const { t } = useTranslation('common')
  const styles = useStyles()
  const [query, setQuery] = useState('')

  const optionById = new Map(options.map((option) => [option.id, option]))

  const handleOptionSelect = (
    _event: SyntheticEvent | Event,
    data: TagPickerOnOptionSelectData
  ): void => {
    onChange(data.selectedOptions)
    setQuery('')
  }

  const normalizedQuery = query.trim().toLowerCase()
  const groupedMatches = new Map<string, TagPickerTagOption[]>()
  for (const option of options) {
    if (normalizedQuery !== '' && !option.name.toLowerCase().includes(normalizedQuery)) continue
    const bucket = groupedMatches.get(option.group) ?? []
    bucket.push(option)
    groupedMatches.set(option.group, bucket)
  }

  return (
    <FluentTagPicker selectedOptions={[...selectedIds]} onOptionSelect={handleOptionSelect}>
      <TagPickerControl>
        <TagPickerGroup aria-label={ariaLabel}>
          {selectedIds.map((id) => {
            const option = optionById.get(id)
            if (!option) return null
            return (
              <Tag key={id} value={id} shape="rounded" dismissible>
                {option.name}
              </Tag>
            )
          })}
        </TagPickerGroup>
        <TagPickerInput
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          aria-label={ariaLabel}
        />
      </TagPickerControl>
      <TagPickerList>
        {groupedMatches.size === 0
          ? t('message.info.noOptionsFound')
          : [...groupedMatches.entries()].map(([groupName, tags]) => (
              <TagPickerOptionGroup key={groupName} label={groupName}>
                {tags.map((tag) => {
                  const disabled = disabledIds.includes(tag.id)
                  return (
                    <DisableableTagPickerOption
                      key={tag.id}
                      value={tag.id}
                      disabled={disabled}
                      className={mergeClasses(disabled && styles.disabledOption)}
                    >
                      {tag.name}
                    </DisableableTagPickerOption>
                  )
                })}
              </TagPickerOptionGroup>
            ))}
      </TagPickerList>
    </FluentTagPicker>
  )
}
