import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, existsSync, mkdirSync } from 'fs'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ _command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')
  
  const isProduction = mode === 'production'
  
  // Custom plugin to copy PDF.js worker file
  const pdfWorkerPlugin = () => ({
    name: 'pdf-worker',
    buildStart() {
      // Copy PDF.js worker to public directory at build start
      try {
        // Try multiple possible worker file locations
        const possibleWorkerPaths = [
          resolve('node_modules/pdfjs-dist/build/pdf.worker.min.mjs'),
          resolve('node_modules/pdfjs-dist/build/pdf.worker.mjs'),
          resolve('node_modules/pdfjs-dist/build/pdf.worker.min.js'),
          resolve('node_modules/pdfjs-dist/build/pdf.worker.js')
        ]
        
        const publicDir = resolve('public')
        const workerDest = resolve(publicDir, 'pdf.worker.min.js')
        
        if (!existsSync(publicDir)) {
          mkdirSync(publicDir, { recursive: true })
        }
        
        let workerCopied = false
        for (const workerSrc of possibleWorkerPaths) {
          if (existsSync(workerSrc)) {
            copyFileSync(workerSrc, workerDest)
            console.log(`✓ PDF.js worker copied from ${workerSrc} to public directory`)
            workerCopied = true
            break
          }
        }
        
        if (!workerCopied) {
          console.warn('Warning: PDF.js worker source file not found in any expected location')
          console.warn('Checked paths:', possibleWorkerPaths)
        }
      } catch (error) {
        console.warn('Warning: Could not copy PDF.js worker:', error.message)
      }
    }
  })

  return {
    plugins: [react(), pdfWorkerPlugin()],
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
          manualChunks: (id) => {
            // Vendor chunks for better caching
            if (id.includes('node_modules')) {
              // React ecosystem
              if (id.includes('react') || id.includes('react-dom')) {
                return 'react-vendor'
              }
              // Redux ecosystem
              if (id.includes('@reduxjs/toolkit') || id.includes('react-redux') || id.includes('reselect')) {
                return 'redux-vendor'
              }
              // Router
              if (id.includes('react-router')) {
                return 'router-vendor'
              }
              // Animation libraries
              if (id.includes('framer-motion')) {
                return 'animation-vendor'
              }
              // Chart libraries
              if (id.includes('recharts')) {
                return 'chart-vendor'
              }
              // Form libraries
              if (id.includes('react-hook-form') || id.includes('@hookform/resolvers') || id.includes('yup')) {
                return 'form-vendor'
              }
              // Icon libraries
              if (id.includes('lucide-react') || id.includes('@heroicons/react')) {
                return 'icon-vendor'
              }
              // Appwrite
              if (id.includes('appwrite')) {
                return 'appwrite-vendor'
              }
              // PDF processing
              if (id.includes('pdfjs-dist') || id.includes('mammoth')) {
                return 'pdf-vendor'
              }
              // Other large vendors
              return 'vendor'
            }
            
            // App chunks based on routes
            if (id.includes('src/pages/admin')) {
              return 'admin'
            }
            if (id.includes('src/pages/interview')) {
              return 'interview'
            }
            if (id.includes('src/pages/resume')) {
              return 'resume'
            }
            if (id.includes('src/pages/library')) {
              return 'library'
            }
            if (id.includes('src/pages/auth')) {
              return 'auth'
            }
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
        'reselect',
        'react-router-dom',
        'react-hook-form',
        'framer-motion',
        'lucide-react',
        'recharts',
        'yup'
      ],
      exclude: [
        'appwrite', // Let Appwrite be bundled normally
        'pdfjs-dist' // PDF.js has special loading requirements
      ]
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
          maxThreads: 1, // Limit to 1 thread to prevent memory issues
          minThreads: 1,
        }
      },
      maxConcurrency: 1, // Limit concurrent tests to prevent memory issues
      isolate: false, // Share context between tests to reduce memory usage
    },
  }
})