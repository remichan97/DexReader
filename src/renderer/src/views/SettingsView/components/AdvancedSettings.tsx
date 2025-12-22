import React from 'react'
import { ErrorLogViewer } from '@renderer/components/ErrorLogViewer'

export function AdvancedSettings(): React.JSX.Element {
  return (
    <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <ErrorLogViewer />
    </div>
  )
}
