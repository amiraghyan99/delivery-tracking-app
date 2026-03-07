<template>
  <div>
    <!-- Header -->
    <div v-if="title" class="mb-6">
      <h1 class="text-2xl font-semibold text-slate-800">{{ title }}</h1>
      <p v-if="description" class="text-sm text-slate-500">{{ description }}</p>
    </div>

    <!-- Toolbar: bulk actions (when selected) OR create button -->
    <div
      v-if="hasBulk || createLabel"
      class="flex items-center justify-between gap-3 mb-2 min-h-[36px]"
    >
      <!-- Bulk actions -->
      <div v-if="selectedKeys.size > 0" class="flex items-center gap-2 flex-wrap">
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
        <button class="text-xs text-slate-400 hover:text-slate-600 whitespace-nowrap" @click="clearSelection">Clear</button>
      </div>
      <div v-else />

      <!-- Create button -->
      <button
        v-if="createLabel"
        class="inline-flex items-center justify-center rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 whitespace-nowrap"
        @click="$emit('create')"
      >
        {{ createLabel }}
      </button>
    </div>

    <!-- Backdrop to close open filter dropdowns -->
    <div
      v-if="openFilterKey !== null"
      class="fixed inset-0 z-40"
      @click="openFilterKey = null"
    />

    <!-- Filter section -->
    <div class="bg-white border border-slate-200 rounded-xl px-4 py-3 mb-3 flex flex-wrap items-center gap-x-4 gap-y-2">
      <!-- Search input -->
      <div class="flex items-center gap-2 flex-1 min-w-48">
        <svg class="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        <input
          v-model="search"
          type="text"
          :placeholder="searchPlaceholder ?? 'Search…'"
          class="flex-1 min-w-0 text-sm outline-none placeholder:text-slate-400 text-slate-700"
        >
        <button v-if="search" class="text-slate-400 hover:text-slate-600 shrink-0" @click="search = ''">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Search-by-field toggles -->
      <template v-if="searchableColumns.length >= 2">
        <div class="hidden sm:block h-5 w-px bg-slate-200 shrink-0" />
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-xs text-slate-400 whitespace-nowrap shrink-0">Search in</span>
          <button
            v-for="col in searchableColumns"
            :key="col.key"
            class="rounded-full px-2.5 py-0.5 text-xs font-medium border transition-colors whitespace-nowrap"
            :class="activeSearchFields.has(col.key)
              ? 'bg-primary-50 border-primary-300 text-primary-700'
              : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'"
            @click="toggleSearchField(col.key)"
          >
            {{ col.label }}
          </button>
        </div>
      </template>

      <!-- Select filters -->
      <template v-if="filters?.length">
        <div class="hidden sm:block h-5 w-px bg-slate-200 shrink-0" />
        <div
          v-for="filter in filters"
          :key="filter.key"
          class="flex items-center gap-2 shrink-0"
        >
          <span class="text-xs text-slate-400 whitespace-nowrap shrink-0">{{ filter.label }}</span>

          <!-- Multi-select dropdown -->
          <div v-if="filter.multiple" class="relative z-50">
            <button
              class="flex items-center gap-1.5 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-700 bg-white outline-none hover:border-slate-300 cursor-pointer"
              @click.stop="openFilterKey = openFilterKey === filter.key ? null : filter.key"
            >
              <span>{{ getMultiFilterLabel(filter) }}</span>
              <svg class="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            <div
              v-if="openFilterKey === filter.key"
              class="absolute top-full mt-1 left-0 bg-white border border-slate-200 rounded-lg shadow-lg py-1 min-w-[140px]"
              @click.stop
            >
              <label
                v-for="opt in filter.options"
                :key="opt.value"
                class="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  :value="opt.value"
                  :checked="(activeFilters[filter.key] as (string | number)[]).includes(opt.value)"
                  class="rounded border-slate-300 cursor-pointer"
                  @change="toggleMultiFilter(filter.key, opt.value)"
                >
                {{ opt.label }}
              </label>
            </div>
          </div>

          <!-- Single select -->
          <select
            v-else
            v-model="activeFilters[filter.key]"
            class="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-700 bg-white outline-none focus:border-primary-500 cursor-pointer"
          >
            <option value="">All</option>
            <option v-for="opt in filter.options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </div>
      </template>

      <!-- Spacer -->
      <div class="flex-1 hidden sm:block" />

      <!-- Per page -->
      <div v-if="props.pageSize" class="flex items-center gap-2 shrink-0">
        <span class="text-xs text-slate-500 whitespace-nowrap">Per page</span>
        <select
          v-model="currentPageSize"
          class="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-700 bg-white outline-none focus:border-primary-500 cursor-pointer"
        >
          <option v-for="n in pageSizeOptions" :key="n" :value="n">{{ n }}</option>
        </select>
      </div>
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

      <!-- Pagination -->
      <div
        v-if="currentPageSize && totalPages > 1"
        class="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-white text-xs text-slate-500"
      >
        <span>Showing {{ pageStart }}–{{ pageEnd }} of {{ rowTotal }}</span>
        <div class="flex items-center gap-1">
          <button
            :disabled="currentPage === 1"
            class="px-2.5 py-1 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50 disabled:cursor-not-allowed transition-colors"
            @click="currentPage--"
          >
            ← Prev
          </button>
          <template v-for="(p, i) in visiblePages" :key="i">
            <span v-if="p === '...'" class="px-1 select-none">…</span>
            <button
              v-else
              class="w-8 h-7 rounded border text-xs transition-colors"
              :class="p === currentPage ? 'bg-primary-600 text-white border-primary-600' : 'border-slate-200 hover:bg-slate-50'"
              @click="currentPage = p as number"
            >
              {{ p }}
            </button>
          </template>
          <button
            :disabled="currentPage === totalPages"
            class="px-2.5 py-1 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50 disabled:cursor-not-allowed transition-colors"
            @click="currentPage++"
          >
            Next →
          </button>
        </div>
      </div>
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

