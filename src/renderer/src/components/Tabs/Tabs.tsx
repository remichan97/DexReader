import { createContext, useContext, useState, useMemo, useCallback } from 'react'
import {
  Tab as FluentTab,
  TabList as FluentTabList,
  makeStyles,
  tokens,
  type SelectTabData,
  type SelectTabEvent
} from '@fluentui/react-components'
import { BaseComponentProps } from '@renderer/types/components'

interface TabsContextValue {
  activeValue: string
  setActiveValue: (value: string) => void
}

const TabsContext = createContext<TabsContextValue | undefined>(undefined)

function useTabsContext(): TabsContextValue {
  const context = useContext(TabsContext)
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs component')
  }
  return context
}

export interface TabsProps extends BaseComponentProps {
  /**
   * Default active tab value (uncontrolled)
   */
  defaultValue?: string

  /**
   * Active tab value (controlled)
   */
  value?: string

  /**
   * Change handler for controlled mode
   */
  onChange?: (value: string) => void

  /**
   * Tab components and panels
   */
  children: React.ReactNode
}

/**
 * Tabs container component, built on Fluent 2's `Tab`/`TabList`
 * (@fluentui/react-components). Fluent has no `TabPanel` equivalent, so that
 * piece - and the controlled/uncontrolled selection state driving it - stays
 * a thin wrapper around Fluent's own selection model
 * (`TabList`'s `selectedValue`/`onTabSelect`).
 *
 * @example
 * ```tsx
 * <Tabs defaultValue="tab1">
 *   <TabList>
 *     <Tab value="tab1">First Tab</Tab>
 *     <Tab value="tab2">Second Tab</Tab>
 *   </TabList>
 *   <TabPanel value="tab1">First content</TabPanel>
 *   <TabPanel value="tab2">Second content</TabPanel>
 * </Tabs>
 * ```
 */
export function Tabs({
  defaultValue,
  value: controlledValue,
  onChange,
  children,
  className
}: Readonly<TabsProps>): React.JSX.Element {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue || '')

  const isControlled = controlledValue !== undefined
  const activeValue = isControlled ? controlledValue : uncontrolledValue

  const setActiveValue = useCallback(
    (newValue: string): void => {
      if (isControlled) {
        onChange?.(newValue)
      } else {
        setUncontrolledValue(newValue)
      }
    },
    [isControlled, onChange]
  )

  const contextValue = useMemo(
    () => ({ activeValue, setActiveValue }),
    [activeValue, setActiveValue]
  )

  return (
    <TabsContext.Provider value={contextValue}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

export interface TabListProps extends BaseComponentProps {
  children: React.ReactNode
}

/**
 * Container for Tab components
 */
export function TabList({ children, className }: Readonly<TabListProps>): React.JSX.Element {
  const { activeValue, setActiveValue } = useTabsContext()

  const handleTabSelect = (_event: SelectTabEvent, data: SelectTabData): void => {
    setActiveValue(data.value as string)
  }

  return (
    <FluentTabList className={className} selectedValue={activeValue} onTabSelect={handleTabSelect}>
      {children}
    </FluentTabList>
  )
}

export interface TabProps extends BaseComponentProps {
  /**
   * Tab value identifier
   */
  value: string

  /**
   * Whether the tab is disabled
   */
  disabled?: boolean

  /**
   * Tab label content
   */
  children: React.ReactNode

  /**
   * Context menu handler
   */
  onContextMenu?: (e: React.MouseEvent<HTMLButtonElement>) => void
}

/**
 * Individual tab button
 */
export function Tab({
  value,
  disabled = false,
  children,
  className,
  onContextMenu,
  'aria-label': ariaLabel
}: Readonly<TabProps>): React.JSX.Element {
  return (
    <FluentTab
      id={`tab-${value}`}
      value={value}
      disabled={disabled}
      className={className}
      aria-label={ariaLabel}
      aria-controls={`panel-${value}`}
      onContextMenu={onContextMenu}
    >
      {children}
    </FluentTab>
  )
}

export interface TabPanelProps extends BaseComponentProps {
  /**
   * Panel value (matches Tab value)
   */
  value: string

  /**
   * Panel content
   */
  children: React.ReactNode
}

const usePanelStyles = makeStyles({
  root: {
    paddingTop: tokens.spacingVerticalL,
    paddingBottom: tokens.spacingVerticalL
  }
})

/**
 * Tab panel content container
 */
export function TabPanel({
  value,
  children,
  className
}: Readonly<TabPanelProps>): React.JSX.Element | null {
  const { activeValue } = useTabsContext()
  const styles = usePanelStyles()
  const isActive = activeValue === value

  if (!isActive) return null

  return (
    <div
      id={`panel-${value}`}
      role="tabpanel"
      aria-labelledby={`tab-${value}`}
      className={className ? `${styles.root} ${className}` : styles.root}
    >
      {children}
    </div>
  )
}
