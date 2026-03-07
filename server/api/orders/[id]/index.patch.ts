import { defineEventHandler, readBody, createError } from 'h3'
import { prisma } from '../../../utils/prisma'
import { requireRole } from '../../../utils/auth'
import { z } from 'zod'
import { orderItemSchema } from '../../../utils/validators'

const updateOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, 'At least one item is required')
})

export default defineEventHandler(async (event) => {
  const user = requireRole(event, ['CUSTOMER'])

  const id = Number(event.context.params?.id)
  if (!id || Number.isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid order id' })
  }

  const order = await prisma.order.findUnique({ where: { id } })
  if (!order) throw createError({ statusCode: 404, statusMessage: 'Order not found' })
  if (order.customerId !== user.id) throw createError({ statusCode: 403, statusMessage: 'Forbidden' })

  const body = await readBody(event)
  const parsed = updateOrderSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid input', data: parsed.error.flatten() })
  }

  // Replace all items: delete existing, create new
  await prisma.$transaction([
    prisma.orderItem.deleteMany({ where: { orderId: id } }),
    prisma.orderItem.createMany({ data: parsed.data.items.map((i) => ({ orderId: id, ...i })) })
  ])

  const updated = await prisma.order.findUnique({
    where: { id },
    include: { status: true, items: true }
  })

  return {
    order: {
      id: updated!.id,
      trackingCode: updated!.trackingCode,
      statusId: updated!.statusId,
      statusName: updated!.status.name,
      statusColor: updated!.status.color,
      customerId: updated!.customerId,
      createdAt: updated!.createdAt,
      updatedAt: updated!.updatedAt,
      items: updated!.items.map((i) => ({ id: i.id, name: i.name, sourceTrackingCode: i.sourceTrackingCode }))
    }
  }
})
