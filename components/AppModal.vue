<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @mousedown.self="$emit('update:modelValue', false)"
      >
        <div class="absolute inset-0 bg-black/40" />
        <div class="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
          <div class="flex items-center justify-between px-5 py-4 border-b border-slate-200">
            <h2 class="text-base font-semibold text-slate-800">{{ title }}</h2>
            <button
              class="text-slate-400 hover:text-slate-600 text-xl leading-none"
              @click="$emit('update:modelValue', false)"
            >
              ×
            </button>
          </div>
          <div class="overflow-y-auto px-5 py-4 flex-1">
            <slot />
          </div>
          <div v-if="$slots.footer" class="px-5 py-4 border-t border-slate-200 flex justify-end gap-2">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{ modelValue: boolean; title: string }>()
defineEmits<{ 'update:modelValue': [value: boolean] }>()
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.15s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
