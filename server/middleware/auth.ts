import { defineEventHandler } from 'h3'
import { getAuthTokenFromCookie, verifySessionToken } from '../utils/auth'
import type { SessionUser } from '~/types'

export default defineEventHandler((event) => {
  const token = getAuthTokenFromCookie(event)
  if (!token) {
    return
  }

  const user = verifySessionToken(token) as SessionUser | null

  if (user) {
    event.context.user = user
  }
})

