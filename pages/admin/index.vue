<template>
  <div>
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-800">Admin dashboard</h1>
        <p class="text-sm text-slate-500">Manage and update all customer orders.</p>
      </div>
      <input
        v-model="search"
        type="text"
        placeholder="Search by tracking code"
        class="w-full sm:w-64 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500 outline-none"
      >
    </div>

    <div class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <table class="min-w-full text-sm">
        <thead class="bg-slate-50 border-b border-slate-200">
          <tr>
            <th class="px-4 py-3 text-left font-semibold text-xs text-slate-500">Tracking code</th>
            <th class="px-4 py-3 text-left font-semibold text-xs text-slate-500">Customer</th>
            <th class="px-4 py-3 text-left font-semibold text-xs text-slate-500">Items</th>
            <th class="px-4 py-3 text-left font-semibold text-xs text-slate-500">Status</th>
            <th class="px-4 py-3 text-left font-semibold text-xs text-slate-500">Created</th>
            <th class="px-4 py-3 text-left font-semibold text-xs text-slate-500">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="order in filteredOrders"
            :key="order.id"
            class="border-b border-slate-100 hover:bg-slate-50"
          >
            <td class="px-4 py-3 font-mono text-xs text-slate-800">{{ order.trackingCode }}</td>
            <td class="px-4 py-3 text-xs text-slate-700">
              <div class="font-medium">{{ order.customerName || 'Unknown' }}</div>
              <div class="text-slate-500">{{ order.customerEmail }}</div>
            </td>
            <td class="px-4 py-3 text-xs text-slate-700">
              <div v-for="item in order.items" :key="item.id" class="leading-5">
                <span class="font-medium">{{ item.name }}</span>
                <span class="text-slate-400 ml-1 font-mono">{{ item.sourceTrackingCode }}</span>
              </div>
              <span v-if="!order.items?.length" class="text-slate-400">—</span>
            </td>
            <td class="px-4 py-3">
              <span
                class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                :style="{ backgroundColor: order.statusColor ?? '#94a3b8' }"
              >
                {{ order.statusName }}
              </span>
            </td>
            <td class="px-4 py-3 text-xs text-slate-500">{{ formatDate(order.createdAt) }}</td>
            <td class="px-4 py-3 text-xs flex gap-3">
              <button class="text-primary-700 hover:underline" @click="openStatusModal(order)">Change status</button>
              <NuxtLink :to="`/track?code=${encodeURIComponent(order.trackingCode)}`" class="text-slate-500 hover:underline">View</NuxtLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Change status modal -->
    <AppModal v-model="showStatusModal" title="Change order status">
      <div v-if="selectedOrder" class="space-y-4">
        <div class="text-xs text-slate-500">
          Order: <span class="font-mono font-medium text-slate-800">{{ selectedOrder.trackingCode }}</span>
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-700 mb-1">New status</label>
          <select
            v-model="selectedStatusId"
            class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white outline-none focus:border-primary-500"
          >
            <option v-for="s in statuses" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </div>
        <p v-if="statusError" class="text-xs text-red-600">{{ statusError }}</p>
      </div>
      <template #footer>
        <button
          class="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          @click="showStatusModal = false"
        >
          Cancel
        </button>
        <button
          class="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
          :disabled="savingStatus"
          @click="onSaveStatus"
        >
          {{ savingStatus ? 'Saving…' : 'Save' }}
        </button>
      </template>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import type { OrderDto } from '~/types'

definePageMeta({ role: 'ADMIN' })

const { orders, fetchOrders, updateOrderStatus } = useOrders()
const { statuses, fetchStatuses } = useStatuses()

const search = ref('')

onMounted(async () => {
  await Promise.all([fetchOrders(), fetchStatuses()])
})

const filteredOrders = computed(() =>
  orders.value.filter((o) =>
    !search.value ? true : o.trackingCode.toLowerCase().includes(search.value.toLowerCase())
  )
)

const formatDate = (iso: string) => new Date(iso).toLocaleString()

// --- Status modal ---
const showStatusModal = ref(false)
const selectedOrder = ref<OrderDto | null>(null)
const selectedStatusId = ref<number>(0)
const savingStatus = ref(false)
const statusError = ref<string | null>(null)

function openStatusModal(order: OrderDto) {
  selectedOrder.value = order
  selectedStatusId.value = order.statusId
  statusError.value = null
  showStatusModal.value = true
}

async function onSaveStatus() {
  if (!selectedOrder.value) return
  savingStatus.value = true
  statusError.value = null
  try {
    await updateOrderStatus(selectedOrder.value.id, selectedStatusId.value)
    showStatusModal.value = false
  } catch (e: any) {
    statusError.value = e?.data?.statusMessage || 'Failed to update status'
  } finally {
    savingStatus.value = false
  }
}
</script>
