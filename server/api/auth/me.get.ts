import { defineEventHandler } from 'h3'
import { getUserFromEvent } from '../../utils/auth'

export default defineEventHandler((event) => {
  const user = getUserFromEvent(event)
  if (!user) {
    return { user: null }
  }
  return { user }
})

