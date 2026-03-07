import { defineEventHandler, createError, readBody } from 'h3'
import { prisma } from '../../utils/prisma'
import { requireRole } from '../../utils/auth'
import { generateUniqueTrackingCode } from '../../utils/tracking'
import { createOrderSchema } from '../../utils/validators'

export default defineEventHandler(async (event) => {
  const user = requireRole(event, ['CUSTOMER'])

  const body = await readBody(event)
  const parsed = createOrderSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid input',
      data: parsed.error.flatten()
    })
  }

  const trackingCode = await generateUniqueTrackingCode()

  const defaultStatus = await prisma.status.findFirst({ orderBy: { sortOrder: 'asc' } })
  if (!defaultStatus) {
    throw createError({ statusCode: 500, statusMessage: 'No statuses configured. Please create at least one status.' })
  }

  const { items } = parsed.data

  const order = await prisma.order.create({
    data: {
      trackingCode,
      customerId: user.id,
      statusId: defaultStatus.id,
      items: { create: items }
    },
    include: { status: true, items: true }
  })

  await prisma.orderStatusHistory.create({
    data: { orderId: order.id, statusId: defaultStatus.id }
  })

  return {
    order: {
      id: order.id,
      trackingCode: order.trackingCode,
      statusId: order.statusId,
      statusName: order.status.name,
      statusColor: order.status.color,
      customerId: order.customerId,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: order.items.map((i) => ({ id: i.id, name: i.name, sourceTrackingCode: i.sourceTrackingCode }))
    }
  }
})

