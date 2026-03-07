import { navigateTo } from '#app'

export default defineNuxtRouteMiddleware(async (to) => {
  const publicRoutes = ['/login', '/register', '/track']
  if (publicRoutes.includes(to.path)) {
    return
  }

  const { status, user, fetchMe } = useAuth()

  if (import.meta.server || status.value === 'idle') {
    await fetchMe()
  }

  if (!user.value) {
    return navigateTo('/login')
  }

  const requiredRole = to.meta?.role as 'ADMIN' | 'CUSTOMER' | undefined
  if (requiredRole && user.value.role !== requiredRole) {
    if (user.value.role === 'ADMIN') {
      return navigateTo('/admin')
    }
    return navigateTo('/dashboard')
  }
})

