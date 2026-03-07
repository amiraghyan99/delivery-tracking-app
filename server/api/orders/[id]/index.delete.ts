import { defineEventHandler, createError } from 'h3'
import { prisma } from '../../../utils/prisma'
import { requireRole } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireRole(event, ['CUSTOMER'])

  const id = Number(event.context.params?.id)
  if (!id || Number.isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid order id' })
  }

  const order = await prisma.order.findUnique({ where: { id } })
  if (!order) throw createError({ statusCode: 404, statusMessage: 'Order not found' })
  if (order.customerId !== user.id) throw createError({ statusCode: 403, statusMessage: 'Forbidden' })

  // Delete related records first, then the order
  await prisma.$transaction([
    prisma.orderItem.deleteMany({ where: { orderId: id } }),
    prisma.orderStatusHistory.deleteMany({ where: { orderId: id } }),
    prisma.order.delete({ where: { id } })
  ])

  return { success: true }
})
