// https://nuxt.com/docs/api/configuration/nuxt-config
import { fileURLToPath } from 'node:url';
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  app: {
    baseURL: '/calendar-of-activities-and-actions/'
  },

  typescript: {
    strict: false,
    typeCheck: false
  },

  modules: [
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxt/fonts',
    '@nuxt/test-utils',
    '@nuxtjs/i18n'
  ],
  i18n: {
    locales: [
      { code: 'en', name: 'English', file: 'en.json' },
      { code: 'fr', name: 'Français', file: 'fr.json' },
      { code: 'es', name: 'Español', file: 'es.json' },
      { code: 'ar', name: 'العربية', file: 'ar.json' },
      { code: 'ru', name: 'Русский', file: 'ru.json' },
      { code: 'zh', name: '中文', file: 'zh.json' }
    ],
    defaultLocale: 'en',
    langDir: fileURLToPath(new URL('./i18n/locales', import.meta.url)),
    strategy: 'no_prefix',
    detectBrowserLanguage: {
      alwaysRedirect: false,
      useCookie: true,
      cookieKey: 'i18n_redirected'
    }
  },
  css: [
    'vue-multiselect/dist/vue-multiselect.css',
    '@/assets/styles/main.scss'
  ],

  runtimeConfig: {
    public: {
      scbdApiBase: process.env.NUXT_PUBLIC_SCBD_API_BASE || 'https://api.cbddev.xyz'
    }
  },

  // Ensure imports from the monorepo-like shared folder resolve in both client & server
  alias: {
    shared: fileURLToPath(new URL('./shared', import.meta.url))
  },

  vite: {
    assetsInclude: ['**/*.md'],
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
