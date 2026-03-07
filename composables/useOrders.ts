 import type { OrderDto, OrderItemDto } from '~/types'

export interface OrdersQuery {
  page?: number
  pageSize?: number
  search?: string
  sortKey?: string | null
  sortDir?: 'asc' | 'desc' | null
  searchFields?: string[]
  statusId?: number
  skipCount?: boolean
}

export function useOrders() {
  const orders = useState<OrderDto[]>('orders:list', () => [])
  const total = useState<number>('orders:total', () => 0)
  const loading = useState<boolean>('orders:loading', () => false)

  const fetchOrders = async (params?: OrdersQuery) => {
    loading.value = true
    try {
      const query: Record<string, string | number> = {}
      if (params?.page) query.page = params.page
      if (params?.pageSize) query.pageSize = params.pageSize
      if (params?.search) query.search = params.search
      if (params?.sortKey) query.sortKey = params.sortKey
      if (params?.sortDir) query.sortDir = params.sortDir
      if (params?.searchFields?.length) query.searchFields = params.searchFields.join(',')
      if (params?.statusId) query.statusId = params.statusId
      if (params?.skipCount) query.skipCount = 'true'

      const res = await $fetch<{ orders: OrderDto[]; total: number | null }>('/api/orders', { query })
      orders.value = res.orders.map((o) => ({
        ...o,
        createdAt: typeof o.createdAt === 'string' ? o.createdAt : new Date(o.createdAt).toISOString(),
        updatedAt: typeof o.updatedAt === 'string' ? o.updatedAt : new Date(o.updatedAt).toISOString()
      }))
      // Only update total when the server ran the count (res.total is null when skipped)
      if (res.total !== null) total.value = res.total
    } finally {
      loading.value = false
    }
  }

  const createOrder = async (items: Pick<OrderItemDto, 'name' | 'sourceTrackingCode'>[]) => {
    const res = await $fetch<{ order: OrderDto }>('/api/orders', {
      method: 'POST',
      body: { items }
    })
    return res.order
  }

  const updateOrder = async (id: number, items: Pick<OrderItemDto, 'name' | 'sourceTrackingCode'>[]) => {
    const res = await $fetch<{ order: OrderDto }>(`/api/orders/${id}`, {
      method: 'PATCH',
      body: { items }
    })
    orders.value = orders.value.map((o) => o.id === id ? res.order : o)
    return res.order
  }

  const deleteOrder = async (id: number) => {
    await $fetch(`/api/orders/${id}`, { method: 'DELETE' })
    orders.value = orders.value.filter((o) => o.id !== id)
    total.value = Math.max(0, total.value - 1)
  }

  const bulkDeleteOrders = async (ids: number[]) => {
    await $fetch('/api/orders/bulk', { method: 'DELETE', body: { ids } })
  }

  const bulkUpdateOrderStatus = async (ids: number[], statusId: number) => {
    await $fetch('/api/orders/bulk/status', { method: 'PATCH', body: { ids, statusId } })
  }

  const updateOrderStatus = async (id: number, statusId: number) => {
    const res = await $fetch<{ order: OrderDto }>('/api/orders/update-status', {
      method: 'PATCH',
      body: { id, statusId }
    })

    orders.value = orders.value.map((o) =>
      o.id === id
        ? { ...o, statusId: res.order.statusId, statusName: res.order.statusName, statusColor: res.order.statusColor }
        : o
    )
    return res.order
  }

  const trackOrder = async (trackingCode: string) => {
    return await $fetch<{ order: { trackingCode: string; statusId: number; statusName: string; statusColor: string | null; createdAt: string; updatedAt: string; items: OrderItemDto[]; statusHistory: { statusId: number; statusName: string; statusColor: string | null; changedAt: string }[] } }>(
      `/api/orders/${encodeURIComponent(trackingCode)}`
    )
  }

  return {
    orders,
    total,
    loading,
    fetchOrders,
    createOrder,
    updateOrder,
    deleteOrder,
    bulkDeleteOrders,
    updateOrderStatus,
    bulkUpdateOrderStatus,
    trackOrder
  }
}
