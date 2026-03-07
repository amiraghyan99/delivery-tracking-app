import { defineEventHandler, readBody, createError } from 'h3'
import { prisma } from '../../utils/prisma'
import { requireRole } from '../../utils/auth'
import { broadcast } from '../../utils/wsPeers'
import { z } from 'zod'

const schema = z.object({
  id: z.number().int().positive(),
  statusId: z.number().int().positive(),
})

export default defineEventHandler(async (event) => {
  requireRole(event, ['ADMIN'])

  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid request body' })
  }

  const { id, statusId } = parsed.data

  const statusExists = await prisma.status.findUnique({ where: { id: statusId } })
  if (!statusExists) {
    throw createError({ statusCode: 404, statusMessage: 'Status not found' })
  }

  const before = await prisma.order.findUnique({
    where: { id },
    include: { status: true }
  })
  if (!before) {
    throw createError({ statusCode: 404, statusMessage: 'Order not found' })
  }

  const [updated] = await prisma.$transaction([
    prisma.order.update({
      where: { id },
      data: { statusId },
      include: { status: true }
    }),
    prisma.orderStatusHistory.create({
      data: { orderId: id, statusId }
    })
  ])

  broadcast({
    type: 'ORDER_STATUS_CHANGED',
    orderId: updated.id,
    trackingCode: updated.trackingCode,
    customerId: updated.customerId,
    oldStatusName: before.status.name,
    newStatusName: updated.status.name,
    newStatusId: updated.statusId,
    newStatusColor: updated.status.color
  })

  return {
    order: {
      id: updated.id,
      trackingCode: updated.trackingCode,
      statusId: updated.statusId,
      statusName: updated.status.name,
      statusColor: updated.status.color,
      customerId: updated.customerId,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt
    }
  }
})
