import { defineEventHandler, createError } from 'h3'
import { prisma } from '../../utils/prisma'
import { requireRole } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  requireRole(event, ['ADMIN'])

  const id = Number(event.context.params?.id)
  if (!id || Number.isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid id' })
  }

  const count = await prisma.order.count({ where: { statusId: id } })
  if (count > 0) {
    throw createError({
      statusCode: 409,
      statusMessage: `Cannot delete: ${count} order(s) are using this status`
    })
  }

  await prisma.status.delete({ where: { id } })
  return { ok: true }
})
