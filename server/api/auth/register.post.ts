import { defineEventHandler, readBody, createError } from 'h3'
import { prisma } from '../../utils/prisma'
import { hashPassword, setAuthCookie, signSession } from '../../utils/auth'
import { registerSchema } from '../../utils/validators'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = registerSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid input',
      data: parsed.error.flatten()
    })
  }

  const { name, email, password } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email already registered'
    })
  }

  const hashed = await hashPassword(password)

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashed,
      role: 'CUSTOMER'
    }
  })

  const session = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  }

  const token = signSession(session)
  setAuthCookie(event, token)

  return {
    user: session
  }
})

