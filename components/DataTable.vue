<template>
  <div>
    <!-- Toolbar -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
      <div class="flex items-center gap-2 min-w-0 flex-1">
        <template v-if="selectedKeys.size > 0">
          <span class="text-xs font-medium text-slate-600 whitespace-nowrap">{{ selectedKeys.size }} selected</span>
          <button
            v-for="action in bulkActions"
            :key="action.key"
            class="rounded-md px-3 py-1.5 text-xs font-semibold whitespace-nowrap"
            :class="action.variant === 'danger' ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'"
            @click="onBulkAction(action.key)"
          >
            {{ action.label }}
          </button>
          <button class="text-xs text-slate-400 hover:text-slate-600" @click="clearSelection">Clear</button>
        </template>
        <input
          v-else
          v-model="search"
          type="text"
          :placeholder="searchPlaceholder ?? 'Search…'"
          class="w-full sm:w-72 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary-500"
        >
      </div>
      <button
        v-if="createLabel"
        class="inline-flex items-center justify-center rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 whitespace-nowrap"
        @click="$emit('create')"
      >
        {{ createLabel }}
      </button>
    </div>

    <!-- Table -->
    <div class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <table class="min-w-full text-sm">
        <thead class="bg-slate-50 border-b border-slate-200">
          <tr>
            <th v-if="hasBulk" class="px-3 py-3 w-10">
              <input
                ref="selectAllRef"
                type="checkbox"
                class="rounded border-slate-300 cursor-pointer"
                :checked="allSelected && displayRows.length > 0"
                @change="toggleAll"
              >
            </th>
            <th v-if="draggable" class="px-2 py-3 w-8" />
            <th
              v-for="col in columns"
              :key="col.key"
              class="px-4 py-3 text-left font-semibold text-xs text-slate-500"
              :class="col.sortable ? 'cursor-pointer select-none hover:text-slate-700' : ''"
              @click="col.sortable ? onSort(col.key) : undefined"
            >
              <span class="inline-flex items-center gap-1">
                {{ col.label }}
                <span v-if="sort?.key === col.key" class="text-primary-500">{{ sort.dir === 'asc' ? '↑' : '↓' }}</span>
                <span v-else-if="col.sortable" class="text-slate-300">↕</span>
              </span>
            </th>
            <th v-if="hasRowActions" class="px-4 py-3 text-left font-semibold text-xs text-slate-500">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="displayRows.length === 0">
            <td :colspan="totalCols" class="px-4 py-10 text-center text-sm text-slate-400">No records found.</td>
          </tr>
          <tr
            v-for="(row, idx) in displayRows"
            :key="String(row[rowKey])"
            class="border-b border-slate-100 hover:bg-slate-50 transition-colors"
            :class="{
              'bg-primary-50': draggable && dragOverIndex === idx,
              'opacity-40': draggable && dragSourceIndex === idx,
            }"
            :draggable="draggable ? 'true' : undefined"
            @dragstart="draggable ? onDragStart(idx) : undefined"
            @dragover.prevent="draggable ? onDragOver(idx) : undefined"
            @drop.prevent="draggable ? onDrop() : undefined"
            @dragend="draggable ? onDragEnd() : undefined"
          >
            <td v-if="hasBulk" class="px-3 py-3">
              <input
                type="checkbox"
                :checked="selectedKeys.has(row[rowKey])"
                class="rounded border-slate-300 cursor-pointer"
                @change="toggleRow(row[rowKey])"
              >
            </td>
            <td v-if="draggable" class="px-2 py-3 text-slate-400 cursor-grab select-none text-center">⠿</td>
            <td v-for="col in columns" :key="col.key" class="px-4 py-3">
              <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">
                <span class="text-xs text-slate-700">{{ row[col.key] ?? '—' }}</span>
              </slot>
            </td>
            <td v-if="hasRowActions" class="px-4 py-3">
              <div class="flex gap-3 text-xs">
                <button
                  v-for="action in rowActions"
                  :key="action.key"
                  :class="action.variant === 'danger' ? 'text-red-600 hover:underline' : 'text-primary-700 hover:underline'"
                  @click="emit('row-action', action.key, row)"
                >
                  {{ action.label }}
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
export interface Column {
  key: string
  label: string
  sortable?: boolean
  searchable?: boolean
}

