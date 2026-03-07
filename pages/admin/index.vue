<template>
  <div>
    <DataTable
      title="Admin dashboard"
      description="Manage and update all customer orders."
      :columns="columns"
      :rows="orders"
      :total="total"
      :bulk-actions="bulkActions"
      :row-actions="rowActions"
      :page-size="25"
      :filters="statusFilters"
      search-placeholder="Search by tracking code or customer…"
      @row-action="onRowAction"
      @bulk-action="onBulkAction"
      @query-change="onQueryChange"
    >
      <template #cell-trackingCode="{ value }">
        <span class="font-mono text-xs text-slate-800">{{ value }}</span>
      </template>

      <template #cell-customerName="{ row }">
        <div class="text-xs">
          <div class="font-medium text-slate-700">{{ row.customerName || 'Unknown' }}</div>
          <div class="text-slate-500">{{ row.customerEmail }}</div>
        </div>
      </template>

      <template #cell-items="{ row }">
        <div class="text-xs text-slate-700">
          <div v-for="item in row.items" :key="item.id" class="leading-5">
            <span class="font-medium">{{ item.name }}</span>
            <span class="text-slate-400 ml-1 font-mono">{{ item.sourceTrackingCode }}</span>
          </div>
          <span v-if="!row.items?.length" class="text-slate-400">—</span>
        </div>
      </template>

      <template #cell-statusName="{ row }">
        <span
          class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
          :style="{ backgroundColor: row.statusColor ?? '#94a3b8' }"
        >
          {{ row.statusName }}
        </span>
      </template>

      <template #cell-createdAt="{ value }">
        <span class="text-xs text-slate-500">{{ formatDate(value) }}</span>
      </template>
    </DataTable>

    <!-- Change status modal (single or bulk) -->
    <AppModal v-model="showStatusModal" title="Change order status">
      <div class="space-y-4">
        <p v-if="statusTargetOrders.length === 1" class="text-xs text-slate-500">
          Order: <span class="font-mono font-medium text-slate-800">{{ statusTargetOrders[0]?.trackingCode }}</span>
        </p>
        <p v-else class="text-xs text-slate-500">
          Changing status for <span class="font-semibold text-slate-700">{{ statusTargetOrders.length }}</span> selected orders.
        </p>
        <div>
          <label class="block text-xs font-medium text-slate-700 mb-1">New status</label>
          <select
            v-model="selectedStatusId"
            class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white outline-none focus:border-primary-500"
          >
            <option :value="0" disabled>Select a status…</option>
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
          :disabled="savingStatus || !selectedStatusId"
          @click="onSaveStatus"
        >
          {{ savingStatus ? 'Saving…' : 'Save' }}
        </button>
      </template>
    </AppModal>

    <!-- Bulk delete confirmation modal -->
    <AppModal v-model="showDeleteConfirm" title="Delete orders">
      <div class="space-y-3">
        <p class="text-sm text-slate-700">
          Delete <span class="font-semibold">{{ deleteTargetOrders.length }}</span>
          order{{ deleteTargetOrders.length !== 1 ? 's' : '' }}? This cannot be undone.
        </p>
        <p v-if="deleteError" class="text-xs text-red-600">{{ deleteError }}</p>
      </div>
      <template #footer>
        <button
          class="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          @click="showDeleteConfirm = false"
        >
          Cancel
        </button>
        <button
          class="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          :disabled="deleting"
          @click="onConfirmDelete"
        >
          {{ deleting ? 'Deleting…' : 'Delete' }}
        </button>
      </template>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import type { OrderDto } from '~/types'
import type { Column, TableAction, TableFilter, TableQuery } from '~/components/DataTable.vue'
import type { OrdersQuery } from '~/composables/useOrders'

definePageMeta({ role: 'ADMIN' })

const { orders, total, fetchOrders, updateOrderStatus, bulkUpdateOrderStatus, deleteOrder, bulkDeleteOrders } = useOrders()
const { statuses, fetchStatuses } = useStatuses()

onMounted(() => fetchStatuses())

const lastQuery = ref<OrdersQuery>({})

