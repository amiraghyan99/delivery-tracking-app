import { useOrders } from './useOrders'
import { useToast } from './useToast'

interface OrderStatusChangedEvent {
  type: 'ORDER_STATUS_CHANGED'
  orderId: number
  trackingCode: string
  customerId: number
  oldStatusName: string
  newStatusName: string
  newStatusId: number
  newStatusColor: string | null
}

export function useOrderSocket() {
  const { orders } = useOrders()
  const { add: addToast } = useToast()

  let ws: WebSocket | null = null
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null

  function connect() {
    if (typeof window === 'undefined') return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    ws = new WebSocket(`${protocol}//${window.location.host}/_ws`)

    ws.onmessage = (event) => {
      let data: OrderStatusChangedEvent
      try {
        data = JSON.parse(event.data as string)
      } catch {
        return
      }

      if (data.type !== 'ORDER_STATUS_CHANGED') return

      // Update order in local state if it's tracked
      const idx = orders.value.findIndex((o) => o.id === data.orderId)
      if (idx !== -1) {
        orders.value = orders.value.map((o, i) =>
          i === idx
            ? { ...o, statusId: data.newStatusId, statusName: data.newStatusName, statusColor: data.newStatusColor }
            : o
        )

        // Toast only for orders the current user owns (they're in their list)
        addToast({
          trackingCode: data.trackingCode,
          oldStatusName: data.oldStatusName,
          newStatusName: data.newStatusName,
          newStatusColor: data.newStatusColor
        })
      }

      // Emit a custom event so track.vue can listen regardless of orders list
      window.dispatchEvent(new CustomEvent('order-status-changed', { detail: data }))
    }

    ws.onclose = () => {
      reconnectTimer = setTimeout(connect, 3000)
    }

    ws.onerror = () => {
      ws?.close()
    }
  }

  function disconnect() {
    if (reconnectTimer) clearTimeout(reconnectTimer)
    ws?.close()
    ws = null
  }

  return { connect, disconnect }
}
