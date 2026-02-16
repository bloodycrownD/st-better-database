import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'

export default defineConfig({
  plugins: [vue(), cssInjectedByJsPlugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@st-core': fileURLToPath(new URL('../../../../', import.meta.url)),
      '@st-scripts': fileURLToPath(new URL('../../../', import.meta.url)),
    },
  },
  define: {
    'process.env': '{}',
    global: 'globalThis',
  },
  build: {
    lib: {
      entry: fileURLToPath(new URL('./src/main.ts', import.meta.url)),
      fileName: 'index',
      formats: ['es'],
    },
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        paths: (id) => {
          if (id === '@st-core/script.js') {
            return '/script.js'
          }
          if (id === '@st-scripts/extensions.js') {
            return '/scripts/extensions.js'
          }
          if (id === '@st-scripts/popup.js') {
            return '/scripts/popup.js'
          }
          return id
        },
      },
      external: [/^@st-core\/.*/, /^@st-scripts\/.*/],
    },
  }
})
