import { useState, type JSX } from 'react'
import { Menu, MenuTrigger, MenuPopover, MenuList, MenuItem } from '@fluentui/react-components'
import { Edit20Regular, Delete20Regular, MoreHorizontal20Regular } from '@fluentui/react-icons'
import { Button } from '@renderer/components/Button'
import { useTranslation } from '@renderer/hooks/useTranslation'

interface CollectionContextMenuProps {
  readonly collectionName: string
  readonly onEdit: () => void
  readonly onDelete: () => void
}

/**
 * Overflow menu for a collection tab (Edit/Delete), triggered by a visible "more" button
 * rather than right-click. Each non-default collection tab renders its own instance of this
 * as a sibling of the Tab itself, not nested inside it - Tab renders as a real <button>, and
 * a button can't contain another interactive button.
 *
 * Replaces the hand-rolled right-click ContextMenu (manual position tracking, a fixed
 * backdrop to catch outside clicks). Deliberately a click-triggered button rather than
 * hover-reveal icons directly on the tab: Delete is destructive, and hover-reveal lowers the
 * activation energy for an accidental click in a way a deliberate click on a dedicated
 * trigger doesn't - see claude-plans/fluent2-ui-migration-plan.md, Phase 4.
 */
export function CollectionContextMenu({
  collectionName,
  onEdit,
  onDelete
}: CollectionContextMenuProps): JSX.Element {
  const { t } = useTranslation(['common'])
  const [open, setOpen] = useState(false)

  return (
    <Menu open={open} onOpenChange={(_event, data) => setOpen(data.open)}>
      <MenuTrigger disableButtonEnhancement>
        <Button
          variant="ghost"
          size="small"
          className="library-view__collection-tab-menu"
          // MenuPopover renders through a portal, so it falls outside the hover-group's
          // DOM subtree - :hover/:focus-within on the group can't detect "menu is open"
          // once focus moves into it. Forcing opacity here keeps the trigger visible for
          // as long as its own menu is open, regardless of where the pointer/focus is.
          style={open ? { opacity: 1 } : undefined}
          icon={<MoreHorizontal20Regular />}
          aria-label={t('common:action.collectionOptions', { name: collectionName })}
          onClick={(event) => event.stopPropagation()}
        />
      </MenuTrigger>
      <MenuPopover>
        <MenuList>
          <MenuItem icon={<Edit20Regular />} onClick={onEdit}>
            {t('common:action.editCollection')}
          </MenuItem>
          <MenuItem icon={<Delete20Regular />} onClick={onDelete}>
            {t('common:action.deleteCollection')}
          </MenuItem>
        </MenuList>
      </MenuPopover>
    </Menu>
  )
}
