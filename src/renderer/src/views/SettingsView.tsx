import type { JSX } from 'react'
import { useState, useEffect } from 'react'
import { useNavigationBlocker } from '@renderer/hooks/useNavigationBlocker'
import { Button } from '@renderer/components/Button'
import { Input } from '@renderer/components/Input'
import { useToastStore } from '@renderer/stores'
import { ProgressBar } from '@renderer/components/ProgressBar'
import { ProgressRing } from '@renderer/components/ProgressRing'
import { Modal } from '@renderer/components/Modal'
import { Select, type SelectOption } from '@renderer/components/Select'
import { Checkbox } from '@renderer/components/Checkbox'
import { Switch } from '@renderer/components/Switch'
import { Badge } from '@renderer/components/Badge'
import { Tabs, TabList, Tab, TabPanel } from '@renderer/components/Tabs'
import { Tooltip } from '@renderer/components/Tooltip'
import { Popover } from '@renderer/components/Popover'
import { Info24Filled } from '@fluentui/react-icons'

export function SettingsView(): JSX.Element {
  // Saved state (initial values)
  const [savedState] = useState({
    username: '',
    password: '',
    email: '',
    country: '',
    languages: [] as string[],
    notifications: true,
    autoUpdate: false,
    analytics: true,
    options: {
      option1: false,
      option2: true,
      option3: false
    },
    darkMode: false,
    compactView: true
  })

  // Current state
  const [username, setUsername] = useState(savedState.username)
  const [password, setPassword] = useState(savedState.password)
  const [email, setEmail] = useState(savedState.email)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [downloading, setDownloading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState<'info' | 'form'>('info')
  const [country, setCountry] = useState(savedState.country)
  const [languages, setLanguages] = useState<string[]>(savedState.languages)
  const [notifications, setNotifications] = useState(savedState.notifications)
  const [autoUpdate, setAutoUpdate] = useState(savedState.autoUpdate)
  const [analytics, setAnalytics] = useState(savedState.analytics)
  const [options, setOptions] = useState(savedState.options)
  const [darkMode, setDarkMode] = useState(savedState.darkMode)
  const [compactView, setCompactView] = useState(savedState.compactView)
  const [activeTab, setActiveTab] = useState('general')

  // Track if there are unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Zustand stores
  const show = useToastStore((state) => state.show)

  // Block navigation when there are unsaved changes
  useNavigationBlocker(
    hasUnsavedChanges,
    'You have unsaved changes. Are you sure you want to leave?'
  )

  // Check for unsaved changes
  useEffect(() => {
    const hasChanges =
      username !== savedState.username ||
      password !== savedState.password ||
      email !== savedState.email ||
      country !== savedState.country ||
      JSON.stringify(languages) !== JSON.stringify(savedState.languages) ||
      notifications !== savedState.notifications ||
      autoUpdate !== savedState.autoUpdate ||
      analytics !== savedState.analytics ||
      JSON.stringify(options) !== JSON.stringify(savedState.options) ||
      darkMode !== savedState.darkMode ||
      compactView !== savedState.compactView

    setHasUnsavedChanges(hasChanges)
  }, [
    username,
    password,
    email,
    country,
    languages,
    notifications,
    autoUpdate,
    analytics,
    options,
    darkMode,
    compactView,
    savedState
  ])

  const allOptionsChecked = Object.values(options).every(Boolean)
  const someOptionsChecked = Object.values(options).some(Boolean) && !allOptionsChecked

  const handleSelectAll = (checked: boolean): void => {
    setOptions({
      option1: checked,
      option2: checked,
      option3: checked
    })
  }

  const countryOptions: SelectOption[] = [
    { value: 'us', label: 'United States' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'ca', label: 'Canada' },
    { value: 'au', label: 'Australia' },
    { value: 'de', label: 'Germany' },
    { value: 'fr', label: 'France' },
    { value: 'jp', label: 'Japan' },
    { value: 'kr', label: 'South Korea' }
  ]

  const languageOptions: SelectOption[] = [
    { value: 'js', label: 'JavaScript' },
    { value: 'ts', label: 'TypeScript' },
    { value: 'py', label: 'Python' },
    { value: 'go', label: 'Go' },
    { value: 'rust', label: 'Rust' },
    { value: 'java', label: 'Java' }
  ]

  const handleSave = (): void => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)

      // Update saved state to current values
      Object.assign(savedState, {
        username,
        password,
        email,
        country,
        languages: [...languages],
        notifications,
        autoUpdate,
        analytics,
        options: { ...options },
        darkMode,
        compactView
      })

      setHasUnsavedChanges(false)
    }, 1000)
  }

  const handleReset = (): void => {
    setUsername(savedState.username)
    setPassword(savedState.password)
    setEmail(savedState.email)
    setCountry(savedState.country)
    setLanguages([...savedState.languages])
    setNotifications(savedState.notifications)
    setAutoUpdate(savedState.autoUpdate)
    setAnalytics(savedState.analytics)
    setOptions({ ...savedState.options })
    setDarkMode(savedState.darkMode)
    setCompactView(savedState.compactView)
  }

  const handleDownload = (): void => {
    setDownloading(true)
    setProgress(0)
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setDownloading(false)
          show({
            variant: 'success',
            title: 'Download complete',
            message: 'Your file has been downloaded'
          })
          return 100
        }
        return prev + 10
      })
    }, 300)
  }

  return (
    <div style={{ padding: '24px' }}>
      <Tabs defaultValue="inputs">
        <TabList>
          <Tab value="inputs">Inputs & Forms</Tab>
          <Tab value="buttons">Buttons & Actions</Tab>
          <Tab value="feedback">Feedback & Progress</Tab>
          <Tab value="overlays">Overlays & Modals</Tab>
          <Tab value="misc">Misc Components</Tab>
        </TabList>

        {/* Tab 1: Inputs & Forms */}
        <TabPanel value="inputs">
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingTop: '16px' }}
          >
            <div>
              <h3 style={{ marginBottom: '12px' }}>Input Components</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <Input
                  label="Username"
                  type="text"
                  value={username}
                  onChange={setUsername}
                  placeholder="Enter your username"
                  helperText="This will be your display name"
                />
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="you@example.com"
                  error={email && !email.includes('@') ? 'Please enter a valid email' : undefined}
                />
                <Input
                  label="Password"
                  type="password"
                  value={password}
                  onChange={setPassword}
                  placeholder="Enter password"
                  maxLength={20}
                  showCounter
                />
              </div>
            </div>

            <div>
              <h3 style={{ marginBottom: '12px' }}>Select Components</h3>
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px' }}
              >
                <Select
                  label="Country"
                  value={country}
                  onChange={(value) => setCountry(value as string)}
                  options={countryOptions}
                  placeholder="Select your country"
                  helperText="Choose your country of residence"
                />
                <Select
                  label="Search Countries"
                  value={country}
                  onChange={(value) => setCountry(value as string)}
                  options={countryOptions}
                  searchable
                  placeholder="Search and select..."
                />
                <Select
                  label="Programming Languages"
                  value={languages}
                  onChange={(value) => setLanguages(value as string[])}
                  options={languageOptions}
                  multiple
                  placeholder="Select languages"
                  helperText={(() => {
                    const count = languages.length
                    if (count === 0) return 'Select one or more languages'
                    return `${count} language${count > 1 ? 's' : ''} selected`
                  })()}
                />
              </div>
            </div>

            <div>
              <h3 style={{ marginBottom: '12px' }}>Checkboxes</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Checkbox
                  checked={notifications}
                  onChange={setNotifications}
                  label="Enable notifications"
                />
                <Checkbox checked={autoUpdate} onChange={setAutoUpdate} label="Automatic updates" />
                <Checkbox
                  checked={analytics}
                  onChange={setAnalytics}
                  label="Help improve the app by sending usage data"
                />
                <Checkbox checked={true} onChange={() => {}} label="Disabled checkbox" disabled />

                <div style={{ marginTop: '16px' }}>
                  <Checkbox
                    checked={allOptionsChecked}
                    indeterminate={someOptionsChecked}
                    onChange={handleSelectAll}
                    label="Select all options"
                  />
                  <div
                    style={{
                      marginLeft: '24px',
                      marginTop: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <Checkbox
                      checked={options.option1}
                      onChange={(checked) => setOptions({ ...options, option1: checked })}
                      label="Option 1"
                    />
                    <Checkbox
                      checked={options.option2}
                      onChange={(checked) => setOptions({ ...options, option2: checked })}
                      label="Option 2"
                    />
                    <Checkbox
                      checked={options.option3}
                      onChange={(checked) => setOptions({ ...options, option3: checked })}
                      label="Option 3"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 style={{ marginBottom: '12px' }}>Toggle Switches</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <Switch
                  checked={darkMode}
                  onChange={setDarkMode}
                  label="Dark Mode"
                  description="Switch between light and dark themes"
                />
                <Switch
                  checked={compactView}
                  onChange={setCompactView}
                  label="Compact View"
                  description="Show more content in less space"
                />
                <Switch
                  checked={autoUpdate}
                  onChange={setAutoUpdate}
                  label="Auto-update Library"
                  description="Automatically check for new chapters every hour"
                />
                <Switch
                  checked={true}
                  onChange={() => {}}
                  label="Premium Feature"
                  description="Available in Pro version"
                  disabled
                />
              </div>
            </div>
          </div>
        </TabPanel>

        {/* Tab 2: Buttons & Actions */}
        <TabPanel value="buttons">
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingTop: '16px' }}
          >
            <div>
              <h3 style={{ marginBottom: '12px' }}>Button Variants</h3>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Button variant="primary" onClick={handleSave} loading={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button variant="secondary" onClick={() => alert('Cancel clicked')}>
                  Cancel
                </Button>
                <Button variant="ghost" onClick={() => alert('Reset clicked')}>
                  Reset
                </Button>
                <Button variant="destructive" onClick={() => alert('Delete clicked')}>
                  Delete Account
                </Button>
              </div>
            </div>

            <div>
              <h3 style={{ marginBottom: '12px' }}>Button Sizes</h3>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <Button size="small">Small</Button>
                <Button size="medium">Medium</Button>
                <Button size="large">Large</Button>
              </div>
            </div>

            <div>
              <h3 style={{ marginBottom: '12px' }}>Disabled State</h3>
              <Button disabled>Disabled Button</Button>
            </div>

            <div>
              <h3 style={{ marginBottom: '12px' }}>Tooltips on Buttons</h3>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                <Tooltip content="Click to save your changes">
                  <Button variant="primary">Save</Button>
                </Tooltip>
                <Tooltip content="Delete this item permanently" position="right">
                  <Button variant="destructive">Delete</Button>
                </Tooltip>
                <Tooltip content="Hover information appears after a brief delay" position="bottom">
                  <Button variant="secondary">Bottom Tooltip</Button>
                </Tooltip>
                <Tooltip
                  content={
                    <div>
                      <strong>Keyboard Shortcut:</strong>
                      <br />
                      Ctrl+S
                    </div>
                  }
                  position="left"
                >
                  <Button variant="ghost">Left Tooltip</Button>
                </Tooltip>
              </div>
            </div>
          </div>
        </TabPanel>

        {/* Tab 3: Feedback & Progress */}
        <TabPanel value="feedback">
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingTop: '16px' }}
          >
            <div>
              <h3 style={{ marginBottom: '12px' }}>Toast Notifications</h3>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Button
                  variant="secondary"
                  onClick={() =>
                    show({
                      variant: 'info',
                      title: 'Information',
                      message: 'This is an informational message'
                    })
                  }
                >
                  Show Info
                </Button>
                <Button
                  variant="secondary"
                  onClick={() =>
                    show({
                      variant: 'success',
                      title: 'Success!',
                      message: 'Operation completed successfully'
                    })
                  }
                >
                  Show Success
                </Button>
                <Button
                  variant="secondary"
                  onClick={() =>
                    show({
                      variant: 'warning',
                      title: 'Warning',
                      message: 'Please review this action'
                    })
                  }
                >
                  Show Warning
                </Button>
                <Button
                  variant="secondary"
                  onClick={() =>
                    show({
                      variant: 'error',
                      title: 'Error',
                      message: 'Something went wrong'
                    })
                  }
                >
                  Show Error
                </Button>
                <Button
                  variant="secondary"
                  onClick={() =>
                    show({
                      variant: 'loading',
                      title: 'Processing',
                      message: 'Please wait while we process your request...',
                      duration: 0
                    })
                  }
                >
                  Show Loading Toast
                </Button>
              </div>
            </div>

            <div>
              <h3 style={{ marginBottom: '12px' }}>Progress Bars</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <ProgressBar value={75} showLabel />
                <ProgressBar value={45} label="Processing..." />
                <ProgressBar />
                {downloading && (
                  <ProgressBar
                    value={progress}
                    showLabel
                    speed="2.5 MB/s"
                    eta={`${Math.ceil((100 - progress) / 10) * 3}s remaining`}
                  />
                )}
                <Button variant="secondary" onClick={handleDownload} disabled={downloading}>
                  {downloading ? 'Downloading...' : 'Start Download'}
                </Button>
              </div>
            </div>

            <div>
              <h3 style={{ marginBottom: '12px' }}>Progress Rings</h3>
              <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
                <ProgressRing size="small" />
                <ProgressRing size="medium" />
                <ProgressRing size="large" />
                <ProgressRing value={75} size="medium" variant="default" />
                <ProgressRing value={100} size="medium" variant="success" />
                <ProgressRing value={30} size="medium" variant="error" />
              </div>
            </div>

            <div>
              <h3 style={{ marginBottom: '12px' }}>Badges</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div
                  style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}
                >
                  <Badge>Default</Badge>
                  <Badge variant="success">Completed</Badge>
                  <Badge variant="warning">Ongoing</Badge>
                  <Badge variant="error">Failed</Badge>
                  <Badge variant="info">5 New</Badge>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <Badge size="small" variant="info">
                    Small
                  </Badge>
                  <Badge size="medium" variant="success">
                    Medium
                  </Badge>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px' }}>Status dots:</span>
                  <Badge variant="success" dot />
                  <Badge variant="warning" dot />
                  <Badge variant="error" dot />
                  <Badge variant="info" dot />
                </div>
              </div>
            </div>
          </div>
        </TabPanel>

        {/* Tab 4: Overlays & Modals */}
        <TabPanel value="overlays">
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingTop: '16px' }}
          >
            <div>
              <h3 style={{ marginBottom: '12px' }}>Popovers</h3>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                <Popover
                  content={
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <h4 style={{ margin: 0, fontSize: '14px' }}>User Settings</h4>
                      <p
                        style={{ margin: 0, fontSize: '13px', color: 'var(--win-text-secondary)' }}
                      >
                        Configure your preferences here.
                      </p>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                        <Button size="small" variant="primary">
                          Apply
                        </Button>
                        <Button size="small" variant="ghost">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  }
                >
                  <Button variant="secondary">Click Popover</Button>
                </Popover>
                <Popover
                  content="This is hover-activated content with useful information"
                  trigger="hover"
                  position="right"
                >
                  <Button variant="ghost">Hover Popover</Button>
                </Popover>
                <Popover
                  content={
                    <div style={{ padding: '4px 0' }}>
                      <button
                        style={{
                          all: 'unset',
                          display: 'block',
                          width: '100%',
                          padding: '8px 12px',
                          cursor: 'pointer',
                          borderRadius: '4px'
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = 'var(--win-bg-hover)')
                        }
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        Profile
                      </button>
                      <button
                        style={{
                          all: 'unset',
                          display: 'block',
                          width: '100%',
                          padding: '8px 12px',
                          cursor: 'pointer',
                          borderRadius: '4px'
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = 'var(--win-bg-hover)')
                        }
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        Settings
                      </button>
                      <button
                        style={{
                          all: 'unset',
                          display: 'block',
                          width: '100%',
                          padding: '8px 12px',
                          cursor: 'pointer',
                          borderRadius: '4px',
                          color: 'var(--win-text-error)'
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = 'var(--win-bg-hover)')
                        }
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        Logout
                      </button>
                    </div>
                  }
                  position="bottom"
                >
                  <Button variant="secondary">Menu Popover</Button>
                </Popover>
              </div>
            </div>

            <div>
              <h3 style={{ marginBottom: '12px' }}>Custom Modals</h3>
              <p
                style={{
                  fontSize: '14px',
                  color: 'var(--win-text-secondary)',
                  marginBottom: '12px'
                }}
              >
                For standard dialogs (info/warning/confirm/error), use native Electron dialogs
                instead
              </p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setModalType('form')
                    setShowModal(true)
                  }}
                >
                  Edit Profile (Complex Form)
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setModalType('info')
                    setShowModal(true)
                  }}
                >
                  Keyboard Shortcuts
                </Button>
              </div>
            </div>
          </div>
        </TabPanel>

        {/* Tab 5: Misc Components */}
        <TabPanel value="misc">
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingTop: '16px' }}
          >
            <div>
              <h3 style={{ marginBottom: '12px' }}>Tabs Navigation</h3>
              <Tabs value={activeTab} onChange={setActiveTab}>
                <TabList>
                  <Tab value="general">General</Tab>
                  <Tab value="appearance">Appearance</Tab>
                  <Tab value="advanced">Advanced</Tab>
                  <Tab value="about">About</Tab>
                </TabList>

                <TabPanel value="general">
                  <div style={{ padding: '16px 0' }}>
                    <h4 style={{ marginBottom: '12px' }}>General Settings</h4>
                    <p style={{ color: 'var(--win-text-secondary)', fontSize: '14px' }}>
                      Configure general application settings and preferences.
                    </p>
                    <div
                      style={{
                        marginTop: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                      }}
                    >
                      <Switch
                        checked={notifications}
                        onChange={setNotifications}
                        label="Enable notifications"
                      />
                      <Switch
                        checked={autoUpdate}
                        onChange={setAutoUpdate}
                        label="Automatic updates"
                      />
                    </div>
                  </div>
                </TabPanel>

                <TabPanel value="appearance">
                  <div style={{ padding: '16px 0' }}>
                    <h4 style={{ marginBottom: '12px' }}>Appearance Settings</h4>
                    <p style={{ color: 'var(--win-text-secondary)', fontSize: '14px' }}>
                      Customize how the application looks and feels.
                    </p>
                    <div
                      style={{
                        marginTop: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                      }}
                    >
                      <Switch checked={darkMode} onChange={setDarkMode} label="Dark theme" />
                      <Switch
                        checked={compactView}
                        onChange={setCompactView}
                        label="Compact view"
                      />
                    </div>
                  </div>
                </TabPanel>

                <TabPanel value="advanced">
                  <div style={{ padding: '16px 0' }}>
                    <h4 style={{ marginBottom: '12px' }}>Advanced Settings</h4>
                    <p style={{ color: 'var(--win-text-secondary)', fontSize: '14px' }}>
                      Advanced configuration options for power users.
                    </p>
                    <div
                      style={{
                        marginTop: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                      }}
                    >
                      <Switch
                        checked={analytics}
                        onChange={setAnalytics}
                        label="Usage analytics"
                        description="Help improve the app by sending usage data"
                      />
                      <Badge variant="warning">Experimental</Badge>
                    </div>
                  </div>
                </TabPanel>

                <TabPanel value="about">
                  <div style={{ padding: '16px 0' }}>
                    <h4 style={{ marginBottom: '12px' }}>About DexReader</h4>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        fontSize: '14px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: 'var(--win-text-secondary)' }}>Version:</span>
                        <Badge variant="info">1.0.0</Badge>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: 'var(--win-text-secondary)' }}>Status:</span>
                        <Badge variant="success">Active</Badge>
                      </div>
                      <p style={{ color: 'var(--win-text-secondary)', marginTop: '8px' }}>
                        A modern manga reader built with Electron and React.
                      </p>
                    </div>
                  </div>
                </TabPanel>
              </Tabs>
            </div>
          </div>
        </TabPanel>
      </Tabs>

      {/* Keyboard Shortcuts Modal */}
      <Modal
        open={showModal && modalType === 'info'}
        onClose={() => setShowModal(false)}
        title="Keyboard Shortcuts"
        size="medium"
        footer={<Button onClick={() => setShowModal(false)}>Close</Button>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h4 style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>Navigation</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Browse</span>
                <kbd
                  style={{
                    padding: '2px 6px',
                    background: 'var(--win-bg-subtle)',
                    borderRadius: '4px'
                  }}
                >
                  Ctrl+1
                </kbd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Library</span>
                <kbd
                  style={{
                    padding: '2px 6px',
                    background: 'var(--win-bg-subtle)',
                    borderRadius: '4px'
                  }}
                >
                  Ctrl+2
                </kbd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Downloads</span>
                <kbd
                  style={{
                    padding: '2px 6px',
                    background: 'var(--win-bg-subtle)',
                    borderRadius: '4px'
                  }}
                >
                  Ctrl+3
                </kbd>
              </div>
            </div>
          </div>
          <div>
            <h4 style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>View</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Settings</span>
                <kbd
                  style={{
                    padding: '2px 6px',
                    background: 'var(--win-bg-subtle)',
                    borderRadius: '4px'
                  }}
                >
                  Ctrl+,
                </kbd>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Form Modal */}
      <Modal
        open={showModal && modalType === 'form'}
        onClose={() => setShowModal(false)}
        title="Edit Profile"
        size="large"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setShowModal(false)
                show({
                  variant: 'success',
                  title: 'Profile updated',
                  message: 'Your profile has been updated successfully'
                })
              }}
            >
              Save Changes
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label="Display Name"
            type="text"
            value={username}
            onChange={setUsername}
            placeholder="Enter your name"
          />
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
          />
          <Input
            label="Bio"
            type="text"
            value=""
            onChange={() => {}}
            placeholder="Tell us about yourself"
          />
        </div>
      </Modal>

      {/* Unsaved Changes Warning Bar */}
      {hasUnsavedChanges && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: '72px',
            right: 0,
            height: '56px',
            background: 'var(--win-accent)',
            color: 'var(--win-text-on-accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.15)',
            zIndex: 1000,
            animation: 'slideUp 200ms ease-out'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Info24Filled />
            <span style={{ fontSize: '14px', fontWeight: 500 }}>You have unsaved changes</span>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button
              variant="ghost"
              size="medium"
              onClick={handleReset}
              style={{
                color: 'var(--win-text-on-accent)',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}
            >
              Reset
            </Button>
            <Button
              variant="primary"
              size="medium"
              onClick={handleSave}
              loading={loading}
              style={{
                background: 'white',
                color: 'var(--win-accent)',
                border: 'none'
              }}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes slideUp {
            from {
              transform: translateY(100%);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
        `}
      </style>
    </div>
  )
}