export interface TableAction {
  key: string
  label: string
  variant?: 'danger'
}

const props = withDefaults(defineProps<{
  columns: Column[]
  rows: Record<string, any>[]
  rowKey?: string
  searchPlaceholder?: string
  createLabel?: string
  bulkActions?: TableAction[]
  rowActions?: TableAction[]
  draggable?: boolean
}>(), {
  rowKey: 'id'
})

const emit = defineEmits<{
  create: []
  'row-action': [key: string, row: Record<string, any>]
  'bulk-action': [key: string, rows: Record<string, any>[]]
  reorder: [rows: Record<string, any>[]]
}>()

// ---- Search ----
const search = ref('')

const searchableKeys = computed(() => {
  const marked = props.columns.filter((c) => c.searchable).map((c) => c.key)
  return marked.length ? marked : props.columns.map((c) => c.key)
})

const filteredRows = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return props.rows
  return props.rows.filter((row) =>
    searchableKeys.value.some((k) => String(row[k] ?? '').toLowerCase().includes(q))
  )
})

// ---- Sort ----
const sort = ref<{ key: string; dir: 'asc' | 'desc' } | null>(null)

function onSort(key: string) {
  if (sort.value?.key === key) {
    sort.value = sort.value.dir === 'asc' ? { key, dir: 'desc' } : null
  } else {
    sort.value = { key, dir: 'asc' }
  }
}

const displayRows = computed(() => {
  if (!sort.value) return filteredRows.value
  const { key, dir } = sort.value
  return [...filteredRows.value].sort((a, b) => {
    const va = a[key] ?? ''
    const vb = b[key] ?? ''
    const cmp = typeof va === 'number' && typeof vb === 'number'
      ? va - vb
      : String(va).localeCompare(String(vb))
    return dir === 'asc' ? cmp : -cmp
  })
})

// ---- Selection ----
const selectedKeys = reactive(new Set<string | number>())
const selectAllRef = ref<HTMLInputElement | null>(null)

const allSelected = computed(
  () => displayRows.value.length > 0 && displayRows.value.every((r) => selectedKeys.has(r[props.rowKey]))
)
const someSelected = computed(
  () => !allSelected.value && displayRows.value.some((r) => selectedKeys.has(r[props.rowKey]))
)

watch(someSelected, (val) => {
  if (selectAllRef.value) selectAllRef.value.indeterminate = val
})

function toggleAll() {
  if (allSelected.value) {
    displayRows.value.forEach((r) => selectedKeys.delete(r[props.rowKey]))
  } else {
    displayRows.value.forEach((r) => selectedKeys.add(r[props.rowKey]))
  }
}

function toggleRow(key: string | number) {
  if (selectedKeys.has(key)) selectedKeys.delete(key)
  else selectedKeys.add(key)
}

function clearSelection() { selectedKeys.clear() }

function onBulkAction(key: string) {
  const selected = displayRows.value.filter((r) => selectedKeys.has(r[props.rowKey]))
  emit('bulk-action', key, selected)
}

// Clear selection when source rows change
watch(() => props.rows, () => selectedKeys.clear())

// ---- Drag and drop ----
const dragSourceIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)

function onDragStart(idx: number) { dragSourceIndex.value = idx }
function onDragOver(idx: number) { dragOverIndex.value = idx }

function onDrop() {
  const from = dragSourceIndex.value
  const to = dragOverIndex.value
  if (from === null || to === null || from === to) return
  const reordered = [...displayRows.value]
  const [moved] = reordered.splice(from, 1)
  if (!moved) return
  reordered.splice(to, 0, moved)
  emit('reorder', reordered)
}

function onDragEnd() {
  dragSourceIndex.value = null
  dragOverIndex.value = null
}

// ---- Helpers ----
const hasBulk = computed(() => !!props.bulkActions?.length)
const hasRowActions = computed(() => !!props.rowActions?.length)
const totalCols = computed(() => {
  let n = props.columns.length
  if (hasBulk.value) n++
  if (props.draggable) n++
  if (hasRowActions.value) n++
  return n
})
</script>
