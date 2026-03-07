# 🚚 Delivery Tracking App

A full‑stack delivery tracking application built with **Nuxt**, **Prisma**, and **Node.js** — designed to provide real‑time delivery status updates, manage tracking data, and serve as a scalable foundation for logistics and delivery systems.  
[GitHub Repository](https://github.com/amiraghyan99/delivery-tracking-app)

---

## 🧠 Features

- 🗺️ Delivery tracking dashboard
- 🔄 Real‑time status updates
- 📦 Package & shipment management
- 🛠️ Built with modern tooling:
  - Nuxt (Vue 3)
  - Prisma ORM
  - Node.js backend
  - TailwindCSS
- 🔐 Environment variables support
- 🧪 Easily extendable for custom carriers & APIs

---

## 🚀 Tech Stack

| Layer    | Technology          |
|----------|-------------------|
| Frontend | Nuxt / Vue.js      |
| Backend  | Node.js            |
| ORM      | Prisma             |
| Styling  | Tailwind CSS       |
| Language | TypeScript & JavaScript |

---

## 🛠️ Installation & Setup

All setup commands are combined into one block:

```bash
# Clone the repository
git clone https://github.com/amiraghyan99/delivery-tracking-app.git
cd delivery-tracking-app

# Install dependencies
npm install
# or
yarn install

# Create environment variables file
cp .env.example .env
# Edit .env with your database URL, API keys, and other configuration

# Setup database with Prisma
npx prisma migrate dev --name init

# Start development server
npm run dev
# or
yarn dev

# For production:
# Build the application
npm run build
# or
yarn build
