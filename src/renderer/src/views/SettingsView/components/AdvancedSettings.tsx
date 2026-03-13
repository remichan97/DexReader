import React from 'react'
import { ErrorLogViewer } from '@renderer/components/ErrorLogViewer'

export function AdvancedSettings(): React.JSX.Element {
  return (
    <div className="py-4 flex flex-col gap-5">
      <ErrorLogViewer />
    </div>
  )
}
