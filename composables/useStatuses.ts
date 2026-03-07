import type { StatusDto } from '~/types'

export function useStatuses() {
  const statuses = useState<StatusDto[]>('statuses:list', () => [])

  const fetchStatuses = async () => {
    const res = await $fetch<{ statuses: StatusDto[] }>('/api/statuses')
    statuses.value = res.statuses
  }

  const createStatus = async (payload: { name: string; color: string; sortOrder: number }) => {
    const res = await $fetch<{ status: StatusDto }>('/api/statuses', {
      method: 'POST',
      body: payload
    })
    statuses.value = [...statuses.value, res.status].sort((a, b) => a.sortOrder - b.sortOrder)
    return res.status
  }

  const updateStatus = async (id: number, payload: { name?: string; color?: string | null; sortOrder?: number }, { reorder = true } = {}) => {
    const res = await $fetch<{ status: StatusDto }>(`/api/statuses/${id}`, {
      method: 'PATCH',
      body: payload
    })
    const updated = statuses.value.map((s) => (s.id === id ? res.status : s))
    statuses.value = reorder ? updated.sort((a, b) => a.sortOrder - b.sortOrder) : updated
    return res.status
  }

  const deleteStatus = async (id: number) => {
    await $fetch(`/api/statuses/${id}`, { method: 'DELETE' })
    statuses.value = statuses.value.filter((s) => s.id !== id)
  }

  return {
    statuses,
    fetchStatuses,
    createStatus,
    updateStatus,
    deleteStatus
  }
}
