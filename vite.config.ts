import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// L'app est publiée sur https://<compte>.github.io/chefcuisto/
// BASE_PATH permet de changer ce chemin sans toucher au code.
const base = process.env.BASE_PATH ?? '/chefcuisto/'

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/apple-touch-icon.png', 'icons/favicon.svg'],
      manifest: {
        name: 'Cuisto',
        short_name: 'Cuisto',
        description: 'Mes recettes et celles de Maman',
        lang: 'fr',
        start_url: base,
        scope: base,
        display: 'standalone',
        background_color: '#fbf6ee',
        theme_color: '#b5543a',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallback: `${base}index.html`,
        // Les photos venant de Supabase sont gardées en cache pour le mode hors connexion.
        runtimeCaching: [
          {
            urlPattern: /\/storage\/v1\/object\/public\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'photos',
              expiration: { maxEntries: 800, maxAgeSeconds: 60 * 60 * 24 * 90 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
})
