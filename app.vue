<template>
  <div class="min-h-screen flex flex-col">
    <header class="bg-white border-b border-slate-200">
      <nav class="container mx-auto flex items-center justify-between py-4 px-4">
        <NuxtLink to="/" class="flex items-center gap-2 font-semibold text-primary-700">
          <span class="inline-flex h-8 w-20 items-center justify-center rounded-lg bg-primary-600 text-white text-sm font-bold">Demo</span>
          <span>Demo Delivery Tracking</span>
        </NuxtLink>
        <div class="flex items-center gap-3 text-sm">
          <NuxtLink to="/track" class="text-slate-600 hover:text-primary-700">
            Track order
          </NuxtLink>
          <template v-if="user">
            <template v-if="user.role === 'ADMIN'">
              <NuxtLink to="/admin" class="text-slate-600 hover:text-primary-700">
                Orders
              </NuxtLink>
              <NuxtLink to="/admin/statuses" class="text-slate-600 hover:text-primary-700">
                Statuses
              </NuxtLink>
            </template>
            <NuxtLink
              v-else
              to="/dashboard"
              class="text-slate-600 hover:text-primary-700"
            >
              Dashboard
            </NuxtLink>
            <button
              class="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              @click="logout"
            >
              Logout
            </button>
          </template>
          <NuxtLink
            v-else
            to="/login"
            class="inline-flex items-center rounded-md bg-primary-600 px-3 py-1.5 text-white text-xs font-semibold shadow hover:bg-primary-700"
          >
            Login
          </NuxtLink>
        </div>
      </nav>
    </header>
    <main class="flex-1 container mx-auto px-4 py-8">
      <NuxtPage />
    </main>
    <footer class="border-t border-slate-200 py-4 text-center text-xs text-slate-500">
      © {{ new Date().getFullYear() }} Demo Delivery Tracking
    </footer>
  </div>
  <AppToast />
</template>

<script setup lang="ts">
const { user, logout } = useAuth()
const { connect, disconnect } = useOrderSocket()

onMounted(() => connect())
onUnmounted(() => disconnect())
</script>

