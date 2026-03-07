import { PrismaClient } from '@prisma/client'
import type { PrismaClient as PrismaClientType } from '@prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClientType
}

const dbUrl = new URL(process.env.DATABASE_URL!)
const adapter = new PrismaMariaDb({
  host: dbUrl.hostname,
  port: Number(dbUrl.port) || 3306,
  user: dbUrl.username,
  password: dbUrl.password,
  database: dbUrl.pathname.slice(1),
  allowPublicKeyRetrieval: true,
})

export const prisma: PrismaClientType =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error']
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}