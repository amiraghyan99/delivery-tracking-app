# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev           # Start dev server with hot reload
npm run build         # Build for production
npm run start         # Start production server

# Linting
npm run lint          # Run ESLint

# Database
npm run prisma:generate   # Regenerate Prisma client after schema changes
npm run prisma:migrate    # Create and apply a new migration (dev only)

# Utilities
npm run create-user   # Seed/create a user via scripts/create-user.mjs
```

## Environment Setup

Copy `.env.example` to `.env` and fill in:
- `DATABASE_URL` — MySQL/MariaDB connection string
- `JWT_SECRET` — Long random string for signing JWTs

## Architecture

This is a **Nuxt 3** full-stack app (Vue 3 frontend + Nitro server) for delivery order tracking.

### Database

MySQL via **Prisma** (`@prisma/adapter-mariadb`). Models:
- `User` — role is either `ADMIN` or `CUSTOMER`
- `Status` — admin-managed statuses with `name`, `color`, `sortOrder`; not an enum
- `Order` — unique `trackingCode` (format `AX-XXXX-XXXX-XXXX`), references `statusId`, belongs to a `User`; has `items: OrderItem[]`
- `OrderItem` — child items of an order (`name`, `sourceTrackingCode`)
- `OrderStatusHistory` — log of every status change on an order

The Prisma client singleton lives in `server/utils/prisma.ts`.

### Authentication

Cookie-based JWT auth (`auth_token`, httpOnly, 7-day expiry). Flow:
1. `server/middleware/auth.ts` — runs on every request, decodes the JWT cookie and attaches `event.context.user`
2. `server/utils/auth.ts` — exports `requireUser(event)` and `requireRole(event, roles[])` helpers used directly in API handlers
3. Passwords hashed with **argon2**

### API Routes (`server/api/`)

| Route | Auth | Description |
|---|---|---|
| `POST /api/auth/register` | Public | Create CUSTOMER account |
| `POST /api/auth/login` | Public | Returns JWT cookie |
| `POST /api/auth/logout` | Any auth | Clears auth cookie |
| `GET /api/auth/me` | Optional | Returns session user or null |
| `GET /api/orders` | Any auth | ADMIN sees all; CUSTOMER sees own |
| `POST /api/orders` | CUSTOMER only | Creates order with generated tracking code |
| `PATCH /api/orders/:id` | ADMIN only | Edit order fields |
| `DELETE /api/orders/:id` | ADMIN only | Delete an order |
| `GET /api/orders/:trackingCode` | Public | Public tracking lookup |
| `PATCH /api/orders/:id/status` | ADMIN only | Update order status (also writes history + broadcasts WS event) |
| `GET /api/statuses` | Public | List all statuses ordered by `sortOrder` |
| `POST /api/statuses` | ADMIN only | Create a status |
| `PATCH /api/statuses/:id` | ADMIN only | Edit a status |
| `DELETE /api/statuses/:id` | ADMIN only | Delete a status |

Input validation uses **Zod** schemas in `server/utils/validators.ts`. Tracking code generation is in `server/utils/tracking.ts`.

### WebSocket

A WebSocket handler is mounted at `/_ws` (`server/routes/_ws.ts`). Connected peers are tracked in the `wsPeers` Set in `server/utils/wsPeers.ts`, which also exports `broadcast(message)`. When an admin updates an order's status, `PATCH /api/orders/:id/status` calls `broadcast()` with an `ORDER_STATUS_CHANGED` event (auto-imported by Nitro). `broadcast` is NOT auto-imported — import it explicitly from `~/server/utils/wsPeers`.

### Frontend

- `middleware/auth.global.ts` — route guard; public routes are `/login`, `/register`, `/track`. Protected routes check `to.meta.role` for role-based access.
- `composables/useAuth.ts` — `useState`-backed singleton for auth state (`user`, `status`, `fetchMe`, `login`, `register`)
- `composables/useOrders.ts` — `useState`-backed singleton for order list operations
- Pages use `definePageMeta({ role: 'ADMIN' | 'CUSTOMER' })` to declare required role; the global middleware enforces it
- Admin pages live under `pages/admin/` (`index.vue` for orders, `statuses.vue` for status management)

### Styling

Tailwind CSS via `@nuxtjs/tailwindcss`. Config in `tailwind.config.ts`, styles entry at `assets/css/tailwind.css`.
