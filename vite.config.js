import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Veterinaria EL Almendro',
        short_name: 'Vet. El Almendro',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        icons: [
          {
            src: 'logovet.jpg',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'logovet.jpg',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})
