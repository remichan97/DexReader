import { createContext, useContext, useState, useMemo, type ReactNode } from 'react'

interface UnsavedChangesContextValue {
  hasUnsavedChanges: boolean
  setHasUnsavedChanges: (value: boolean) => void
}

const UnsavedChangesContext = createContext<UnsavedChangesContextValue | undefined>(undefined)

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

export function useUnsavedChangesContext(): UnsavedChangesContextValue {
  const context = useContext(UnsavedChangesContext)
  if (!context) {
    throw new Error('useUnsavedChangesContext must be used within UnsavedChangesProvider')
  }
  return context
}
