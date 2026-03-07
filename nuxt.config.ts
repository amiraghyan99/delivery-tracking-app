import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  devtools: { enabled: true },
  srcDir: '.',
  typescript: {
    strict: true,
    typeCheck: true
  },
  css: ['~/assets/css/tailwind.css'],
  modules: ['@nuxtjs/tailwindcss'],
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {}
    }
  },
  runtimeConfig: {
    jwtSecret: process.env.JWT_SECRET || '',
    public: {
      appName: 'Demo Delivery Tracking Service'
    }
  },
  nitro: {
    preset: 'node-server',
    experimental: {
      websocket: true
    }
  }
})

