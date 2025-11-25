import type { JSX } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import './Sidebar.css'

interface SidebarProps {
  collapsed: boolean
  onToggle: (collapsed: boolean) => void
}

interface SidebarItem {
  id: string
  label: string
  icon: string
  route: string
}

const sidebarItems: SidebarItem[] = [
  { id: 'browse', label: 'Browse', icon: '🔍', route: '/browse' },
  { id: 'library', label: 'Library', icon: '📚', route: '/library' },
  { id: 'downloads', label: 'Downloads', icon: '⬇️', route: '/downloads' },
  { id: 'settings', label: 'Settings', icon: '⚙️', route: '/settings' }
]

export function Sidebar({ collapsed, onToggle }: SidebarProps): JSX.Element {
  const navigate = useNavigate()
  const location = useLocation()

  const handleItemClick = (route: string) => {
    navigate(route)
  }

  const handleKeyDown = (e: React.KeyboardEvent, route: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleItemClick(route)
    }
  }

  const handleToggle = () => {
    onToggle(!collapsed)
  }

  const handleToggleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleToggle()
    }
  }

  return (
    <nav className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`} aria-label="Main navigation">
      <div
        className="sidebar__toggle"
        onClick={handleToggle}
        onKeyDown={handleToggleKeyDown}
        role="button"
        tabIndex={0}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <span className="sidebar__toggle-icon" aria-hidden="true">
          ≡
        </span>
      </div>
      {sidebarItems.map((item) => {
        const isActive = location.pathname === item.route || location.pathname.startsWith(item.route + '/')

        return (
          <div
            key={item.id}
            className={`sidebar__item ${isActive ? 'sidebar__item--active' : ''}`}
            onClick={() => handleItemClick(item.route)}
            onKeyDown={(e) => handleKeyDown(e, item.route)}
            role="button"
            tabIndex={0}
            aria-current={isActive ? 'page' : undefined}
            aria-label={item.label}
          >
            <span className="sidebar__item-icon" aria-hidden="true">
              {item.icon}
            </span>
            {!collapsed && <span className="sidebar__item-label">{item.label}</span>}
          </div>
        )
      })}
    </nav>
  )
}
