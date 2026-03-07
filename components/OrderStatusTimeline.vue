<template>
  <div class="w-full max-w-xl mx-auto">
    <ol class="relative border-s border-slate-200">
      <li
        v-for="(step, idx) in steps"
        :key="step.id"
        class="mb-8 ms-6"
      >
        <span
          class="absolute flex items-center justify-center w-6 h-6 rounded-full ring-8 ring-slate-100"
          :style="step.active ? { backgroundColor: step.color ?? '#4f46e5', color: '#fff' } : {}"
          :class="step.active ? '' : 'bg-slate-300 text-slate-600'"
          style="left: -12px"
        >
          <span class="text-xs font-semibold">{{ idx + 1 }}</span>
        </span>
        <h3 class="font-semibold leading-tight" :class="step.active ? 'text-primary-700' : 'text-slate-700'">
          {{ step.name }}
        </h3>
        <p v-if="step.changedAt" class="text-xs text-slate-400 mt-0.5">
          {{ formatDate(step.changedAt) }}
        </p>
      </li>
    </ol>
  </div>
</template>

<script setup lang="ts">
import type { StatusDto } from '~/types'

const props = defineProps<{
  statuses: StatusDto[]
  currentStatusId: number
  history?: { statusId: number; changedAt: string }[]
}>()

const currentIndex = computed(() =>
  props.statuses.findIndex((s) => s.id === props.currentStatusId)
)

const historyMap = computed(() => {
  const map = new Map<number, string>()
  for (const h of props.history ?? []) {
    map.set(h.statusId, h.changedAt)
  }
  return map
})

const steps = computed(() =>
  props.statuses.map((s, idx) => ({
    ...s,
    active: idx <= currentIndex.value,
    changedAt: historyMap.value.get(s.id) ?? null
  }))
)

const formatDate = (iso: string) => new Date(iso).toLocaleString()
</script>
