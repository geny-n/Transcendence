import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: './prisma/schema.prisma',

  datasource: {
    url: env('DATABASE_URL'),
  },

  // @ts-expect-error Prisma CLI supports this, TS types lag behind
  migrate: {
    shadowDatabaseUrl: env('DATABASE_URL'),
  },
})
