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


⏺ 基于深入分析，这个 FrontTemplate 项目采用了现代化的组件化架构设计，体现了 原子设计 和 分层架构 的理念。

  🏗️ 整体架构特点

  1. 清晰的分层结构

  src/
  ├── components/    # 通用组件库（原子+复合组件）
  ├── pages/         # 页面组件（按功能模块划分）
  ├── contexts/      # React Context状态管理
  ├── services/      # API服务层
  ├── types/         # TypeScript类型定义
  └── utils/         # 工具函数

  2. 组件分层设计

  原子组件：Button、Input、Modal、Skeleton - 基础UI building blocks

  复合组件：SearchBox、DatePicker、RadioGroup - 组合多个原子组件

  业务组件：ArticleList、UserDropdown、AuthButtons - 特定业务逻辑

  3. 核心技术栈

  - CSS Modules + CSS Variables：样式隔离 + 主题系统
  - TypeScript：全面的类型安全
  - Context API：轻量级状态管理
  - forwardRef + useImperativeHandle：组件ref传递模式

  🎨 设计亮点

  1. 统一的主题系统

  使用CSS Variables实现亮/暗主题切换，保证设计一致性。

  2. 模块化样式管理

  每个组件配备独立的.module.css文件，避免样式冲突，支持BEM命名规范。

  3. 类型驱动开发

  集中式类型定义，接口组合复用，TypeScript全覆盖提供优秀的开发体验。

  4. 服务层分离

  按业务领域划分服务（authService、articleService等），便于维护和扩展。

  🚀 架构优势

  - 高可维护性：清晰的目录结构和职责划分
  - 强可扩展性：模块化设计便于添加新功能
  - 良好可复用性：原子组件可在多场景复用
  - 优秀开发体验：类型安全、样式隔离、组件示例齐全

  这是一个为中等规模Web应用设计的优秀技术架构范例，平衡了开发效率和代码质量。