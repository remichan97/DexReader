import React, { useState } from 'react'
import { FolderOpen24Regular, ArrowReset24Regular, Delete24Regular } from '@fluentui/react-icons'
import { Button } from '@renderer/components/Button'
import './DangerZoneSettings.css'

export const DangerZoneSettings: React.FC = () => {
  const [isResetting, setIsResetting] = useState(false)
  const [isClearing, setIsClearing] = useState(false)

  const handleOpenFile = async (): Promise<void> => {
    try {
      await globalThis.settings.openFile()
    } catch (error) {
      console.error('Failed to open settings file:', error)
    }
  }

  const handleResetToDefault = async (): Promise<void> => {
    const result = await globalThis.api.showConfirmDialog(
      'Reset Settings to Default?',
      'This will restore all settings to their default values.\n\nYour library and reading progress will NOT be affected.',
      'Reset Settings',
      'Cancel'
    )

    // Check IpcResponse: result.success && result.data means user confirmed
    if (!result.success || !result.data) return

    setIsResetting(true)
    try {
      await globalThis.settings.resetToDefaults()
      // Reload page to reflect new settings
      globalThis.location.reload()
    } catch (error) {
      console.error('Failed to reset settings:', error)
      setIsResetting(false)
    }
  }

  const handleClearAllData = async (): Promise<void> => {
    const result = await globalThis.api.showConfirmDialog(
      'Clear All Data?',
      'This action cannot be undone.\n\nAll of the following will be permanently deleted:\n• Library and collections\n• Reading progress and history\n• All settings and preferences\n\nThe app will restart after clearing data.',
      'Clear All Data',
      'Cancel'
    )

    // Check IpcResponse: result.success && result.data means user confirmed
    if (!result.success || !result.data) return

    setIsClearing(true)
    try {
      await globalThis.settings.clearAllData()
      // App will restart automatically
    } catch (error) {
      console.error('Failed to clear data:', error)
      setIsClearing(false)
    }
  }

  return (
    <div className="danger-zone-settings">
      <h3>Danger Zone</h3>
      <p className="danger-zone-description">Irreversible actions. Proceed with caution.</p>

      <div className="danger-zone-actions">
        {/* Open Settings File */}
        <div className="danger-zone-item">
          <div className="danger-zone-item-info">
            <h4>Open Settings File</h4>
            <p>Edit settings.json directly in your default editor</p>
          </div>
          <Button variant="secondary" icon={<FolderOpen24Regular />} onClick={handleOpenFile}>
            Open File
          </Button>
        </div>

        {/* Reset to Default */}
        <div className="danger-zone-item">
          <div className="danger-zone-item-info">
            <h4>Reset to Default</h4>
            <p>Restore all settings to their default values</p>
          </div>
          <Button
            variant="accent"
            icon={<ArrowReset24Regular />}
            onClick={handleResetToDefault}
            loading={isResetting}
          >
            {isResetting ? 'Resetting...' : 'Reset Settings'}
          </Button>
        </div>

        {/* Clear All Data */}
        <div className="danger-zone-item danger-zone-item-critical">
          <div className="danger-zone-item-info">
            <h4>Clear Data & Reset App</h4>
            <p>Delete all data (library, progress, settings) and restart</p>
          </div>
          <Button
            variant="danger"
            icon={<Delete24Regular />}
            onClick={handleClearAllData}
            loading={isClearing}
          >
            {isClearing ? 'Clearing...' : 'Clear All Data'}
          </Button>
        </div>
      </div>
    </div>
  )
}
