import { defineEventHandler, readBody, createError } from 'h3'
import { prisma } from '../../utils/prisma'
import { requireRole } from '../../utils/auth'
import { z } from 'zod'

const schema = z.object({
  ids: z.array(z.number().int().positive()).min(1),
})

export default defineEventHandler(async (event) => {
  requireRole(event, ['ADMIN'])

  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid request body' })
  }

  const { ids } = parsed.data

  const { count } = await prisma.order.deleteMany({ where: { id: { in: ids } } })

  return { deleted: count }
})
