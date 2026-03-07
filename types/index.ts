export type UserRole = 'ADMIN' | 'CUSTOMER'

export interface OrderItemDto {
  id: number
  name: string
  sourceTrackingCode: string
}

export interface OrderStatusHistoryDto {
  statusId: number
  statusName: string
  statusColor: string | null
  changedAt: string
}

export interface StatusDto {
  id: number
  name: string
  color: string | null
  sortOrder: number
}

export interface SessionUser {
  id: number
  name: string
  email: string
  role: UserRole
}

export interface OrderDto {
  id: number
  trackingCode: string
  statusId: number
  statusName: string
  statusColor: string | null
  customerId: number
  createdAt: string
  updatedAt: string
  customerName?: string
  customerEmail?: string
  items: OrderItemDto[]
}

