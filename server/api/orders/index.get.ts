import { defineEventHandler, getQuery } from 'h3'
import { prisma } from '../../utils/prisma'
import { requireUser } from '../../utils/auth'

const ALLOWED_SORT_KEYS = new Set(['trackingCode', 'createdAt', 'statusName', 'customerName'])

export default defineEventHandler(async (event) => {
  const user = requireUser(event)
  const query = getQuery(event)

  const page = Math.max(1, Number(query.page) || 1)
  const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 25))
  const search = String(query.search || '').trim()
  const sortKey = ALLOWED_SORT_KEYS.has(String(query.sortKey)) ? String(query.sortKey) : 'createdAt'
  const sortDir: 'asc' | 'desc' = query.sortDir === 'asc' ? 'asc' : 'desc'
  const skipCount = query.skipCount === 'true'
  const searchFields = query.searchFields ? String(query.searchFields).split(',').filter(Boolean) : []
  const statusId = query.statusId ? Number(query.statusId) : null

  const mapItems = (items: { id: number; name: string; sourceTrackingCode: string }[]) =>
    items.map((i) => ({ id: i.id, name: i.name, sourceTrackingCode: i.sourceTrackingCode }))

  function buildOrderBy(key: string, dir: 'asc' | 'desc') {
    if (key === 'statusName') return { status: { name: dir } }
    if (key === 'customerName') return { customer: { name: dir } }
    return { [key]: dir }
  }

  const orderBy = buildOrderBy(sortKey, sortDir)

  if (user.role === 'ADMIN') {
    const has = (f: string) => !searchFields.length || searchFields.includes(f)
    const adminOrClauses = search ? [
      has('trackingCode') ? { trackingCode: { contains: search } } : null,
      has('statusName') ? { status: { name: { contains: search } } } : null,
      has('customerName') ? { customer: { name: { contains: search } } } : null,
      has('customerName') ? { customer: { email: { contains: search } } } : null,
    ].filter((c): c is NonNullable<typeof c> => c !== null) : []
    const where = {
      ...(adminOrClauses.length ? { OR: adminOrClauses } : {}),
      ...(statusId ? { statusId } : {}),
    }

    const [total, orders] = await Promise.all([
      skipCount ? Promise.resolve(null) : prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        include: {
          status: true,
          items: true,
          customer: { select: { id: true, name: true, email: true } }
        },
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      })
    ])

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
      })),
      total,
      page,
      pageSize,
    }
  }

  const has = (f: string) => !searchFields.length || searchFields.includes(f)
  const customerOrClauses = search ? [
    has('trackingCode') ? { trackingCode: { contains: search } } : null,
    has('statusName') ? { status: { name: { contains: search } } } : null,
    has('items') ? { items: { some: { name: { contains: search } } } } : null,
  ].filter((c): c is NonNullable<typeof c> => c !== null) : []
  const where = {
    customerId: user.id,
    ...(customerOrClauses.length ? { OR: customerOrClauses } : {}),
    ...(statusId ? { statusId } : {}),
  }

  // 'customerName' sort not applicable for customer view
  const customerOrderBy = sortKey === 'customerName' ? { createdAt: 'desc' as const } : orderBy

  const [total, orders] = await Promise.all([
    skipCount ? Promise.resolve(null) : prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      include: { status: true, items: true },
      orderBy: customerOrderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    })
  ])

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
    })),
    total,  // null when skipCount=true — caller should keep its cached total
    page,
    pageSize,
  }
})
