import { PrismaClient } from '@prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

const CUSTOMER_EMAIL = 'customer@example.com'
const ORDER_COUNT = 100

// ---- Tracking code generator (mirrors server/utils/tracking.ts) ----
function randomBlock() {
  return Math.floor(1000 + Math.random() * 9000).toString()
}
function buildTrackingCode() {
  return `DEMO-${randomBlock()}-${randomBlock()}-${randomBlock()}`
}

// ---- Dummy data pools ----
const ITEMS = [
  { name: 'iPhone 16 Pro Max', prefix: 'APL' },
  { name: 'Samsung Galaxy S25 Ultra', prefix: 'SMG' },
  { name: 'Sony WH-1000XM6', prefix: 'SNY' },
  { name: 'Apple MacBook Air M3', prefix: 'APL' },
  { name: 'Logitech MX Master 3S', prefix: 'LGT' },
  { name: 'Nike Air Max 90', prefix: 'NKE' },
  { name: 'Dyson V15 Detect', prefix: 'DYS' },
  { name: 'LG 27" 4K Monitor', prefix: 'LGE' },
  { name: 'Kindle Paperwhite 2024', prefix: 'AMZ' },
  { name: 'Bose QuietComfort 45', prefix: 'BSE' },
  { name: 'GoPro Hero 13 Black', prefix: 'GPR' },
  { name: 'Canon EOS R50', prefix: 'CAN' },
  { name: 'Anker 140W USB-C Charger', prefix: 'ANK' },
  { name: 'Vitamix 5200 Blender', prefix: 'VTX' },
  { name: 'Lego Technic Bugatti', prefix: 'LGO' },
  { name: 'Philips Hue Starter Kit', prefix: 'PHL' },
  { name: 'DJI Mini 4 Pro Drone', prefix: 'DJI' },
  { name: 'Garmin Fenix 8', prefix: 'GRM' },
  { name: 'Nespresso Vertuo Next', prefix: 'NSP' },
  { name: 'PlayStation 5 Slim', prefix: 'SON' },
]

function randomItem() {
  const item = ITEMS[Math.floor(Math.random() * ITEMS.length)]
  const sourceCode = `${item.prefix}-${randomBlock()}-${randomBlock()}`
  return { name: item.name, sourceTrackingCode: sourceCode }
}

function randomItemCount() {
  // 60% single item, 30% two items, 10% three items
  const r = Math.random()
  if (r < 0.6) return 1
  if (r < 0.9) return 2
  return 3
}

function randomDate(daysBack = 180) {
  const ms = Date.now() - Math.floor(Math.random() * daysBack * 24 * 60 * 60 * 1000)
  return new Date(ms)
}

// ---- DB setup ----
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

// ---- Main ----
const customer = await prisma.user.findUnique({ where: { email: CUSTOMER_EMAIL } })
if (!customer) {
  console.error(`User not found: ${CUSTOMER_EMAIL}`)
  await prisma.$disconnect()
  process.exit(1)
}

const statuses = await prisma.status.findMany()
if (!statuses.length) {
  console.error('No statuses found. Create at least one status before seeding orders.')
  await prisma.$disconnect()
  process.exit(1)
}

console.log(`Seeding ${ORDER_COUNT} orders for ${customer.email} (id: ${customer.id})…`)

// Generate unique tracking codes up front
const usedCodes = new Set(
  (await prisma.order.findMany({ select: { trackingCode: true } })).map((o) => o.trackingCode)
)

function uniqueCode() {
  let code
  do { code = buildTrackingCode() } while (usedCodes.has(code))
  usedCodes.add(code)
  return code
}

let created = 0
for (let i = 0; i < ORDER_COUNT; i++) {
  const status = statuses[Math.floor(Math.random() * statuses.length)]
  const createdAt = randomDate()
  const items = Array.from({ length: randomItemCount() }, randomItem)

  await prisma.order.create({
    data: {
      trackingCode: uniqueCode(),
      statusId: status.id,
      customerId: customer.id,
      createdAt,
      updatedAt: createdAt,
      items: { create: items },
      statusHistory: { create: { statusId: status.id, changedAt: createdAt } },
    },
  })
  created++
  if (created % 10 === 0) process.stdout.write(`  ${created}/${ORDER_COUNT}\n`)
}

console.log(`Done. Created ${created} orders.`)
await prisma.$disconnect()
