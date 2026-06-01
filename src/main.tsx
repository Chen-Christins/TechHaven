import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

// 生产环境屏蔽 console.log，开发环境保留
if (!import.meta.env.DEV) {
  console.log = () => {};
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
