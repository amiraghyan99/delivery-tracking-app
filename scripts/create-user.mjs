import { PrismaClient } from '@prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import argon2 from 'argon2'
import { parseArgs } from 'node:util'

const { values } = parseArgs({
  options: {
    name:     { type: 'string' },
    email:    { type: 'string' },
    password: { type: 'string' },
    role:     { type: 'string', default: 'CUSTOMER' },
  },
})

const { name, email, password, role } = values

if (!name || !email || !password) {
  console.error('Usage: npm run create-user -- --name="John" --email="john@example.com" --password="secret" --role=ADMIN|CUSTOMER')
  process.exit(1)
}

if (role !== 'ADMIN' && role !== 'CUSTOMER') {
  console.error('--role must be ADMIN or CUSTOMER')
  process.exit(1)
}

const dbUrl = new URL(process.env.DATABASE_URL)
const adapter = new PrismaMariaDb({
  host: dbUrl.hostname,
  port: Number(dbUrl.port) || 3306,
  user: dbUrl.username,
  password: dbUrl.password,
  database: dbUrl.pathname.slice(1),
  allowPublicKeyRetrieval: true,
})

const prisma = new PrismaClient({ adapter })

const hashed = await argon2.hash(password)
const user = await prisma.user.create({
  data: { name, email, password: hashed, role },
})

console.log(`Created ${user.role} — id: ${user.id}, email: ${user.email}`)
await prisma.$disconnect()
