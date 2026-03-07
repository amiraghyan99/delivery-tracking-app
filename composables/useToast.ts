export interface ToastItem {
  id: string
  trackingCode: string
  oldStatusName: string
  newStatusName: string
  newStatusColor: string | null
}

export function useToast() {
  const toasts = useState<ToastItem[]>('toasts', () => [])

  const add = (item: Omit<ToastItem, 'id'>) => {
    const toast: ToastItem = { ...item, id: `${Date.now()}-${Math.random()}` }
    toasts.value = [...toasts.value, toast]
    setTimeout(() => dismiss(toast.id), 6000)
  }

  const dismiss = (id: string) => {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  return { toasts, add, dismiss }
}