async function onQueryChange(q: TableQuery) {
  const params: OrdersQuery = {
    page: q.page,
    pageSize: q.pageSize,
    search: q.search || undefined,
    sortKey: q.sortKey || undefined,
    sortDir: q.sortDir || undefined,
    searchFields: q.searchFields.length ? q.searchFields : undefined,
    statusId: q.activeFilters.statusId ? Number(q.activeFilters.statusId) : undefined,
    skipCount: !q.countNeeded,
  }
  lastQuery.value = params
  await fetchOrders(params)
}

async function refetch() {
  await fetchOrders(lastQuery.value)
}

const formatDate = (iso: string) => new Date(iso).toLocaleString()

const statusFilters = computed((): TableFilter[] => [
  { key: 'statusId', label: 'Status', options: statuses.value.map((s) => ({ label: s.name, value: s.id })) },
])

const columns: Column[] = [
  { key: 'trackingCode', label: 'Tracking code', sortable: true, searchable: true },
  { key: 'customerName', label: 'Customer', sortable: true, searchable: true },
  { key: 'items', label: 'Items' },
  { key: 'statusName', label: 'Status', sortable: true, searchable: true },
  { key: 'createdAt', label: 'Created', sortable: true },
]

const bulkActions: TableAction[] = [
  { key: 'change-status', label: 'Change status' },
  { key: 'delete', label: 'Delete', variant: 'danger' },
]

const rowActions: TableAction[] = [
  { key: 'change-status', label: 'Change status' },
  { key: 'view', label: 'View' },
]

function onRowAction(key: string, row: Record<string, any>) {
  const order = row as OrderDto
  if (key === 'change-status') openStatusModal([order])
  else if (key === 'view') navigateTo(`/track?code=${encodeURIComponent(order.trackingCode)}`)
}

function onBulkAction(key: string, rows: Record<string, any>[]) {
  const selected = rows as OrderDto[]
  if (key === 'change-status') openStatusModal(selected)
  else if (key === 'delete') openDeleteConfirm(selected)
}

// ---- Status modal ----
const showStatusModal = ref(false)
const statusTargetOrders = ref<OrderDto[]>([])
const selectedStatusId = ref<number>(0)
const savingStatus = ref(false)
const statusError = ref<string | null>(null)

function openStatusModal(targetOrders: OrderDto[]) {
  statusTargetOrders.value = targetOrders
  selectedStatusId.value = targetOrders.length === 1 ? targetOrders[0]!.statusId : 0
  statusError.value = null
  showStatusModal.value = true
}

async function onSaveStatus() {
  if (!selectedStatusId.value) return
  savingStatus.value = true
  statusError.value = null
  try {
    const ids = statusTargetOrders.value.map((o) => o.id)
    if (ids.length === 1) {
      await updateOrderStatus(ids[0]!, selectedStatusId.value)
    } else {
      await bulkUpdateOrderStatus(ids, selectedStatusId.value)
    }
    showStatusModal.value = false
    await refetch()
  } catch (e: any) {
    statusError.value = e?.data?.statusMessage || 'Failed to update status'
  } finally {
    savingStatus.value = false
  }
}

// ---- Delete confirmation ----
const showDeleteConfirm = ref(false)
const deleteTargetOrders = ref<OrderDto[]>([])
const deleting = ref(false)
const deleteError = ref<string | null>(null)

function openDeleteConfirm(targetOrders: OrderDto[]) {
  deleteTargetOrders.value = targetOrders
  deleteError.value = null
  showDeleteConfirm.value = true
}

async function onConfirmDelete() {
  deleting.value = true
  deleteError.value = null
  try {
    const ids = deleteTargetOrders.value.map((o) => o.id)
    if (ids.length === 1) {
      await deleteOrder(ids[0]!)
    } else {
      await bulkDeleteOrders(ids)
    }
    showDeleteConfirm.value = false
    await refetch()
  } catch (e: any) {
    deleteError.value = e?.data?.statusMessage || 'Failed to delete'
  } finally {
    deleting.value = false
  }
}
</script>
