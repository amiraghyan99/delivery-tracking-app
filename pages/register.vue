<template>
  <div class="max-w-md mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-6">
    <h1 class="text-xl font-semibold mb-1 text-slate-800">Create your account</h1>
    <p class="text-sm text-slate-500 mb-6">Sign up to start tracking your deliveries.</p>

    <form class="space-y-4" @submit.prevent="onSubmit">
      <div>
        <label class="block text-xs font-medium text-slate-600 mb-1">Name</label>
        <input
          v-model="form.name"
          type="text"
          required
          minlength="2"
          class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500 outline-none"
        >
      </div>
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
        <span v-if="submitting">Creating account...</span>
        <span v-else>Create account</span>
      </button>
    </form>

    <p class="mt-4 text-xs text-slate-500">
      Already have an account?
      <NuxtLink to="/login" class="text-primary-700 font-medium hover:underline">
        Sign in
      </NuxtLink>
    </p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false
})

const router = useRouter()
const { register } = useAuth()

const form = reactive({
  name: '',
  email: '',
  password: ''
})

const error = ref<string | null>(null)
const submitting = ref(false)

const onSubmit = async () => {
  error.value = null
  submitting.value = true
  try {
    await register({ ...form })
    router.push('/dashboard')
  } catch (e: any) {
    error.value = e?.data?.statusMessage || 'Unable to register. Please try again.'
  } finally {
    submitting.value = false
  }
}
</script>

