import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')
  
  const isProduction = mode === 'production'
  
  return {
    plugins: [react()],
    server: {
      port: 3000,
      open: true
    },
    build: {
      outDir: 'dist',
      sourcemap: isProduction ? false : true, // Disable sourcemaps in production for security
      // Bundle optimization
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor chunks for better caching
            'react-vendor': ['react', 'react-dom'],
            'redux-vendor': ['@reduxjs/toolkit', 'react-redux'],
            'router-vendor': ['react-router-dom'],
            'ui-vendor': ['@heroicons/react'],
            'form-vendor': ['react-hook-form', '@hookform/resolvers', 'yup'],
            // Separate chunk for Appwrite
            'appwrite-vendor': ['appwrite'],
          },
          // Optimize chunk file names
          chunkFileNames: (chunkInfo) => {
            const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
            return `js/${facadeModuleId}-[hash].js`;
          },
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split('.');
            const ext = info[info.length - 1];
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
              return `images/[name]-[hash][extname]`;
            }
            if (/css/i.test(ext)) {
              return `css/[name]-[hash][extname]`;
            }
            return `assets/[name]-[hash][extname]`;
          }
        }
      },
      // Optimize build performance
      target: 'esnext',
      minify: isProduction ? 'esbuild' : false,
      // Chunk size warnings
      chunkSizeWarningLimit: 1000,
      // Enable CSS code splitting
      cssCodeSplit: true,
      // Optimize dependencies
      commonjsOptions: {
        include: [/node_modules/],
        transformMixedEsModules: true
      },
      // Production optimizations
      ...(isProduction && {
        reportCompressedSize: false, // Disable gzip size reporting for faster builds
        cssMinify: true,
        assetsInlineLimit: 4096, // Inline assets smaller than 4kb
      })
    },
    // Optimize dependencies
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        '@reduxjs/toolkit',
        'react-redux',
        'react-router-dom',
        'react-hook-form',
        '@heroicons/react/24/outline',
        '@heroicons/react/24/solid'
      ],
      exclude: ['appwrite'] // Let Appwrite be bundled normally
    },
    // Environment variable handling
    define: {
      __APP_VERSION__: JSON.stringify(env.VITE_APP_VERSION || '1.0.0'),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    },
    // Preview server configuration
    preview: {
      port: 4173,
      host: true
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.js'],
      testTimeout: 10000, // 10 seconds timeout for individual tests
      hookTimeout: 10000, // 10 seconds timeout for hooks
      teardownTimeout: 10000, // 10 seconds timeout for teardown
      pool: 'threads',
      poolOptions: {
        threads: {
          singleThread: true, // Run tests in single thread to avoid conflicts
        }
      },
      maxConcurrency: 5, // Limit concurrent tests
    },
  }
})