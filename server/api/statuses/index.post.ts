import { defineEventHandler, readBody, createError } from 'h3'
import { z } from 'zod'
import { prisma } from '../../utils/prisma'
import { requireRole } from '../../utils/auth'

const schema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color').optional(),
  sortOrder: z.number().int().min(0).optional()
})

export default defineEventHandler(async (event) => {
  requireRole(event, ['ADMIN'])

  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid input', data: parsed.error.flatten() })
  }

  const { name, color, sortOrder = 0 } = parsed.data

  const existing = await prisma.status.findUnique({ where: { name } })
  if (existing) {
    throw createError({ statusCode: 409, statusMessage: 'A status with this name already exists' })
  }

  const status = await prisma.status.create({ data: { name, color: color ?? null, sortOrder } })
  return { status }
})
