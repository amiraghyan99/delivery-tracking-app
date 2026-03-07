<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-800">My deliveries</h1>
        <p class="text-sm text-slate-500">Create and track your delivery orders.</p>
      </div>
      <button
        class="inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700"
        @click="openCreate"
      >
        + New order
      </button>
    </div>

    <div v-if="orders.length === 0" class="bg-white border border-dashed border-slate-300 rounded-xl p-8 text-center text-sm text-slate-500">
      You have no orders yet. Click <span class="font-semibold text-slate-700">New order</span> to create your first one.
    </div>

    <div v-else class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <table class="min-w-full text-sm">
        <thead class="bg-slate-50 border-b border-slate-200">
          <tr>
            <th class="px-4 py-3 text-left font-semibold text-xs text-slate-500">Tracking code</th>
            <th class="px-4 py-3 text-left font-semibold text-xs text-slate-500">Items</th>
            <th class="px-4 py-3 text-left font-semibold text-xs text-slate-500">Status</th>
            <th class="px-4 py-3 text-left font-semibold text-xs text-slate-500">Created</th>
            <th class="px-4 py-3 text-left font-semibold text-xs text-slate-500">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="order in orders"
            :key="order.id"
            class="border-b border-slate-100 hover:bg-slate-50"
          >
            <td class="px-4 py-3 font-mono text-xs text-slate-800">{{ order.trackingCode }}</td>
            <td class="px-4 py-3 text-xs text-slate-700">
              <div v-for="item in order.items" :key="item.id" class="leading-5">
                <span class="font-medium">{{ item.name }}</span>
                <span class="text-slate-400 ml-1 font-mono">{{ item.sourceTrackingCode }}</span>
              </div>
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
              <NuxtLink :to="`/track?code=${encodeURIComponent(order.trackingCode)}`" class="text-primary-700 hover:underline">Track</NuxtLink>
              <button class="text-slate-600 hover:underline" @click="openEdit(order)">Edit</button>
              <button class="text-red-600 hover:underline" @click="openDelete(order)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

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

    <!-- Delete confirmation modal -->
    <AppModal v-model="showDelete" title="Delete order">
      <div class="space-y-3">
        <p class="text-sm text-slate-700">Are you sure you want to delete order <span class="font-mono font-semibold">{{ deletingOrder?.trackingCode }}</span>? This action cannot be undone.</p>
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

definePageMeta({ role: 'CUSTOMER' })

const { orders, fetchOrders, createOrder, updateOrder, deleteOrder } = useOrders()

onMounted(async () => {
  await fetchOrders()
})

const formatDate = (iso: string) => new Date(iso).toLocaleString()

// --- Create / Edit modal ---
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
  } catch (e: any) {
    formError.value = e?.data?.statusMessage || 'Failed to save order'
  } finally {
    formSaving.value = false
  }
}

// --- Delete modal ---
const showDelete = ref(false)
const deletingOrder = ref<OrderDto | null>(null)
const deleting = ref(false)
const deleteError = ref<string | null>(null)

function openDelete(order: OrderDto) {
  deletingOrder.value = order
  deleteError.value = null
  showDelete.value = true
}

async function onConfirmDelete() {
  if (!deletingOrder.value) return
  deleting.value = true
  deleteError.value = null
  try {
    await deleteOrder(deletingOrder.value.id)
    showDelete.value = false
  } catch (e: any) {
    deleteError.value = e?.data?.statusMessage || 'Failed to delete order'
  } finally {
    deleting.value = false
  }
}
</script>