export interface TableFilter {
  key: string
  label: string
  options: { label: string; value: string | number }[]
  multiple?: boolean
}

export interface TableQuery {
  page: number
  pageSize: number
  search: string
  sortKey: string | null
  sortDir: 'asc' | 'desc' | null
  /** Active searchable column keys (for server-side field-scoped search). */
  searchFields: string[]
  /** Active filter values keyed by filter.key. Multi-select filters emit arrays. */
  activeFilters: Record<string, string | number | (string | number)[]>
  /** True when search/sort/pageSize/searchFields changed — a new COUNT(*) is needed. False on page-only navigation. */
  countNeeded: boolean
}

const props = withDefaults(defineProps<{
  columns: Column[]
  rows: Record<string, any>[]
  rowKey?: string
  title?: string
  description?: string
  searchPlaceholder?: string
  createLabel?: string
  bulkActions?: TableAction[]
  rowActions?: TableAction[]
  draggable?: boolean
  pageSize?: number
  /** Extra row keys to always search that aren't visible columns (e.g. flattened nested fields). */
  searchKeys?: string[]
  /** Select-style filters shown in the filter bar (server-side mode only). */
  filters?: TableFilter[]
  /**
   * When provided, enables server-side mode: DataTable skips client-side filtering/sorting/pagination
   * and emits `query-change` whenever page, pageSize, search, or sort changes.
   */
  total?: number
}>(), {
  rowKey: 'id',
  pageSize: 0,
})

const emit = defineEmits<{
  create: []
  'row-action': [key: string, row: Record<string, any>]
  'bulk-action': [key: string, rows: Record<string, any>[]]
  reorder: [rows: Record<string, any>[]]
  'query-change': [query: TableQuery]
}>()

// ---- Route / URL sync (server mode only) ----
const route = useRoute()
const router = useRouter()
const isServerMode = computed(() => props.total !== undefined)

/** Read a URL query param only when in server mode */
function urlParam(key: string): string | null {
  if (props.total === undefined) return null
  return route.query[key] ? String(route.query[key]) : null
}

// ---- Search ----
const search = ref(urlParam('search') ?? '')
const serverSearch = ref(urlParam('search') ?? '')

/** Columns that can be toggled in the "Search in" filter UI */
const searchableColumns = computed(() => props.columns.filter((c) => c.searchable))

