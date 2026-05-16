import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), "");
    const apiTarget = env.VITE_API_BASE_URL || "http://127.0.0.1:8088";

    const timeStamp = () => {
      const d = new Date();
      const ns = process.hrtime()[1];
      const us = Math.floor(ns / 1000)
        .toString()
        .padStart(6, "0");
      return `[${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}.${us}]`;
    };

    return {
        plugins: [react()],
        server: {
            proxy: {
                "^/api/v1": {
                    target: apiTarget,
                    changeOrigin: true,
                    secure: false,
                    configure: (proxy, _options) => {
                        proxy.on("error", (err, _req, _res) => {
                            console.log(timeStamp(), "代理错误:", err);
                        });
                        proxy.on("proxyReq", (proxyReq, req, _res) => {
                            console.log(timeStamp(), "代理请求:", req.method, req.url, "→ 转发到:", proxyReq.path);
                        });
                        proxy.on("proxyRes", (proxyRes, req, _res) => {
                            console.log(timeStamp(), "代理响应:", proxyRes.statusCode, req.url);
                        });
                    },
                },
                "^/file(.*)": {
                    target: apiTarget,
                    changeOrigin: true,
                    secure: false,
                    timeout: 100000,
                    agent: false,
                    configure: (proxy, _options) => {
                        proxy.on("error", (err, _req, _res) => {
                            console.log(timeStamp(), "文件代理错误:", err);
                        });
                        proxy.on("proxyReq", (proxyReq, req, _res) => {
                            console.log(timeStamp(), "文件代理请求:", req.method, req.url, "→ 转发到:", proxyReq.path);
                            // 设置连接保持活跃
                            proxyReq.setHeader("Connection", "keep-alive");
                        });
                        proxy.on("proxyRes", (proxyRes, req, _res) => {
                            console.log(timeStamp(), "文件代理响应:", proxyRes.statusCode, req.url);
                        });
                    },
                },
            },
        },
    };
});
