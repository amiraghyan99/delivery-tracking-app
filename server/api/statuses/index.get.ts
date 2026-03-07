import { defineEventHandler } from 'h3'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async () => {
  const statuses = await prisma.status.findMany({
    orderBy: { sortOrder: 'asc' }
  })
  return { statuses }
})
