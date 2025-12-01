import type { JSX } from 'react'
import { useState } from 'react'
import { Button } from '@renderer/components/Button'
import { Input } from '@renderer/components/Input'
import { useToast, ToastContainer } from '@renderer/components/Toast'
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

export function SettingsView(): JSX.Element {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [downloading, setDownloading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState<'info' | 'form'>('info')
  const [country, setCountry] = useState('')
  const [languages, setLanguages] = useState<string[]>([])
  const [notifications, setNotifications] = useState(true)
  const [autoUpdate, setAutoUpdate] = useState(false)
  const [analytics, setAnalytics] = useState(true)
  const [options, setOptions] = useState({
    option1: false,
    option2: true,
    option3: false
  })
  const [darkMode, setDarkMode] = useState(false)
  const [compactView, setCompactView] = useState(true)
  const [activeTab, setActiveTab] = useState('general')

  const { show, toasts } = useToast()

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
      show({
        variant: 'success',
        title: 'Settings saved',
        message: 'Your changes have been saved successfully'
      })
    }, 2000)
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
      <h1>Settings</h1>
      <p style={{ marginBottom: '24px' }}>Application settings and preferences</p>

      <h2 style={{ marginBottom: '16px' }}>Component Library Test</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Input Components */}
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

        {/* Button Components */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '16px' }}>
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

        {/* Button Sizes */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Button size="small">Small</Button>
          <Button size="medium">Medium</Button>
          <Button size="large">Large</Button>
        </div>

        {/* Disabled Button */}
        <div>
          <Button disabled>Disabled Button</Button>
        </div>

        {/* Toast Components */}
        <div style={{ marginTop: '32px' }}>
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
              Show Loading
            </Button>
          </div>
        </div>

        {/* ProgressBar Components */}
        <div style={{ marginTop: '32px' }}>
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

        {/* ProgressRing Components */}
        <div style={{ marginTop: '32px' }}>
          <h3 style={{ marginBottom: '12px' }}>Progress Rings</h3>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            <ProgressRing size="small" />
            <ProgressRing size="medium" />
            <ProgressRing size="large" />
            <ProgressRing value={75} size="medium" variant="default" />
            <ProgressRing value={100} size="medium" variant="success" />
            <ProgressRing value={30} size="medium" variant="error" />
          </div>
        </div>

        {/* Checkbox Components */}
        <div style={{ marginTop: '32px' }}>
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

        {/* Select Components */}
        <div style={{ marginTop: '32px' }}>
          <h3 style={{ marginBottom: '12px' }}>Select Dropdowns</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px' }}>
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

        {/* Switch Components */}
        <div style={{ marginTop: '32px' }}>
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

        {/* Badge Components */}
        <div style={{ marginTop: '32px' }}>
          <h3 style={{ marginBottom: '12px' }}>Badges</h3>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <Badge>Default</Badge>
            <Badge variant="success">Completed</Badge>
            <Badge variant="warning">Ongoing</Badge>
            <Badge variant="error">Failed</Badge>
            <Badge variant="info">5 New</Badge>
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '12px', alignItems: 'center' }}>
            <Badge size="small" variant="info">
              Small
            </Badge>
            <Badge size="medium" variant="success">
              Medium
            </Badge>
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '12px', alignItems: 'center' }}>
            <span style={{ fontSize: '14px' }}>Status dots:</span>
            <Badge variant="success" dot />
            <Badge variant="warning" dot />
            <Badge variant="error" dot />
            <Badge variant="info" dot />
          </div>
        </div>

        {/* Tabs Components */}
        <div style={{ marginTop: '32px' }}>
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
                  <Switch checked={autoUpdate} onChange={setAutoUpdate} label="Automatic updates" />
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
                  <Switch checked={compactView} onChange={setCompactView} label="Compact view" />
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
                  style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}
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

        {/* Tooltip Components */}
        <div style={{ marginTop: '32px' }}>
          <h3 style={{ marginBottom: '12px' }}>Tooltips</h3>
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

        {/* Popover Components */}
        <div style={{ marginTop: '32px' }}>
          <h3 style={{ marginBottom: '12px' }}>Popovers</h3>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            <Popover
              content={
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <h4 style={{ margin: 0, fontSize: '14px' }}>User Settings</h4>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--win-text-secondary)' }}>
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
                  <div
                    style={{
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
                  </div>
                  <div
                    style={{
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
                  </div>
                  <div
                    style={{
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
                  </div>
                </div>
              }
              position="bottom"
            >
              <Button variant="secondary">Menu Popover</Button>
            </Popover>
          </div>
        </div>

        {/* Modal Components */}
        <div style={{ marginTop: '32px' }}>
          <h3 style={{ marginBottom: '12px' }}>Custom Modals (App-Specific Content)</h3>
          <p style={{ fontSize: '14px', color: 'var(--win-text-secondary)', marginBottom: '12px' }}>
            Note: For standard dialogs (info/warning/confirm/error), use native Electron dialogs
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

      {/* Keyboard Shortcuts Modal - App-specific content */}
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
                <span>Toggle Sidebar</span>
                <kbd
                  style={{
                    padding: '2px 6px',
                    background: 'var(--win-bg-subtle)',
                    borderRadius: '4px'
                  }}
                >
                  Ctrl+B
                </kbd>
              </div>
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

      {/* Form Modal - Complex form with multiple inputs */}
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

      <ToastContainer toasts={toasts} position="bottom-right" />
    </div>
  )
}
