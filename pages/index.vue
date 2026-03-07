<template>
  <div class="grid gap-8 md:grid-cols-2 items-center">
    <div>
      <h1 class="text-3xl md:text-4xl font-semibold text-slate-900 mb-4">
        Real-time delivery tracking for modern logistics.
      </h1>
      <p class="text-sm md:text-base text-slate-600 mb-6">
        Demo Delivery Tracking lets your customers create and track orders with a simple, secure interface.
        Admins get full visibility and control over every shipment.
      </p>
      <div class="flex flex-col sm:flex-row gap-3">
        <NuxtLink
          to="/track"
          class="inline-flex items-center justify-center rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700"
        >
          Track an order
        </NuxtLink>
        <NuxtLink
          to="/register"
          class="inline-flex items-center justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50"
        >
          Create customer account
        </NuxtLink>
      </div>
    </div>
    <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <p class="text-xs font-medium text-slate-500 mb-2">Live example</p>
      <div class="space-y-3">
        <div class="flex items-center justify-between text-xs">
          <span class="text-slate-500">Sample tracking code</span>
          <span class="font-mono text-slate-800">DEMO-4845-8999-7887</span>
        </div>
        <OrderStatusTimeline :statuses="statuses" :current-status-id="previewStatusId" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { statuses, fetchStatuses } = useStatuses()
onMounted(() => fetchStatuses())
// Preview: highlight the third status (index 2) as "In Transit"
const previewStatusId = computed(() => statuses.value[2]?.id ?? statuses.value[0]?.id ?? 0)
</script>

