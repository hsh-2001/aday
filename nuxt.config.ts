// https://nuxt.com/docs/api/configuration/nuxt-config
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'

const prismaWasmWorkerLoader = fileURLToPath(
  new URL('./server/utils/prisma-wasm-loader.mjs', import.meta.url)
)

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  vite: {
    optimizeDeps: {
      include: [
        '@vue/devtools-core',
        '@vue/devtools-kit',
      ],
    },
    plugins: [
      tailwindcss(),
    ],
  },
  runtimeConfig: {
    public: {
      graphqlEndpoint: process.env.NUXT_PUBLIC_GRAPHQL_ENDPOINT || '/graphql'
    }
  },
  nitro: {
    preset: 'cloudflare-pages',
    alias: {
      '#wasm-compiler-loader': prismaWasmWorkerLoader,
    },
  }
})
