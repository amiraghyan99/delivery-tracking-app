import { defineEventHandler, readBody, createError } from 'h3'
import { z } from 'zod'
import { prisma } from '../../utils/prisma'
import { requireRole } from '../../utils/auth'

const schema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color').nullable().optional(),
  sortOrder: z.number().int().min(0).optional()
})

export default defineEventHandler(async (event) => {
  requireRole(event, ['ADMIN'])

  const id = Number(event.context.params?.id)
  if (!id || Number.isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid id' })
  }

  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid input', data: parsed.error.flatten() })
  }

  const status = await prisma.status.update({ where: { id }, data: parsed.data })
  return { status }
})
