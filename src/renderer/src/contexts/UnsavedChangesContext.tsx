import { createContext } from 'react'

export interface UnsavedChangesContextValue {
  hasUnsavedChanges: boolean
  setHasUnsavedChanges: (value: boolean) => void
}

export const UnsavedChangesContext = createContext<UnsavedChangesContextValue | undefined>(
  undefined
)
