// https://nuxt.com/docs/api/configuration/nuxt-config
import { fileURLToPath } from 'node:url';
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxt/fonts',
    '@nuxt/test-utils'
  ],

  css: [
    'vue-multiselect/dist/vue-multiselect.css'
  ],

  runtimeConfig: {
    public: {
      SCBD_INDEX_ENDPOINT: process.env.NUXT_PUBLIC_SCBD_INDEX_ENDPOINT,
      SCBD_API_BASE: process.env.NUXT_PUBLIC_SCBD_API_BASE
    }
  },

  // Ensure imports from the monorepo-like shared folder resolve in both client & server
  alias: {
    shared: fileURLToPath(new URL('./shared', import.meta.url))
  },

  vite: {
    resolve: {
      alias: {
        shared: fileURLToPath(new URL('./shared', import.meta.url))
      }
    }
  },

  nitro: {
    externals: {
      // Inline the shared workspace so Nitro bundles it
      inline: ['shared']
    }
  }
});
