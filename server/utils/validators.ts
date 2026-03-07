import { z } from 'zod'

export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100)
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100)
})

export const orderItemSchema = z.object({
  name: z.string().min(1).max(200),
  sourceTrackingCode: z.string().min(1).max(100)
})

export const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, 'At least one item is required')
})

export const updateOrderStatusSchema = z.object({
  statusId: z.number().int().positive()
})

