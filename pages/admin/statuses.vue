<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-800">Order statuses</h1>
        <p class="text-sm text-slate-500">Drag rows to reorder. Changes are saved automatically.</p>
      </div>
      <button
        class="inline-flex items-center rounded-md bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-primary-700"
        @click="openCreate"
      >
        + New status
      </button>
    </div>

    <!-- Statuses list -->
    <div class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <table class="min-w-full text-sm">
        <thead class="bg-slate-50 border-b border-slate-200">
          <tr>
            <th class="px-2 py-3 w-8" />
            <th class="px-4 py-3 text-left font-semibold text-xs text-slate-500">Color</th>
            <th class="px-4 py-3 text-left font-semibold text-xs text-slate-500">Name</th>
            <th class="px-4 py-3 text-left font-semibold text-xs text-slate-500">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(s, idx) in statuses"
            :key="s.id"
            draggable="true"
            class="border-b border-slate-100 transition-colors"
            :class="{
              'bg-primary-50 border-primary-200': dragOverIndex === idx,
              'opacity-40': dragSourceIndex === idx,
              'cursor-grabbing': dragSourceIndex === idx,
            }"
            @dragstart="onDragStart(idx)"
            @dragover.prevent="onDragOver(idx)"
            @drop.prevent="onDrop"
            @dragend="onDragEnd"
          >
            <td class="px-2 py-3 text-slate-400 cursor-grab select-none text-center">⠿</td>
            <td class="px-4 py-3">
              <span
                class="inline-block w-5 h-5 rounded-full border border-slate-200"
                :style="{ backgroundColor: s.color ?? '#94a3b8' }"
              />
            </td>
            <td class="px-4 py-3 text-xs font-medium text-slate-800">{{ s.name }}</td>
            <td class="px-4 py-3 flex gap-3 text-xs">
              <button class="text-primary-700 hover:underline" @click="openEdit(s)">Edit</button>
              <button class="text-red-600 hover:underline" @click="onDelete(s.id)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
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

definePageMeta({ role: 'ADMIN' })

const { statuses, fetchStatuses, createStatus, updateStatus, deleteStatus } = useStatuses()

onMounted(() => fetchStatuses())

// --- Drag and drop ---
const dragSourceIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)

function onDragStart(idx: number) { dragSourceIndex.value = idx }
function onDragOver(idx: number) { dragOverIndex.value = idx }

async function onDrop() {
  const from = dragSourceIndex.value
  const to = dragOverIndex.value
  if (from === null || to === null || from === to) return
  const reordered = [...statuses.value]
  const [moved] = reordered.splice(from, 1)
  if (!moved) return
  reordered.splice(to, 0, moved)
  statuses.value = reordered
  await Promise.all(
    reordered.map((s, idx) => {
      if (s.sortOrder !== idx) return updateStatus(s.id, { sortOrder: idx }, { reorder: false })
    })
  )
}

function onDragEnd() {
  dragSourceIndex.value = null
  dragOverIndex.value = null
}

// --- Modal ---
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
