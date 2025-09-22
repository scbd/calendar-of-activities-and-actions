// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxt/fonts',
    '@nuxt/test-utils'
  ],

  runtimeConfig: {
    public: {
      SCBD_INDEX_ENDPOINT: process.env.NUXT_PUBLIC_SCBD_INDEX_ENDPOINT || 'https://api.cbd.int/api/v2013/index/select'
    }
  },

  nitro: {
    externals: {
      inline: ['shared/']
    }
  }
});