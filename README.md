# 博客前端（React + TypeScript）

本项目为博客系统的前端实现，使用现代 React 技术栈重构原生 `html+css+js` 方案，支持首页/文章阅读与发布、个人中心、组织模块以及管理后台等页面。

## 技术栈

- `React` + `TypeScript` + `Vite`
- 路由：`react-router-dom`
- 网络：`axios`（封装在 `src/utils/http.ts`）
- UI/渲染：`antd`、`echarts`
- Markdown：`react-markdown`、`@uiw/react-markdown-preview`、`rehype-*`、`remark-*`
- 样式：CSS Modules（页面与组件目录下的 `*.module.css`）
- 工程化：`eslint`（flat config）+ `prettier`

## 开发环境要求

- Node.js（建议使用较新的 LTS）
- npm（项目自带 `package-lock.json`）

## 快速开始

安装依赖：

```bash
npm install
```

启动开发服务器：

```bash
npm run dev
```

构建生产包：

```bash
npm run build
```

本地预览生产包：

```bash
npm run preview
```

## 常用脚本

以下脚本定义在 `package.json:scripts`：

- `npm run dev`：启动 Vite 开发服务器
- `npm run build`：`tsc -b` 后执行 `vite build`
- `npm run preview`：预览 `dist/`
- `npm run lint`：运行 ESLint
- `npm run lint:fix`：对 `src/` 进行 ESLint 自动修复
- `npm run format`：对 `src/` 下常见文件执行 Prettier 格式化

## 环境变量与后端联调

项目使用 Vite 环境变量（见 `.env.development` / `.env.production`）：

- `VITE_API_BASE_URL`：不走代理时的后端基地址
- `VITE_USE_PROXY`：是否使用开发代理（`true` 时默认走 `/api`）
- `VITE_REQUIRE_CREDENTIALS`：是否开启 `withCredentials`

### 开发代理

`vite.config.ts` 已配置代理：

- `^/api(.*)` → `http://127.0.0.1:8088`，并将路径前缀 `/api` 重写掉
- `^/file(.*)` → `http://127.0.0.1:8088`

当 `VITE_USE_PROXY=true` 时，HTTP 客户端默认以 `/api` 作为 `baseURL`（见 `src/utils/http.ts`）。

## 主要页面路由

路由集中在 `src/router/RouterConfig.tsx`，常用入口：

- `/`：首页
- `/auth`：登录/注册/找回密码
- `/article/create`：发布文章
- `/article/view/:id`：文章详情
- `/profile`：个人资料
- `/personal`：个人中心
- `/organizations/list`：组织列表
- `/organization/detail/:id`：组织详情
- `/admin`：管理后台（子路由如 `/admin/users`、`/admin/analytics` 等）

管理后台页面说明可参考：`src/pages/admin/README.md`。

## 目录结构

```
src/
  components/      # 通用组件（Confirm/Message/Modal/Input/Navbar 等）
  contexts/        # 全局上下文（Theme/Auth）
  pages/           # 业务页面（home/auth/article/admin/organization/personal 等）
  router/          # 路由配置
  services/        # API Service 封装
  types/           # 全局类型定义
  utils/           # 工具与请求封装（http/cookie/utils）
```

## 代码规范

- ESLint：配置在 `eslint.config.ts`
- Prettier：配置在 `.prettierrc.cjs`

建议在提交前执行：

```bash
npm run lint
npm run build
```
