import { useTranslation as useI18nTranslation } from 'react-i18next'

/**
 * Wrapper around react-i18next's useTranslation hook
 *
 * Provides centralized translation access with optional namespace parameter.
 * This wrapper allows us to add custom logic or typing in the future if needed.
 *
 * @param namespace - Optional namespace(s) to load. Defaults to 'common'.
 *
 * @example
 * // Use common namespace (default)
 * const { t } = useTranslation()
 * t('button.save') // "Save"
 *
 * @example
 * // Use specific namespace
 * const { t } = useTranslation('errors')
 * t('network.offline.title') // "You're offline"
 *
 * @example
 * // Use multiple namespaces
 * const { t } = useTranslation(['common', 'dialogs'])
 * t('common:button.cancel') // "Cancel"
 * t('dialogs:confirmDelete.title') // "Delete this manga?"
 */
export function useTranslation(
  namespace?: string | string[]
): ReturnType<typeof useI18nTranslation> {
  return useI18nTranslation(namespace)
}
