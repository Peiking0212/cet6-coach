import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'

/** GitHub Pages project site: /cet6-coach/. Local dev & generic build: /. */
const base = process.env.VITE_BASE_PATH || '/'
const nativeApp = process.env.VITE_NATIVE_APP === 'true'

export default defineConfig({
  base,
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  plugins: [
    react(),
    ...(nativeApp
      ? []
      : [
          VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
            manifest: {
              name: '六级陪练 CET-6 Coach',
              short_name: '六级陪练',
              description: '手机/平板随时可用的六级听说读写陪练 PWA，含 AI 讲解与作文批改。',
              theme_color: '#ff6fa5',
              background_color: '#fff0f6',
              display: 'standalone',
              orientation: 'portrait',
              lang: 'zh-CN',
              start_url: base,
              scope: base,
              icons: [
                { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
                { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
                {
                  src: 'pwa-512.png',
                  sizes: '512x512',
                  type: 'image/png',
                  purpose: 'maskable',
                },
              ],
            },
            workbox: {
              globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
              globIgnores: ['**/audio/exams/**'],
              navigateFallback: 'index.html',
              cleanupOutdatedCaches: true,
              maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
            },
            devOptions: {
              enabled: false,
            },
          }),
        ]),
  ],
})
