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
            },
            '^/file(.*)': {
                target: 'http://127.0.0.1:8088',
                changeOrigin: true,
                secure: false,
                configure: (proxy, _options) => {
                    proxy.on('error', (err, _req, _res) => {
                        console.log('文件代理错误:', err);
                    });
                    proxy.on('proxyReq', (proxyReq, req, _res) => {
                        console.log('文件代理请求:', req.method, req.url, '→ 转发到:', proxyReq.path);
                    });
                    proxy.on('proxyRes', (proxyRes, req, _res) => {
                        console.log('文件代理响应:', proxyRes.statusCode, req.url);
                    });
                }
            }
        }
    }
})

// vite.config.ts (或 vite.config.js) 示例
// 请将此内容添加到你的 Vite 配置文件中
//
// import { defineConfig } from 'vite';
// export default defineConfig({
//   server: {
//     proxy: {
//       '/file': 'http://localhost:8088',
//     },
//   },
// });
