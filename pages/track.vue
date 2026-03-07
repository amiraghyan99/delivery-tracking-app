<template>
  <div class="max-w-xl mx-auto">
    <h1 class="text-2xl font-semibold text-slate-800 mb-2">Track your delivery</h1>
    <p class="text-sm text-slate-500 mb-6">
      Enter your tracking code in the format <span class="font-mono text-xs">DEMO-XXXX-XXXX-XXXX</span>.
    </p>

    <form class="flex flex-col sm:flex-row gap-3 mb-6" @submit.prevent="onSearch">
      <input
        v-model="trackingCode"
        type="text"
        placeholder="DEMO-1234-5678-9012"
        class="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500 outline-none font-mono"
      >
      <button
        type="submit"
        :disabled="loading"
        class="inline-flex items-center justify-center rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 disabled:opacity-60"
      >
        <span v-if="loading">Searching...</span>
        <span v-else>Track</span>
      </button>
    </form>

    <p v-if="error" class="text-sm text-red-600 mb-4">{{ error }}</p>

    <div v-if="order" class="space-y-4">
      <div class="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between">
        <div>
          <div class="text-xs font-medium text-slate-500 mb-1">Tracking code</div>
          <div class="font-mono text-sm text-slate-800">{{ order.trackingCode }}</div>
        </div>
        <div>
          <div class="text-xs font-medium text-slate-500 mb-1">Status</div>
          <span
            class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
            :style="{ backgroundColor: order.statusColor ?? '#94a3b8' }"
          >
            {{ order.statusName }}
          </span>
        </div>
      </div>

      <!-- Items -->
      <div v-if="order.items?.length" class="bg-white border border-slate-200 rounded-xl p-4">
        <div class="text-xs font-semibold text-slate-500 mb-3">Items</div>
        <div class="divide-y divide-slate-100">
          <div
            v-for="item in order.items"
            :key="item.id"
            class="flex items-center justify-between py-2 text-xs"
          >
            <span class="font-medium text-slate-800">{{ item.name }}</span>
            <span class="font-mono text-slate-400">{{ item.sourceTrackingCode }}</span>
          </div>
        </div>
      </div>

      <OrderStatusTimeline :statuses="statuses" :current-status-id="order.statusId" :history="order.statusHistory" />
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { trackOrder } = useOrders()
const { statuses, fetchStatuses } = useStatuses()
const { add: addToast } = useToast()

const trackingCode = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const order = ref<{ trackingCode: string; statusId: number; statusName: string; statusColor: string | null; createdAt: string; updatedAt: string; items: { id: number; name: string; sourceTrackingCode: string }[]; statusHistory: { statusId: number; statusName: string; statusColor: string | null; changedAt: string }[] } | null>(null)

onMounted(async () => {
  await fetchStatuses()

  // Auto-search if ?code= is in the URL (e.g. from a toast notification link)
  const code = route.query.code
  if (code && typeof code === 'string') {
    trackingCode.value = code
    await onSearch()
  }

  // Listen for live status updates from the WebSocket (dispatched by useOrderSocket)
  window.addEventListener('order-status-changed', onOrderStatusChanged)
})

onUnmounted(() => {
  window.removeEventListener('order-status-changed', onOrderStatusChanged)
})

function onOrderStatusChanged(e: Event) {
  const data = (e as CustomEvent).detail
  if (!order.value || order.value.trackingCode !== data.trackingCode) return

  const old = order.value.statusName
  order.value = {
    ...order.value,
    items: order.value.items,
    statusId: data.newStatusId,
    statusName: data.newStatusName,
    statusColor: data.newStatusColor,
    statusHistory: [
      ...order.value.statusHistory,
      { statusId: data.newStatusId, statusName: data.newStatusName, statusColor: data.newStatusColor, changedAt: new Date().toISOString() }
    ]
  }

  addToast({
    trackingCode: data.trackingCode,
    oldStatusName: old,
    newStatusName: data.newStatusName,
    newStatusColor: data.newStatusColor
  })
}

const onSearch = async () => {
  error.value = null
  order.value = null
  loading.value = true
  try {
    const res = await trackOrder(trackingCode.value.trim())
    order.value = {
      ...res.order,
      createdAt: typeof res.order.createdAt === 'string' ? res.order.createdAt : new Date(res.order.createdAt).toISOString(),
      updatedAt: typeof res.order.updatedAt === 'string' ? res.order.updatedAt : new Date(res.order.updatedAt).toISOString(),
      items: res.order.items,
      statusHistory: res.order.statusHistory.map((h) => ({
        ...h,
        changedAt: typeof h.changedAt === 'string' ? h.changedAt : new Date(h.changedAt).toISOString()
      }))
    }
  } catch (e: any) {
    error.value = e?.data?.statusMessage || 'Order not found. Please check your tracking code.'
  } finally {
    loading.value = false
  }
}
</script>
