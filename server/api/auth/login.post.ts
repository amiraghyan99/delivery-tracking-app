import { defineEventHandler, readBody, createError } from 'h3'
import { prisma } from '../../utils/prisma'
import { verifyPassword, setAuthCookie, signSession } from '../../utils/auth'
import { loginSchema } from '../../utils/validators'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = loginSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid input',
      data: parsed.error.flatten()
    })
  }

  const { email, password } = parsed.data

  const user = await prisma.user.findUnique({ where: { email } })

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid credentials'
    })
  }

  const valid = await verifyPassword(user.password, password)
  if (!valid) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid credentials'
    })
  }

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

