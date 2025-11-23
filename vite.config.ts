import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            '^/api(.*)': {
                target: 'http://127.0.0.1:8088',
                changeOrigin: true,
                secure: false,
                rewrite: (path) => {
                    const newPath = path.replace(/^\/api/, '');
                    return newPath;
                },
                configure: (proxy, _options) => {
                    proxy.on('error', (err, _req, _res) => {
                        console.log('代理错误:', err);
                    });
                    proxy.on('proxyReq', (proxyReq, req, _res) => {
                        console.log('代理请求:', req.method, req.url, '→ 转发到:', proxyReq.path);
                    });
                    proxy.on('proxyRes', (proxyRes, req, _res) => {
                        console.log('代理响应:', proxyRes.statusCode, req.url);
                    });
                }
            }
        }
    }
})
