# LanguageBadge Component

Shows a language as a flag plus its code or full name. Flags are bundled SVGs from `country-flag-icons`, not emoji (Windows doesn't draw flag emoji), so they look the same on every system.

## Usage

```tsx
import { LanguageBadge, LanguageFlag } from '@renderer/components/LanguageBadge'

<LanguageBadge code="es-la" />              {/* flag + ES-LA */}
<LanguageBadge code="pt-br" label="name" /> {/* flag + Portuguese (Brazil) */}

// Flag only, inside a control that renders its own text
<Select options={[{ value: 'ja', label: 'Japanese', icon: <LanguageFlag code="ja" /> }]} ... />
```

## Props

### LanguageBadge

| Prop        | Type               | Default  | Description                                     |
| ----------- | ------------------ | -------- | ----------------------------------------------- |
| `code`      | `string`           | -        | MangaDex language code (`en`, `ja-ro`, `zh-hk`) |
| `label`     | `'code' \| 'name'` | `'code'` | Short uppercase code, or the full language name |
| `className` | `string`           | -        | Additional class                                |

### LanguageFlag

| Prop        | Type     | Description            |
| ----------- | -------- | ---------------------- |
| `code`      | `string` | MangaDex language code |
| `className` | `string` | Additional class       |

## Behaviour

- The flag is **never shown without text**. Variants of one language share a flag (`ja` / `ja-ro`, `ko` / `ko-ro`, `zh` / `zh-ro`), so the code or name beside it is what tells them apart
- The full language name is the tooltip, and the accessible name when only the code is visible. The flag itself is decorative (`aria-hidden`)
- A language with no sensible flag (for example Catalan, which a Spain flag would confuse with Spanish) gets a neutral globe icon
- Flags are 18×12px with a faint outline so white-heavy flags stay visible on light backgrounds

## Flag mapping

`src/renderer/src/utils/languageFlags.ts` maps each code to a country, and imports only those flags so the rest of the package stays out of the bundle. The choices are deliberate and best-effort, since a language isn't a country: English is the UK flag, Latin American Spanish is Mexico, Traditional Chinese (`zh-hk`) is Hong Kong, Arabic is Saudi Arabia. Unlisted regional codes (`en-us`) fall back to their base language. To change a flag, change it there; `languageFlags.test.ts` checks that every language the filter and settings offer has one.
