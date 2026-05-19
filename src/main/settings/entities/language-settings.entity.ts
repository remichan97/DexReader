import { ContentLanguage } from '../enums/content-language.enum'
import { DisplayLanguage } from '../enums/display-languages.enum'

export interface LanguageSettings {
  displayLanguage: DisplayLanguage
  syncContentLanguage: boolean // Whether to sync the content language with the display language, when false, contentLanguage will be used to determine the content language
  contentLanguage?: ContentLanguage[] // A list of content language to use when syncContentLanguage is false, the index determine the priority. Up to 5 languages can be set
}
