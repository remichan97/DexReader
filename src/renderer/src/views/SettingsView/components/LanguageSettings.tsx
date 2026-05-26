import React from 'react'
import { Select, type SelectOption } from '@renderer/components/Select'
import { Switch } from '@renderer/components/Switch'
import { PriorityList, type PriorityListItem } from '@renderer/components/PriorityList'
import { useTranslation } from '@renderer/hooks/useTranslation'
import { LanguageList } from '@renderer/constants/language-list.constant'

interface LanguageSettingsProps {
  readonly displayLanguage: 'en-GB' | 'en-US' | 'vi-VN'
  readonly onDisplayLanguageChange: (language: 'en-GB' | 'en-US' | 'vi-VN') => void
  readonly syncContentLanguage: boolean
  readonly onSyncContentLanguageChange: (checked: boolean) => void
  readonly contentLanguages: string[]
  readonly onContentLanguagesChange: (languages: string[]) => void
  readonly modifiedSettings: Set<string>
}

export function LanguageSettings({
  displayLanguage,
  onDisplayLanguageChange,
  syncContentLanguage,
  onSyncContentLanguageChange,
  contentLanguages,
  onContentLanguagesChange,
  modifiedSettings
}: LanguageSettingsProps): React.JSX.Element {
  const { t } = useTranslation('settings')

  const languageOptions: SelectOption[] = [
    { value: 'en-GB', label: t('appearance.languageOptions.en-GB') },
    { value: 'en-US', label: t('appearance.languageOptions.en-US') },
    { value: 'vi-VN', label: t('appearance.languageOptions.vi-VN') }
  ]

  // Convert LanguageList to PriorityListItem format
  const contentLanguageOptions: PriorityListItem[] = LanguageList.map((lang) => ({
    value: lang.code,
    label: `${lang.flag} ${lang.name}`
  }))

  return (
    <div className="py-4 flex flex-col gap-5">
      <div>
        <h4 className="appearance-settings__section-title mb-3">
          {t('appearance.languageSection')}
        </h4>
        <p className="text-secondary appearance-settings__description mb-3">
          {t('language.displayLanguageDescription', {
            defaultValue:
              'Choose the language for the application interface. Changing this will affect menus, buttons, and all UI text.'
          })}
        </p>
        <div className={modifiedSettings.has('displayLanguage') ? 'setting-control--modified' : ''}>
          <Select
            value={displayLanguage}
            onChange={(value) => onDisplayLanguageChange(value as typeof displayLanguage)}
            options={languageOptions}
            label={t('appearance.languageLabel')}
            helperText={t('appearance.languageHelper')}
          />
        </div>
      </div>

      <div>
        <h4 className="appearance-settings__section-title mb-3">
          {t('language.contentLanguageSection', { defaultValue: 'Content Language Preferences' })}
        </h4>
        <p className="text-secondary appearance-settings__description mb-3">
          {t('language.contentLanguageDescription', {
            defaultValue:
              'Control which languages of manga content you see when browsing and searching. This filters manga by their available translations.'
          })}
        </p>

        <div
          className={`mt-4 ${
            modifiedSettings.has('syncContentLanguage')
              ? 'setting-control--modified setting-control--inline'
              : ''
          }`}
        >
          <Switch
            checked={syncContentLanguage}
            onChange={onSyncContentLanguageChange}
            label={t('appearance.syncContentLanguage')}
            description={t('appearance.syncContentLanguageDescription')}
          />
        </div>

        {!syncContentLanguage && (
          <div
            className={`mt-4 ${
              modifiedSettings.has('contentLanguages') ? 'setting-control--modified' : ''
            }`}
          >
            <PriorityList
              items={contentLanguages}
              availableItems={contentLanguageOptions}
              onChange={onContentLanguagesChange}
              maxItems={5}
              label={t('appearance.contentLanguages')}
              helperText={t('appearance.contentLanguagesDescription')}
              addButtonLabel={t('appearance.addLanguage')}
            />
            <p className="text-secondary appearance-settings__helper-text mt-2">
              {t('appearance.contentLanguageFallbackInfo')}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
