<template>
  <Teleport to="body">
    <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 items-end pointer-events-none">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="pointer-events-auto w-80 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden"
        >
          <div class="flex items-start gap-3 p-3">
            <span
              class="mt-0.5 flex-shrink-0 w-2.5 h-2.5 rounded-full"
              :style="{ backgroundColor: toast.newStatusColor ?? '#94a3b8' }"
            />
            <div class="flex-1 min-w-0">
              <p class="text-xs font-semibold text-slate-800 truncate">
                Order <span class="font-mono">{{ toast.trackingCode }}</span> updated
              </p>
              <p class="text-xs text-slate-500 mt-0.5">
                <span class="line-through">{{ toast.oldStatusName }}</span>
                &nbsp;→&nbsp;
                <span class="font-medium" :style="{ color: toast.newStatusColor ?? '#64748b' }">
                  {{ toast.newStatusName }}
                </span>
              </p>
            </div>
            <div class="flex flex-col items-end gap-1 flex-shrink-0">
              <NuxtLink
                :to="`/track?code=${encodeURIComponent(toast.trackingCode)}`"
                class="text-xs text-primary-600 hover:underline font-medium"
                @click="dismiss(toast.id)"
              >
                View
              </NuxtLink>
              <button class="text-slate-400 hover:text-slate-600 text-xs" @click="dismiss(toast.id)">
                ✕
              </button>
            </div>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const { toasts, dismiss } = useToast()
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(1rem);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(2rem);
}
</style>
