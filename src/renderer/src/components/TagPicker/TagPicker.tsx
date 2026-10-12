import {
  Fragment,
  useState,
  type ComponentType,
  type JSX,
  type ReactElement,
  type SyntheticEvent
} from 'react'
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
  type TagPickerOnOpenChangeData,
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
  // Fluent caps the list at 80vh, which with a long option list (~76 tags) is too tall to fit
  // below or above the control at any window size, so it ends up beside it. A bounded height
  // lets it open under (or over) the control and scroll inside itself.
  list: {
    maxHeight: '280px'
  },
  disabledOption: {
    color: tokens.colorNeutralForegroundDisabled,
    cursor: 'default'
  }
})

const DisableableTagPickerOption = TagPickerOption as ComponentType<
  TagPickerOptionProps & { disabled?: boolean }
>

const UNGROUPED = ''
const OPTION_SELECTOR = '.fui-TagPickerOption'

export interface TagPickerTagOption {
  readonly id: string
  readonly name: string
  /** Heading to list this option under; options without one are listed ungrouped */
  readonly group?: string
  /** Decorative content shown before the name in the list and on the chip (e.g. a flag) */
  readonly icon?: ReactElement
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

  /**
   * Keep the suggestion list open after picking an option, so several can be picked in a row.
   * Fluent's TagPicker closes it after every pick (its `onOptionClick` calls `setOpen(false)`);
   * this overrides that. Escape, clicking outside and tabbing away still close it.
   * @default false
   */
  readonly keepOpenOnSelect?: boolean

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
  keepOpenOnSelect = false,
  placeholder,
  'aria-label': ariaLabel
}: TagPickerProps): JSX.Element {
  const { t } = useTranslation('common')
  const styles = useStyles()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  const optionById = new Map(options.map((option) => [option.id, option]))

  const handleOptionSelect = (
    _event: SyntheticEvent | Event,
    data: TagPickerOnOptionSelectData
  ): void => {
    onChange(data.selectedOptions)
    setQuery('')
  }

  // Only controlled when keepOpenOnSelect is set; otherwise Fluent manages open state itself.
  // Picking an option asks Fluent to close the list either via a click that lands inside an
  // option or via Enter on the highlighted one. Both are ignored here, which is what tells a
  // pick apart from Escape / outside clicks / blur (those still close it).
  const handleOpenChange = (
    event: SyntheticEvent | Event,
    data: TagPickerOnOpenChangeData
  ): void => {
    const target = event.target
    const isOptionClick = target instanceof Element && target.closest(OPTION_SELECTOR) !== null
    const isEnterKey = 'key' in event && event.key === 'Enter'
    if (keepOpenOnSelect && !data.open && (isOptionClick || isEnterKey)) return
    setOpen(data.open)
  }

  const normalizedQuery = query.trim().toLowerCase()
  const groupedMatches = new Map<string, TagPickerTagOption[]>()
  for (const option of options) {
    // Picked options live on as chips; leaving them in the list with no selected state would
    // make it impossible to tell what's already chosen, especially with keepOpenOnSelect.
    if (selectedIds.includes(option.id)) continue
    if (normalizedQuery !== '' && !option.name.toLowerCase().includes(normalizedQuery)) continue
    const groupName = option.group ?? UNGROUPED
    const bucket = groupedMatches.get(groupName) ?? []
    bucket.push(option)
    groupedMatches.set(groupName, bucket)
  }

  return (
    <FluentTagPicker
      selectedOptions={[...selectedIds]}
      onOptionSelect={handleOptionSelect}
      open={keepOpenOnSelect ? open : undefined}
      onOpenChange={handleOpenChange}
    >
      <TagPickerControl>
        <TagPickerGroup aria-label={ariaLabel}>
          {selectedIds.map((id) => {
            const option = optionById.get(id)
            if (!option) return null
            return (
              <Tag key={id} value={id} shape="rounded" dismissible media={option.icon}>
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
      <TagPickerList className={styles.list}>
        {groupedMatches.size === 0
          ? t('message.info.noOptionsFound')
          : [...groupedMatches.entries()].map(([groupName, tags]) => {
              const renderedOptions = tags.map((tag) => {
                const disabled = disabledIds.includes(tag.id)
                return (
                  <DisableableTagPickerOption
                    key={tag.id}
                    value={tag.id}
                    disabled={disabled}
                    media={tag.icon}
                    className={mergeClasses(disabled && styles.disabledOption)}
                  >
                    {tag.name}
                  </DisableableTagPickerOption>
                )
              })
              return groupName === UNGROUPED ? (
                <Fragment key={UNGROUPED}>{renderedOptions}</Fragment>
              ) : (
                <TagPickerOptionGroup key={groupName} label={groupName}>
                  {renderedOptions}
                </TagPickerOptionGroup>
              )
            })}
      </TagPickerList>
    </FluentTagPicker>
  )
}
