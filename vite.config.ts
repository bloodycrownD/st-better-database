import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'

export default defineConfig({
  plugins: [vue(), cssInjectedByJsPlugin()],
  build: {
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        entryFileNames: 'index.js',
        manualChunks: () => 'index.js',
        assetFileNames: () => 'index.js'
      }
    }
  }
})
