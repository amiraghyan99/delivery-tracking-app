<template>
  <div class="max-w-md mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-6">
    <h1 class="text-xl font-semibold mb-1 text-slate-800">Welcome back</h1>
    <p class="text-sm text-slate-500 mb-6">Sign in to track and manage your deliveries.</p>

    <form class="space-y-4" @submit.prevent="onSubmit">
      <div>
        <label class="block text-xs font-medium text-slate-600 mb-1">Email</label>
        <input
          v-model="form.email"
          type="email"
          required
          class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500 outline-none"
        >
      </div>
      <div>
        <label class="block text-xs font-medium text-slate-600 mb-1">Password</label>
        <input
          v-model="form.password"
          type="password"
          required
          minlength="8"
          class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500 outline-none"
        >
      </div>
      <p v-if="error" class="text-xs text-red-600">
        {{ error }}
      </p>
      <button
        type="submit"
        :disabled="submitting"
        class="w-full inline-flex justify-center items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 disabled:opacity-60"
      >
        <span v-if="submitting">Signing in...</span>
        <span v-else>Sign in</span>
      </button>
    </form>

    <p class="mt-4 text-xs text-slate-500">
      New here?
      <NuxtLink to="/register" class="text-primary-700 font-medium hover:underline">
        Create an account
      </NuxtLink>
    </p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false
})

const router = useRouter()
const { login } = useAuth()

const form = reactive({
  email: '',
  password: ''
})

const error = ref<string | null>(null)
const submitting = ref(false)

const onSubmit = async () => {
  error.value = null
  submitting.value = true
  try {
    await login({ email: form.email, password: form.password })
    const { user } = useAuth()
    if (user.value?.role === 'ADMIN') {
      router.push('/admin')
    } else {
      router.push('/dashboard')
    }
  } catch (e: any) {
    error.value = e?.data?.statusMessage || 'Unable to sign in. Please check your credentials.'
  } finally {
    submitting.value = false
  }
}
</script>