/** Non-column keys from searchKeys prop — always included in search, not shown as toggles */
const hiddenSearchKeys = computed(() => {
  if (!props.searchKeys?.length) return []
  const columnKeys = new Set(props.columns.map((c) => c.key))
  return props.searchKeys.filter((k) => !columnKeys.has(k))
})

/** Which searchable columns are currently active — initialized from URL or all selected */
const activeSearchFields = reactive(new Set<string>())

watch(
  () => props.columns,
  (cols) => {
    const urlFields = urlParam('fields')?.split(',').filter(Boolean) ?? null
    cols.filter((c) => c.searchable).forEach((c) => {
      if (urlFields) {
        if (urlFields.includes(c.key)) activeSearchFields.add(c.key)
      } else {
        activeSearchFields.add(c.key)
      }
    })
  },
  { immediate: true },
)

function toggleSearchField(key: string) {
  if (activeSearchFields.has(key)) activeSearchFields.delete(key)
  else activeSearchFields.add(key)
  currentPage.value = 1
}

const effectiveSearchKeys = computed(() => [
  ...activeSearchFields,
  ...hiddenSearchKeys.value,
])

const filteredRows = computed(() => {
  if (isServerMode.value) return props.rows
  const q = search.value.trim().toLowerCase()
  if (!q) return props.rows
  return props.rows.filter((row) =>
    effectiveSearchKeys.value.some((k) => String(row[k] ?? '').toLowerCase().includes(q))
  )
})

// ---- Sort ----
const sort = ref<{ key: string; dir: 'asc' | 'desc' } | null>((() => {
  const sortKey = urlParam('sort')
  if (!sortKey) return null
  return { key: sortKey, dir: urlParam('dir') === 'asc' ? 'asc' : 'desc' }
})())

function onSort(key: string) {
  if (sort.value?.key === key) {
    sort.value = sort.value.dir === 'asc' ? { key, dir: 'desc' } : null
  } else {
    sort.value = { key, dir: 'asc' }
  }
}

