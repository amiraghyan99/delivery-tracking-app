import { prisma } from './prisma'

const PREFIX = 'DEMO'

function randomBlock(): string {
  return Math.floor(1000 + Math.random() * 9000)
    .toString()
    .slice(0, 4)
}

export function buildTrackingCode(): string {
  return `${PREFIX}-${randomBlock()}-${randomBlock()}-${randomBlock()}`
}

export async function generateUniqueTrackingCode(): Promise<string> {
  let code = buildTrackingCode()
  // In the extremely unlikely case of collision, retry until unique
  // (probability is tiny given 10^12 possibilities).
  // We still guard with a loop to be safe.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await prisma.order.findUnique({
      where: { trackingCode: code }
    })
    if (!existing) {
      return code
    }
    code = buildTrackingCode()
  }
}

