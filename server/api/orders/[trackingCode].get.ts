import { defineEventHandler, createError } from 'h3'
import { prisma } from '../../utils/prisma'
import { log } from 'console'

export default defineEventHandler(async (event) => {
  const trackingCode = event.context.params?.id
  
  if (!trackingCode || typeof trackingCode !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Tracking code is required'
    })
  }

  const order = await prisma.order.findUnique({
    where: { trackingCode },
    include: {
      status: true,
      items: true,
      statusHistory: {
        include: { status: true },
        orderBy: { changedAt: 'asc' }
      }
    }
  })

  if (!order) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Order not found'
    })
  }

  return {
    order: {
      trackingCode: order.trackingCode,
      statusId: order.statusId,
      statusName: order.status.name,
      statusColor: order.status.color,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: order.items.map((i) => ({ id: i.id, name: i.name, sourceTrackingCode: i.sourceTrackingCode })),
      statusHistory: order.statusHistory.map((h) => ({
        statusId: h.statusId,
        statusName: h.status.name,
        statusColor: h.status.color,
        changedAt: h.changedAt
      }))
    }
  }
})

