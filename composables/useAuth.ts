import type { SessionUser } from '~/types'

type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated'

export function useAuth() {
  const user = useState<SessionUser | null>('auth:user', () => null)
  const status = useState<AuthStatus>('auth:status', () => 'idle')

  const fetchMe = async () => {
    status.value = 'loading'
    try {
      // Forward the browser cookie header during SSR so the internal $fetch
      // call carries the auth_token cookie from the original request.
      const headers = import.meta.server ? useRequestHeaders(['cookie']) : undefined
      const res = await $fetch<{ user: SessionUser | null }>('/api/auth/me', { headers })
      user.value = res.user
      status.value = res.user ? 'authenticated' : 'unauthenticated'
    } catch {
      user.value = null
      status.value = 'unauthenticated'
    }
  }

  const login = async (payload: { email: string; password: string }) => {
    status.value = 'loading'
    const res = await $fetch<{ user: SessionUser }>('/api/auth/login', {
      method: 'POST',
      body: payload
    })
    user.value = res.user
    status.value = 'authenticated'
  }

  const register = async (payload: { name: string; email: string; password: string }) => {
    status.value = 'loading'
    const res = await $fetch<{ user: SessionUser }>('/api/auth/register', {
      method: 'POST',
      body: payload
    })
    user.value = res.user
    status.value = 'authenticated'
  }

  const logout = async () => {
    await $fetch('/api/auth/logout', { method: 'POST' })
    user.value = null
    status.value = 'unauthenticated'
    await navigateTo('/login')
  }

  return {
    user,
    status,
    fetchMe,
    login,
    register,
    logout
  }
}

