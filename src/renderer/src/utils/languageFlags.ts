import {
  BD,
  BG,
  BR,
  CN,
  CZ,
  DE,
  DK,
  EE,
  ES,
  FI,
  FR,
  GB,
  GR,
  HK,
  HR,
  HU,
  ID,
  IL,
  IN,
  IR,
  IT,
  JP,
  KR,
  LT,
  LV,
  MX,
  MY,
  NL,
  NO,
  PH,
  PL,
  PT,
  RO,
  RS,
  RU,
  SA,
  SE,
  SK,
  TH,
  TR,
  UA,
  VN
} from 'country-flag-icons/react/3x2'

export type FlagComponent = typeof GB

/**
 * Flag shown for each MangaDex language code. Only the flags listed here are imported, so
 * the rest of the package stays out of the bundle.
 *
 * A language is not a country, so this is a deliberate, best-effort choice per language.
 * Variants of one language (`ja` / `ja-ro`, `ko` / `ko-ro`, `zh` / `zh-ro`) share a flag -
 * the label next to it (code or name) is what tells them apart. Languages with no flag that
 * would not read as a different language (Catalan, for instance, would collide with
 * Spanish) are left out and fall back to a neutral icon.
 */
const LANGUAGE_FLAGS: Readonly<Record<string, FlagComponent>> = {
  en: GB,
  ja: JP,
  'ja-ro': JP,
  ko: KR,
  'ko-ro': KR,
  zh: CN,
  'zh-ro': CN,
  'zh-hk': HK,
  vi: VN,
  es: ES,
  'es-la': MX,
  pt: PT,
  'pt-br': BR,
  de: DE,
  fr: FR,
  it: IT,
  ru: RU,
  pl: PL,
  tr: TR,
  nl: NL,
  hu: HU,
  cs: CZ,
  sv: SE,
  da: DK,
  fi: FI,
  no: NO,
  ar: SA,
  he: IL,
  th: TH,
  id: ID,
  ms: MY,
  tl: PH,
  hi: IN,
  bn: BD,
  uk: UA,
  ro: RO,
  bg: BG,
  el: GR,
  fa: IR,
  sr: RS,
  hr: HR,
  sk: SK,
  lt: LT,
  lv: LV,
  et: EE
}

/**
 * Flag component for a language code, or undefined when there is no sensible flag.
 * Falls back to the base language for regional codes that are not listed (e.g. `en-us`).
 */
export function getLanguageFlag(code: string): FlagComponent | undefined {
  const normalised = code.toLowerCase()
  return LANGUAGE_FLAGS[normalised] ?? LANGUAGE_FLAGS[normalised.split('-')[0]]
}
