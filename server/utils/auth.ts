import type { H3Event } from 'h3'
import { getCookie, setCookie, deleteCookie, createError } from 'h3'
import argon2 from 'argon2'
import jwt from 'jsonwebtoken'
import { useRuntimeConfig } from '#imports'
import type { SessionUser, UserRole } from '~/types'

const TOKEN_COOKIE_NAME = 'auth_token'
const TOKEN_EXPIRES_IN = '7d'

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password)
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password)
  } catch {
    return false
  }
}

export function signSession(user: SessionUser): string {
  const config = useRuntimeConfig()
  if (!config.jwtSecret) {
    throw new Error('JWT secret is not configured')
  }

  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    },
    config.jwtSecret,
    { expiresIn: TOKEN_EXPIRES_IN }
  )
}

export function verifySessionToken(token: string): SessionUser | null {
  const config = useRuntimeConfig()
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as SessionUser
    return decoded
  } catch {
    return null
  }
}

export function setAuthCookie(event: H3Event, token: string): void {
  setCookie(event, TOKEN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7
  })
}

export function clearAuthCookie(event: H3Event): void {
  deleteCookie(event, TOKEN_COOKIE_NAME, { path: '/' })
}

export function getAuthTokenFromCookie(event: H3Event): string | null {
  const token = getCookie(event, TOKEN_COOKIE_NAME)
  return token ?? null
}

export function getUserFromEvent(event: H3Event): SessionUser | null {
  const ctxUser = (event.context as { user?: SessionUser }).user
  if (ctxUser) {
    return ctxUser
  }

  const token = getAuthTokenFromCookie(event)
  if (!token) {
    return null
  }

  return verifySessionToken(token)
}

export function requireUser(event: H3Event): SessionUser {
  const user = getUserFromEvent(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }
  return user
}

export function requireRole(event: H3Event, roles: UserRole[]): SessionUser {
  const user = requireUser(event)
  if (!roles.includes(user.role)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden'
    })
  }
  return user
}

declare module 'h3' {
  interface H3EventContext {
    user?: SessionUser
  }
}