const sortedRows = computed(() => {
  if (isServerMode.value) return filteredRows.value
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

// ---- Pagination ----
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

const currentPageSize = ref(
  urlParam('pageSize') ? Number(urlParam('pageSize')) : props.pageSize
)
watch(() => props.pageSize, (v) => { if (!urlParam('pageSize')) currentPageSize.value = v })
watch(currentPageSize, () => { currentPage.value = 1 })

const pageSizeOptions = computed(() => {
  const opts = new Set([...PAGE_SIZE_OPTIONS, props.pageSize].filter((n) => n > 0))
  return [...opts].sort((a, b) => a - b)
})

const currentPage = ref(urlParam('page') ? Math.max(1, Number(urlParam('page'))) : 1)

/** Total row count: server total in server mode, filtered count in client mode */
const rowTotal = computed(() => isServerMode.value ? (props.total ?? 0) : sortedRows.value.length)

const totalPages = computed(() =>
  currentPageSize.value ? Math.max(1, Math.ceil(rowTotal.value / currentPageSize.value)) : 1
)

const pageStart = computed(() => (currentPage.value - 1) * currentPageSize.value + 1)
const pageEnd = computed(() => Math.min(currentPage.value * currentPageSize.value, rowTotal.value))

const displayRows = computed(() => {
  if (isServerMode.value) return props.rows
  if (!currentPageSize.value) return sortedRows.value
  const start = (currentPage.value - 1) * currentPageSize.value
  return sortedRows.value.slice(start, start + currentPageSize.value)
})

// Client mode: reset to page 1 on search/sort change
watch([search, sort], () => {
  if (!isServerMode.value) currentPage.value = 1
})

const visiblePages = computed((): (number | '...')[] => {
  const total = totalPages.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const curr = currentPage.value
  const pages: (number | '...')[] = [1]
  if (curr > 3) pages.push('...')
  for (let p = Math.max(2, curr - 1); p <= Math.min(total - 1, curr + 1); p++) pages.push(p)
  if (curr < total - 2) pages.push('...')
  pages.push(total)
  return pages
})

// ---- Server-mode query emission ----
let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null

watch(search, (v) => {
  if (!isServerMode.value) return
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(() => {
    serverSearch.value = v
    currentPage.value = 1
  }, 300)
})

watch(sort, () => {
  if (isServerMode.value) currentPage.value = 1
})

// ---- Select filters ----
const activeFilters = reactive<Record<string, string | number | (string | number)[]>>({})

watch(() => props.filters, (filters) => {
  filters?.forEach((f) => {
    if (!(f.key in activeFilters)) {
      const urlVal = urlParam(f.key)
      if (f.multiple) {
        activeFilters[f.key] = urlVal
          ? urlVal.split(',').filter(Boolean).map((v) => (isNaN(Number(v)) ? v : Number(v)))
          : []
      } else {
        activeFilters[f.key] = urlVal ?? ''
      }
    }
  })
}, { immediate: true })

watch(activeFilters, () => {
  if (isServerMode.value) currentPage.value = 1
})

// ---- Multi-select filter helpers ----
const openFilterKey = ref<string | null>(null)

function toggleMultiFilter(key: string, value: string | number) {
  const current = activeFilters[key] as (string | number)[]
  const idx = current.indexOf(value)
  if (idx >= 0) current.splice(idx, 1)
  else current.push(value)
}

function getMultiFilterLabel(filter: TableFilter): string {
  const selected = activeFilters[filter.key] as (string | number)[]
  if (!selected.length) return 'All'
  return selected.map((v) => filter.options.find((o) => o.value === v)?.label ?? v).join(', ')
}

// Track filter state to detect page-only vs filter changes
const filterFingerprint = computed(() => {
  const fields = [...activeSearchFields].sort().join(',')
  const filtersStr = Object.entries(activeFilters).sort().map(([k, v]) => {
    const val = Array.isArray(v) ? [...v].sort().join(',') : v
    return `${k}=${val}`
  }).join('&')
  return `${serverSearch.value.trim()}|${sort.value?.key ?? ''}|${sort.value?.dir ?? ''}|${currentPageSize.value}|${fields}|${filtersStr}`
})
const lastFilterFingerprint = ref('')

const serverQuery = computed((): TableQuery => {
  const fp = filterFingerprint.value
  const countNeeded = fp !== lastFilterFingerprint.value
  return {
    page: currentPage.value,
    pageSize: currentPageSize.value,
    search: serverSearch.value.trim(),
    sortKey: sort.value?.key ?? null,
    sortDir: sort.value?.dir ?? null,
    searchFields: [...activeSearchFields],
    activeFilters: { ...activeFilters },
    countNeeded,
  }
})

// Emit query-change for data fetching
watch(serverQuery, (q) => {
  if (!isServerMode.value) return
  lastFilterFingerprint.value = filterFingerprint.value
  emit('query-change', q)
}, { immediate: true })

// Sync state to URL (not immediate — initial URL is the source, subsequent changes update it)
watch(serverQuery, (sq) => {
  if (!isServerMode.value) return
  const params: Record<string, string> = {}
  if (sq.page > 1) params.page = String(sq.page)
  if (sq.pageSize !== props.pageSize) params.pageSize = String(sq.pageSize)
  if (sq.search) params.search = sq.search
  if (sq.sortKey) { params.sort = sq.sortKey; if (sq.sortDir) params.dir = sq.sortDir }
  const allSearchable = props.columns.filter((c) => c.searchable).map((c) => c.key)
  if (sq.searchFields.length > 0 && sq.searchFields.length < allSearchable.length) {
    params.fields = sq.searchFields.join(',')
  }
  props.filters?.forEach((f) => {
    const val = sq.activeFilters[f.key]
    if (Array.isArray(val) && val.length) params[f.key] = val.join(',')
    else if (!Array.isArray(val) && val !== '' && val !== undefined) params[f.key] = String(val)
  })
  router.replace({ query: params })
})

// ---- Selection (operates on the current page's rows) ----
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
  const selected = props.rows.filter((r) => selectedKeys.has(r[props.rowKey]))
  emit('bulk-action', key, selected)
}

watch(() => props.rows, () => {
  selectedKeys.clear()
  if (!isServerMode.value) currentPage.value = 1
})

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
