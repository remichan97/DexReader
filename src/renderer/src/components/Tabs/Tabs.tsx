import {
  createContext,
  useContext,
  useState,
  useId,
  useRef,
  useEffect,
  useMemo,
  useCallback
} from 'react'
import { BaseComponentProps } from '@renderer/types/components'
import './Tabs.css'

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
 * Tabs container component
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
  className = ''
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
      <div className={`tabs ${className}`}>{children}</div>
    </TabsContext.Provider>
  )
}

export interface TabListProps extends BaseComponentProps {
  children: React.ReactNode
}

/**
 * Container for Tab components
 */
export function TabList({ children, className = '' }: Readonly<TabListProps>): React.JSX.Element {
  const { activeValue } = useTabsContext()
  const listRef = useRef<HTMLDivElement>(null)
  const indicatorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const updateIndicator = (): void => {
      if (!listRef.current || !indicatorRef.current) return

      const activeTab = listRef.current.querySelector('.tab--active') as HTMLElement
      if (activeTab) {
        indicatorRef.current.style.left = `${activeTab.offsetLeft}px`
        indicatorRef.current.style.width = `${activeTab.offsetWidth}px`
      }
    }

    updateIndicator()
    window.addEventListener('resize', updateIndicator)
    return () => window.removeEventListener('resize', updateIndicator)
  }, [activeValue])

  return (
    <div ref={listRef} className={`tab-list ${className}`} role="tablist">
      {children}
      <div ref={indicatorRef} className="tab-list__indicator" />
    </div>
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
  className = '',
  onContextMenu,
  'aria-label': ariaLabel
}: Readonly<TabProps>): React.JSX.Element {
  const { activeValue, setActiveValue } = useTabsContext()
  const id = useId()
  const isActive = activeValue === value

  const handleClick = (): void => {
    if (!disabled) {
      setActiveValue(value)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (disabled) return

    const tabList = e.currentTarget.parentElement
    if (!tabList) return

    const tabs = Array.from(tabList.querySelectorAll('.tab:not(.tab--disabled)'))
    const currentIndex = tabs.indexOf(e.currentTarget)

    let nextIndex: number

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault()
        nextIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1
        break
      case 'ArrowRight':
        e.preventDefault()
        nextIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0
        break
      case 'Home':
        e.preventDefault()
        nextIndex = 0
        break
      case 'End':
        e.preventDefault()
        nextIndex = tabs.length - 1
        break
      default:
        return
    }

    const nextTab = tabs[nextIndex] as HTMLElement
    nextTab?.click()
    nextTab?.focus()
  }

  const tabClasses = ['tab', isActive && 'tab--active', disabled && 'tab--disabled', className]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      id={id}
      type="button"
      role="tab"
      className={tabClasses}
      aria-selected={isActive}
      aria-controls={`panel-${value}`}
      aria-label={ariaLabel}
      tabIndex={isActive ? 0 : -1}
      disabled={disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onContextMenu={onContextMenu}
    >
      {children}
    </button>
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

/**
 * Tab panel content container
 */
export function TabPanel({
  value,
  children,
  className = ''
}: Readonly<TabPanelProps>): React.JSX.Element | null {
  const { activeValue } = useTabsContext()
  const isActive = activeValue === value

  if (!isActive) return null

  return (
    <div
      id={`panel-${value}`}
      role="tabpanel"
      aria-labelledby={value}
      className={`tab-panel ${className}`}
    >
      {children}
    </div>
  )
}
