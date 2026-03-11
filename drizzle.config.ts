import type { Config } from 'drizzle-kit'

export default {
  schema: './src/main/database/schemas/**/*.schema.ts',
  out: './src/main/database/migrations',
  dialect: 'sqlite'
} satisfies Config
