import { defineEventHandler } from 'h3'
import { prisma } from '../../utils/prisma'
import { requireUser } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = requireUser(event)

  const mapItems = (items: { id: number; name: string; sourceTrackingCode: string }[]) =>
    items.map((i) => ({ id: i.id, name: i.name, sourceTrackingCode: i.sourceTrackingCode }))

  if (user.role === 'ADMIN') {
    const orders = await prisma.order.findMany({
      include: {
        status: true,
        items: true,
        customer: { select: { id: true, name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    return {
      orders: orders.map((o) => ({
        id: o.id,
        trackingCode: o.trackingCode,
        statusId: o.statusId,
        statusName: o.status.name,
        statusColor: o.status.color,
        customerId: o.customerId,
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
        customerName: o.customer.name,
        customerEmail: o.customer.email,
        items: mapItems(o.items)
      }))
    }
  }

  const orders = await prisma.order.findMany({
    where: { customerId: user.id },
    include: { status: true, items: true },
    orderBy: { createdAt: 'desc' }
  })

  return {
    orders: orders.map((o) => ({
      id: o.id,
      trackingCode: o.trackingCode,
      statusId: o.statusId,
      statusName: o.status.name,
      statusColor: o.status.color,
      customerId: o.customerId,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
      items: mapItems(o.items)
    }))
  }
})

