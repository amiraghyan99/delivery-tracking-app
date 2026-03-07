<template>
  <div>
    <DataTable
      title="Order statuses"
      description="Drag rows to reorder. Changes are saved automatically."
      :columns="columns"
      :rows="statuses"
      :row-actions="rowActions"
      :draggable="true"
      create-label="+ New status"
      search-placeholder="Search statuses…"
      @create="openCreate"
      @row-action="onRowAction"
      @reorder="onReorder"
    >
      <template #cell-color="{ row }">
        <span
          class="inline-block w-5 h-5 rounded-full border border-slate-200"
          :style="{ backgroundColor: row.color ?? '#94a3b8' }"
        />
      </template>
    </DataTable>

    <p v-if="deleteError" class="mt-2 text-xs text-red-600">{{ deleteError }}</p>

    <!-- Create / Edit modal -->
    <AppModal v-model="showForm" :title="editingStatus ? 'Edit status' : 'New status'">
      <div class="space-y-4">
        <div>
          <label class="block text-xs font-medium text-slate-700 mb-1">Name</label>
          <input
            v-model="form.name"
            type="text"
            placeholder="e.g. Out for delivery"
            class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary-500"
          >
        </div>
        <div>
          <label class="block text-xs font-medium text-slate-700 mb-1">Color</label>
          <div class="flex items-center gap-3">
            <input
              v-model="form.color"
              type="color"
              class="h-9 w-14 rounded border border-slate-300 cursor-pointer p-0.5"
            >
            <span class="text-xs font-mono text-slate-600">{{ form.color }}</span>
          </div>
        </div>
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
          :disabled="!form.name.trim()"
          @click="onSave"
        >
          Save
        </button>
      </template>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import type { StatusDto } from '~/types'
import type { Column, TableAction } from '~/components/DataTable.vue'

definePageMeta({ role: 'ADMIN' })

const { statuses, fetchStatuses, createStatus, updateStatus, deleteStatus } = useStatuses()

onMounted(() => fetchStatuses())

const columns: Column[] = [
  { key: 'color', label: 'Color' },
  { key: 'name', label: 'Name', sortable: true, searchable: true },
]

const rowActions: TableAction[] = [
  { key: 'edit', label: 'Edit' },
  { key: 'delete', label: 'Delete', variant: 'danger' },
]

function onRowAction(key: string, row: Record<string, any>) {
  const s = row as StatusDto
  if (key === 'edit') openEdit(s)
  else if (key === 'delete') onDelete(s.id)
}

async function onReorder(reorderedRows: Record<string, any>[]) {
  statuses.value = reorderedRows as StatusDto[]
  await Promise.all(
    reorderedRows.map((s, idx) => {
      if (s.sortOrder !== idx) return updateStatus(s.id, { sortOrder: idx }, { reorder: false })
    })
  )
}

// ---- Modal ----
const showForm = ref(false)
const editingStatus = ref<StatusDto | null>(null)
const formError = ref<string | null>(null)
const deleteError = ref<string | null>(null)
const form = reactive({ name: '', color: '#94a3b8' })

function openCreate() {
  editingStatus.value = null
  form.name = ''
  form.color = '#94a3b8'
  formError.value = null
  showForm.value = true
}

function openEdit(s: StatusDto) {
  editingStatus.value = s
  form.name = s.name
  form.color = s.color ?? '#94a3b8'
  formError.value = null
  showForm.value = true
}

async function onSave() {
  formError.value = null
  try {
    if (editingStatus.value) {
      await updateStatus(editingStatus.value.id, { name: form.name, color: form.color })
    } else {
      await createStatus({ name: form.name, color: form.color, sortOrder: statuses.value.length })
    }
    showForm.value = false
  } catch (e: any) {
    formError.value = e?.data?.statusMessage || 'Failed to save status'
  }
}

async function onDelete(id: number) {
  deleteError.value = null
  try {
    await deleteStatus(id)
  } catch (e: any) {
    deleteError.value = e?.data?.statusMessage || 'Failed to delete status'
  }
}
</script>
