import type { Config } from 'drizzle-kit'

export default {
  schema: './src/main/database/schema/**/*.schema.ts',
  out: './src/main/database/migrations',
  dialect: 'sqlite'
} satisfies Config
