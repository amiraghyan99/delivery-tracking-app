<template>
  <div>
    <DataTable
      title="My deliveries"
      description="Create and track your delivery orders."
      :columns="columns"
      :rows="orders"
      :total="total"
      :bulk-actions="bulkActions"
      :row-actions="rowActions"
      :page-size="25"
      :filters="statusFilters"
      search-placeholder="Search by tracking code or item name…"
      create-label="+ New order"
      @create="openCreate"
      @row-action="onRowAction"
      @bulk-action="onBulkAction"
      @query-change="onQueryChange"
    >
      <template #cell-trackingCode="{ value }">
        <span class="font-mono text-xs text-slate-800">{{ value }}</span>
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

    <!-- Create / Edit order modal -->
    <AppModal v-model="showForm" :title="editingOrder ? 'Edit order' : 'New delivery order'">
      <div class="space-y-4">
        <p class="text-xs text-slate-500">Add the items you want delivered. Each item needs a name and the seller's tracking code.</p>

        <div
          v-for="(item, idx) in formItems"
          :key="idx"
          class="flex gap-2 items-start"
        >
          <div class="flex-1 space-y-1">
            <input
              v-model="item.name"
              type="text"
              placeholder="Item name (e.g. iPhone 17 Pro Max)"
              class="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-primary-500"
            >
            <input
              v-model="item.sourceTrackingCode"
              type="text"
              placeholder="Seller tracking code (e.g. AMZ-989-55-55)"
              class="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm font-mono outline-none focus:border-primary-500"
            >
          </div>
          <button
            v-if="formItems.length > 1"
            class="mt-1.5 text-slate-400 hover:text-red-500 text-lg leading-none"
            @click="formItems.splice(idx, 1)"
          >
            ×
          </button>
        </div>

        <button
          class="text-xs text-primary-600 hover:underline"
          @click="formItems.push({ name: '', sourceTrackingCode: '' })"
        >
          + Add another item
        </button>

        <p v-if="formError" class="text-xs text-red-600">{{ formError }}</p>
      </div>

      <template #footer>
        <button
          class="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          @click="showForm = false"
        >
          Cancel
        </button>
        <button
          class="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
          :disabled="formSaving || !canSubmitForm"
          @click="onSubmitForm"
        >
          {{ formSaving ? 'Saving…' : editingOrder ? 'Save changes' : 'Create order' }}
        </button>
      </template>
    </AppModal>

    <!-- Delete confirmation modal (single or bulk) -->
    <AppModal v-model="showDelete" title="Delete order">
      <div class="space-y-3">
        <p v-if="deleteTargetOrders.length === 1" class="text-sm text-slate-700">
          Are you sure you want to delete order
          <span class="font-mono font-semibold">{{ deleteTargetOrders[0]?.trackingCode }}</span>?
          This action cannot be undone.
        </p>
        <p v-else class="text-sm text-slate-700">
          Delete <span class="font-semibold">{{ deleteTargetOrders.length }}</span> orders? This cannot be undone.
        </p>
        <p v-if="deleteError" class="text-xs text-red-600">{{ deleteError }}</p>
      </div>
      <template #footer>
        <button
          class="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          @click="showDelete = false"
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

definePageMeta({ role: 'CUSTOMER' })

const { orders, total, fetchOrders, createOrder, updateOrder, deleteOrder, bulkDeleteOrders } = useOrders()
const { statuses, fetchStatuses } = useStatuses()

onMounted(() => fetchStatuses())

const formatDate = (iso: string) => new Date(iso).toLocaleString()

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

const statusFilters = computed((): TableFilter[] => [
  { key: 'statusId', label: 'Status', options: statuses.value.map((s) => ({ label: s.name, value: s.id })) },
])

const columns: Column[] = [
  { key: 'trackingCode', label: 'Tracking code', sortable: true, searchable: true },
  { key: 'items', label: 'Items', searchable: true },
  { key: 'statusName', label: 'Status', sortable: true },
  { key: 'createdAt', label: 'Created', sortable: true },
]

const bulkActions: TableAction[] = [
  { key: 'delete', label: 'Delete', variant: 'danger' },
]

const rowActions: TableAction[] = [
  { key: 'track', label: 'Track' },
  { key: 'edit', label: 'Edit' },
  { key: 'delete', label: 'Delete', variant: 'danger' },
]

function onRowAction(key: string, row: Record<string, any>) {
  const order = row as OrderDto
  if (key === 'track') navigateTo(`/track?code=${encodeURIComponent(order.trackingCode)}`)
  else if (key === 'edit') openEdit(order)
  else if (key === 'delete') openDelete([order])
}

function onBulkAction(key: string, rows: Record<string, any>[]) {
  if (key === 'delete') openDelete(rows as OrderDto[])
}

// ---- Create / Edit modal ----
const showForm = ref(false)
const editingOrder = ref<OrderDto | null>(null)
const formSaving = ref(false)
const formError = ref<string | null>(null)
const formItems = ref([{ name: '', sourceTrackingCode: '' }])

const canSubmitForm = computed(() =>
  formItems.value.every((i) => i.name.trim() && i.sourceTrackingCode.trim())
)

function openCreate() {
  editingOrder.value = null
  formItems.value = [{ name: '', sourceTrackingCode: '' }]
  formError.value = null
  showForm.value = true
}

function openEdit(order: OrderDto) {
  editingOrder.value = order
  formItems.value = order.items.map((i) => ({ name: i.name, sourceTrackingCode: i.sourceTrackingCode }))
  formError.value = null
  showForm.value = true
}

async function onSubmitForm() {
  formError.value = null
  formSaving.value = true
  const items = formItems.value.map((i) => ({ name: i.name.trim(), sourceTrackingCode: i.sourceTrackingCode.trim() }))
  try {
    if (editingOrder.value) {
      await updateOrder(editingOrder.value.id, items)
    } else {
      await createOrder(items)
    }
    showForm.value = false
    await refetch()
  } catch (e: any) {
    formError.value = e?.data?.statusMessage || 'Failed to save order'
  } finally {
    formSaving.value = false
  }
}

// ---- Delete modal (single or bulk) ----
const showDelete = ref(false)
const deleteTargetOrders = ref<OrderDto[]>([])
const deleting = ref(false)
const deleteError = ref<string | null>(null)

function openDelete(targetOrders: OrderDto[]) {
  deleteTargetOrders.value = targetOrders
  deleteError.value = null
  showDelete.value = true
}

async function onConfirmDelete() {
  deleting.value = true
  deleteError.value = null
  try {
    await Promise.all(deleteTargetOrders.value.map((o) => deleteOrder(o.id)))
    showDelete.value = false
    await refetch()
  } catch (e: any) {
    deleteError.value = e?.data?.statusMessage || 'Failed to delete order'
  } finally {
    deleting.value = false
  }
}
</script>
