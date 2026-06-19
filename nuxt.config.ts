import { fileURLToPath } from 'node:url'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },

  modules: ['@nuxt/icon'],

  icon: {
    // Bundle the Lucide + circle-flags collections so icons resolve locally (no outbound CDN).
    serverBundle: { collections: ['lucide', 'circle-flags'] }
  },

  app: {
    head: {
      title: 'hon.ey — URL Honeypot',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'URL honeypot & canary-token tracking dashboard' },
        { name: 'robots', content: 'noindex, nofollow' },
        { name: 'theme-color', content: '#F2A007' }
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..900;1,9..144,400..900&family=Figtree:wght@300..800&family=Space+Mono:wght@400;700&display=swap'
        }
      ]
    }
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    // Override via NUXT_GEO_LOOKUP=false to disable outbound IP geo enrichment
    geoLookup: true,
    public: {
      // Public base URL used when generating tracking links.
      // Set NUXT_PUBLIC_BASE_URL=https://your-domain.tld when deploying.
      // Empty -> falls back to the browser's current origin.
      baseUrl: ''
    }
  },

  nitro: {
    storage: {
      db: {
        driver: 'fs',
        base: fileURLToPath(new URL('./.data', import.meta.url))
      }
    }
  }
})
