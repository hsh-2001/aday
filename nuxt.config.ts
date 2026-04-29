import tailwindcss from '@tailwindcss/vite'

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
      graphqlEndpoint: import.meta.env.NUXT_PUBLIC_GRAPHQL_ENDPOINT || '/graphql'
    }
  },
  nitro: {
    preset: 'cloudflare-pages',
  }
})
