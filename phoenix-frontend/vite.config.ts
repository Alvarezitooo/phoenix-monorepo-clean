import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    }
  },
  build: {
    // Optimisations performance
    target: 'es2015',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        // Code splitting intelligent pour vendor chunks
        manualChunks: {
          // Vendor libraries principales
          'vendor-react': ['react', 'react-dom'],
          'vendor-router': ['react-router-dom'],
          'vendor-ui': ['lucide-react'],
          // Services API séparés
          'services': [
            './src/services/api.ts',
            './src/services/aubeApi.ts',
            './src/services/cvApi.ts',
            './src/services/lettersApi.ts',
            './src/services/riseApiPhoenix.ts'
          ],
          // Luna core séparé
          'luna-core': [
            './src/luna/LunaContext.tsx',
            './src/luna/LunaConversationalSidebar.tsx',
            './src/services/narrativeCapture.ts'
          ]
        }
      }
    }
  },
  // Optimisations dev
  server: {
    hmr: {
      overlay: false
    }
  }
})
