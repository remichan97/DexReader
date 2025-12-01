import type { JSX } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import {
  Search24Regular,
  Search24Filled,
  Library24Regular,
  Library24Filled,
  ArrowDownload24Regular,
  ArrowDownload24Filled,
  Settings24Regular,
  Settings24Filled
} from '@fluentui/react-icons'
import './Sidebar.css'

/**
 * Represents a single navigation item in the Sidebar.
 *
 * Uses the Fluent UI icon variant pattern:
 * - `icon`: Regular (outlined) variant for inactive state
 * - `iconFilled`: Filled (solid) variant for active state
 */
interface SidebarItem {
  /** Unique identifier for the sidebar item */
  id: string
  /** Display label shown below the icon */
  label: string
  /** Regular icon variant (outlined) for inactive state */
  icon: JSX.Element
  /** Filled icon variant (solid) for active state */
  iconFilled: JSX.Element
  /** Route path to navigate to */
  route: string
}

const sidebarItems: SidebarItem[] = [
  {
    id: 'browse',
    label: 'Browse',
    icon: <Search24Regular />,
    iconFilled: <Search24Filled />,
    route: '/browse'
  },
  {
    id: 'library',
    label: 'Library',
    icon: <Library24Regular />,
    iconFilled: <Library24Filled />,
    route: '/library'
  },
  {
    id: 'downloads',
    label: 'Downloads',
    icon: <ArrowDownload24Regular />,
    iconFilled: <ArrowDownload24Filled />,
    route: '/downloads'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <Settings24Regular />,
    iconFilled: <Settings24Filled />,
    route: '/settings'
  }
]

/**
 * Sidebar navigation component with animated indicator.
 *
 * Features a sliding blue accent bar that animates between active items using
 * spring easing (cubic-bezier with overshoot). Icons switch between Regular
 * and Filled variants to indicate active state, following Windows 11 patterns.
 *
 * **Animation**: Spring easing `cubic-bezier(0.34, 1.56, 0.64, 1)` with 400ms
 * duration creates a satisfying bounce effect. The 1.56 value exceeds 1.0,
 * causing overshoot then settling back.
 *
 * **Icons**: Uses @fluentui/react-icons with Regular/Filled pattern:
 * - Inactive items show Regular (outlined) icons
 * - Active item shows Filled (solid) icon
 *
 * **Indicator Position**: Calculated via offsetTop/offsetHeight, accounts for
 * the indicator element itself by adding +1 offset when accessing children.
 *
 * @example
 * ```tsx
 * <Sidebar />
 * ```
 */
export function Sidebar(): JSX.Element {
  const navigate = useNavigate()
  const location = useLocation()
  const sidebarRef = useRef<HTMLDivElement>(null)
  const [indicatorStyle, setIndicatorStyle] = useState({ top: 0, height: 24, opacity: 0 })

  const handleItemClick = (route: string): void => {
    navigate(route)
  }

  const handleKeyDown = (e: React.KeyboardEvent, route: string): void => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleItemClick(route)
    }
  }

  useEffect(() => {
    const updateIndicator = (): void => {
      if (!sidebarRef.current) return

      const activeIndex = sidebarItems.findIndex(
        (item) => location.pathname === item.route || location.pathname.startsWith(item.route + '/')
      )

      if (activeIndex === -1) {
        setIndicatorStyle({ top: 0, height: 24, opacity: 0 })
        return
      }

      // +1 to skip the indicator element itself
      const activeItem = sidebarRef.current.children[activeIndex + 1] as HTMLElement
      if (activeItem) {
        const top = activeItem.offsetTop + activeItem.offsetHeight / 2 - 12
        setIndicatorStyle({ top, height: 24, opacity: 1 })
      }
    }

    updateIndicator()
  }, [location.pathname])

  return (
    <nav className="sidebar" ref={sidebarRef} aria-label="Main navigation">
      <div
        className="sidebar__indicator"
        style={{
          top: `${indicatorStyle.top}px`,
          height: `${indicatorStyle.height}px`,
          opacity: indicatorStyle.opacity
        }}
      />
      {sidebarItems.map((item) => {
        const isActive =
          location.pathname === item.route || location.pathname.startsWith(item.route + '/')

        return (
          <div
            key={item.id}
            className={`sidebar__item ${isActive ? 'sidebar__item--active' : ''}`}
            data-route={item.route}
            onClick={() => handleItemClick(item.route)}
            onKeyDown={(e) => handleKeyDown(e, item.route)}
            role="button"
            tabIndex={0}
            aria-current={isActive ? 'page' : undefined}
            aria-label={item.label}
          >
            <span className="sidebar__item-icon" aria-hidden="true">
              {isActive ? item.iconFilled : item.icon}
            </span>
            <span className="sidebar__item-label">{item.label}</span>
          </div>
        )
      })}
    </nav>
  )
}
