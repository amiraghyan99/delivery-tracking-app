import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations'
  },
  datasource: {
    // Use the same DATABASE_URL you already configured in .env
    url: process.env.DATABASE_URL!
  }
})

