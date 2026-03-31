import { useState, useMemo, type ReactNode } from 'react'
import { UnsavedChangesContext, type UnsavedChangesContextValue } from './UnsavedChangesContext'

export function UnsavedChangesProvider({
  children
}: Readonly<{ children: ReactNode }>): React.JSX.Element {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const value = useMemo<UnsavedChangesContextValue>(
    () => ({
      hasUnsavedChanges,
      setHasUnsavedChanges
    }),
    [hasUnsavedChanges]
  )

  return <UnsavedChangesContext.Provider value={value}>{children}</UnsavedChangesContext.Provider>
}
