import type { OrderDto, OrderItemDto } from '~/types'

export function useOrders() {
  const orders = useState<OrderDto[]>('orders:list', () => [])
  const loading = useState<boolean>('orders:loading', () => false)

  const fetchOrders = async () => {
    loading.value = true
    try {
      const res = await $fetch<{ orders: OrderDto[] }>('/api/orders')
      orders.value = res.orders.map((o) => ({
        ...o,
        createdAt: typeof o.createdAt === 'string' ? o.createdAt : new Date(o.createdAt).toISOString(),
        updatedAt: typeof o.updatedAt === 'string' ? o.updatedAt : new Date(o.updatedAt).toISOString()
      }))
    } finally {
      loading.value = false
    }
  }

  const createOrder = async (items: Pick<OrderItemDto, 'name' | 'sourceTrackingCode'>[]) => {
    const res = await $fetch<{ order: OrderDto }>('/api/orders', {
      method: 'POST',
      body: { items }
    })
    orders.value = [res.order, ...orders.value]
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
  }

  const updateOrderStatus = async (id: number, statusId: number) => {
    const res = await $fetch<{ order: OrderDto }>(`/api/orders/${id}/status`, {
      method: 'PATCH',
      body: { statusId }
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
    loading,
    fetchOrders,
    createOrder,
    updateOrder,
    deleteOrder,
    updateOrderStatus,
    trackOrder
  }
}
