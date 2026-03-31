import { useContext } from 'react'
import {
  UnsavedChangesContext,
  type UnsavedChangesContextValue
} from '../contexts/UnsavedChangesContext'

export function useUnsavedChanges(): UnsavedChangesContextValue {
  const context = useContext(UnsavedChangesContext)
  if (!context) {
    throw new Error('useUnsavedChanges must be used within UnsavedChangesProvider')
  }
  return context
}
