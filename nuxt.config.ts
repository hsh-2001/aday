// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  // nitro: {
  //   preset: 'vercel',
  // },
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
    preset: 'node-server'
  }
})
