import { defineEventHandler, readBody, createError } from 'h3'
import { prisma } from '../../../utils/prisma'
import { requireRole } from '../../../utils/auth'
import { broadcast } from '../../../utils/wsPeers'
import { z } from 'zod'

const schema = z.object({
  ids: z.array(z.number().int().positive()).min(1),
  statusId: z.number().int().positive(),
})

export default defineEventHandler(async (event) => {
  requireRole(event, ['ADMIN'])

  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid request body' })
  }

  const { ids, statusId } = parsed.data

  const status = await prisma.status.findUnique({ where: { id: statusId } })
  if (!status) {
    throw createError({ statusCode: 404, statusMessage: 'Status not found' })
  }

  await prisma.$transaction([
    prisma.order.updateMany({ where: { id: { in: ids } }, data: { statusId } }),
    prisma.orderStatusHistory.createMany({
      data: ids.map((orderId) => ({ orderId, statusId })),
    }),
  ])

  // Fetch updated orders to broadcast and return
  const updated = await prisma.order.findMany({
    where: { id: { in: ids } },
    select: { id: true, trackingCode: true, customerId: true, statusId: true },
  })

  for (const order of updated) {
    broadcast({
      type: 'ORDER_STATUS_CHANGED',
      orderId: order.id,
      trackingCode: order.trackingCode,
      customerId: order.customerId,
      newStatusId: status.id,
      newStatusName: status.name,
      newStatusColor: status.color,
    })
  }

  return {
    updated: updated.length,
    statusId: status.id,
    statusName: status.name,
    statusColor: status.color,
  }
})
