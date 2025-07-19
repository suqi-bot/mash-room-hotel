import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => ({
  // 根据环境动态设置基础路径
  // 开发环境使用 '/'，生产环境使用 '/hotel/'
  base: mode === 'production' ? '/muguzhuangyuan/' : '/',
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  build: {
    assetsInlineLimit: 0, // 禁用内联，确保所有资源都作为文件输出
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          // 为视频文件保持原始文件名
          if (assetInfo.name && assetInfo.name.endsWith('.mp4')) {
            return 'assets/videos/[name]-[hash][extname]'
          }
          return 'assets/[name]-[hash][extname]'
        }
      }
    }
  },
  assetsInclude: ['**/*.mp4'], // 明确包含 mp4 文件作为静态资源
  server: {
    proxy: {
      // 代理Dify公网链接
      '/api/dify/chat': {
        target: 'http://172.30.22.125/chat',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/dify\/chat/, ''),
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('🔴 代理错误:', err.message);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('🔄 代理请求:', req.method, req.url, '→', proxyReq.path);
            console.log('📤 请求头:', proxyReq.getHeaders());
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('✅ 代理响应:', proxyRes.statusCode, req.url);
            console.log('📥 响应头:', proxyRes.headers);
            console.log('📄 Content-Type:', proxyRes.headers['content-type']);
          });
        }
      },
      // 代理Dify后端API
      '/api/dify/v1': {
        target: 'http://172.30.22.125/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/dify\/v1/, ''),
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('🔴 代理错误:', err.message);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('🔄 代理请求:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('✅ 代理响应:', proxyRes.statusCode, req.url);
          });
        }
      }
    }
  }
}))
