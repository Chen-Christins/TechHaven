import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8088',
        changeOrigin: true,
        secure: false,
        // 注意：使用代理时，withCredentials 在开发环境下可能不需要
        // 因为代理服务器会处理跨域问题
      }
    }
  }
})
