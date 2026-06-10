# Use Existing Components

## 核心规则

**在实现任何 UI 界面时，必须优先使用项目中已封装好的组件，禁止直接使用 Ant Design (`antd`) 原生组件或重复造轮子。**

本项目已构建了一套完整的自定义 UI 组件库（位于 `src/components/`），所有组件均使用 CSS Modules 样式方案，支持受控/非受控双模式，无需额外引入 antd 组件。

---

## 数据存储原则

**在开发中，如非必要，禁止使用 `localStorage` 和 `sessionStorage`，避免用户篡改数据。**

- 敏感数据（如 token、用户信息）必须使用**内存存储**（参考 `src/utils/http.ts` 中的 `TokenManager` 类），不持久化到浏览器存储
- 确需持久化的非敏感配置（如主题偏好、布局宽度），可例外使用 `localStorage`（参考 `ThemeContext` 和 `LayoutWidthContext` 的实现）
- **禁止**将权限标识、用户角色、付费状态等安全相关数据放入 `localStorage`/`sessionStorage`，必须通过 API 实时校验

---

## 组件速查表

### 表单与输入类

| 场景 | 使用组件 | 导入路径 | 不要用 |
|------|---------|---------|--------|
| 按钮 | `Button` | `src/components/button/Button` | `<button>` 或 antd Button |
| 文本输入 | `Input` | `src/components/input/Input` | `<input>` 或 antd Input |
| 日期选择 | `DatePicker` | `src/components/input/DatePicker` | antd DatePicker |
| 下拉选择 | `Selector` | `src/components/selector/Selector` | antd Select |
| 标签/分类选择 | `CustomSelect` | `src/components/customSelect/CustomSelect` | 自建选择器 |
| 单选 | `Radio` / `RadioGroup` | `src/components/radiogroup/Radio` | `<input type="radio">` |
| 开关 | `Switch` | `src/components/switcher/Switch` | 自建 toggle |
| 搜索框 | `SearchBox` | `src/components/searchBox/SearchBox` | `<input type="search">` |

### 弹层与反馈类

| 场景 | 使用组件 | 导入路径 | 不要用 |
|------|---------|---------|--------|
| 对话框 | `Modal` | `src/components/modal/Modal` | antd Modal |
| 确认弹窗 | `confirm()` | `src/components/confirm/Confirm` | `window.confirm()` |
| 消息提示 | `message.success/error/warn/info()` | `src/components/message/Message` | antd message |
| 加载状态 | `Loading` | `src/components/loading/Loading` | 自建 spinner |

### 数据展示类

| 场景 | 使用组件 | 导入路径 | 不要用 |
|------|---------|---------|--------|
| 头像 | `Avatar` | `src/components/avatar/Avatar` | `<img>` 自建 |
| 骨架屏 | `Skeleton` | `src/components/skeleton/Skeleton` | 自建占位 |
| 整页骨架屏 | `PageSkeleton` | `src/components/pageSkeleton/PageSkeleton` | 自建 |
| 文章详情骨架屏 | `SkeletonArticleView` | `src/components/articleView/SkeletonArticleView` | 自建 |
| 文章错误状态 | `ArticleErrorView` | `src/components/articleView/ArticleErrorView` | 自建错误页 |
| 标签面板 | `TagPanel` | `src/components/tagPanel/TagPanel` | 自建标签列表 |
| 分类面板 | `CategoryPanel` | `src/components/categoryPanel/CategoryPanel` | 自建分类树 |
| 文章列表 | `ArticleList` | `src/components/articleList/ArticleList` | 自建列表 |
| 统计面板 | `StatsPanel` | `src/components/StatsPanel/StatsPanel` | 自建统计 |
| 日历 | `Calendar` | `src/components/calendar/Calendar` | antd Calendar |
| 错误状态 | `ErrorState` | `src/components/errorState/ErrorState` | 自建错误提示 |

### 导航与布局类

| 场景 | 使用组件 | 导入路径 | 不要用 |
|------|---------|---------|--------|
| 导航栏 | `Navbar` | `src/components/navbar/Navbar` | 自建导航 |
| 页脚 | `Footer` | `src/components/footer/Footer` | 自建页脚 |
| 回到顶部 | `BackToTop` | `src/components/backToTop/BackToTop` | 自建 |
| 搜索文章面板 | `SearchArticle` | `src/components/searchArticle/SearchArticle` | 自建 |
| 邮件订阅 | `SubscribeBox` | `src/components/SubscribeBox/SubscribeBox` | 自建 |

### 鉴权与用户类

| 场景 | 使用组件 | 导入路径 | 不要用 |
|------|---------|---------|--------|
| 登录保护 | `AuthRequired` | `src/components/auth/AuthRequired` | 自建鉴权 |
| 登录/注册按钮 | `AuthButtons` | `src/components/authButtons/AuthButtons` | 自建 |
| 用户下拉菜单 | `UserDropdown` | `src/components/userDropdown/UserDropdown` | 自建 |

### 功能组件类

| 场景 | 使用组件 | 导入路径 | 不要用 |
|------|---------|---------|--------|
| 通知系统 | `Notification` | `src/components/notification/Notification` | 自建 |
| AI 摘要 | `AiSummary` | `src/components/articleView/AiSummary` | 自建 |
| 组织信息 | `OrganizationInfo` | `src/components/organization/OrganizationInfo` | 自建 |
| 组织选择器 | `OrgSelector` | `src/components/orgSelector/OrgSelector` | 自建 |
| 组织标签页 | `OrganizationTabs` | `src/components/organization/OrganizationTabs` | 自建 |
| 主题切换 | `ThemeToggle` | `src/components/themeToggle/ThemeToggle` | 自建 |
| 布局宽度切换 | `LayoutWidthToggle` | `src/components/layoutWidthToggle/LayoutWidthToggle` | 自建 |
| 维护模式守卫 | `MaintenanceGuard` | `src/components/maintenance/MaintenanceGuard` | 自建 |
| 空闲超时 | `IdleTimeoutHandler` | `src/components/sessionTimeout/IdleTimeoutHandler` | 自建 |
| 添加按钮 | `AddButton` | `src/components/addButton/AddButton` | 自建 |
| 分配人展示 | `AssigneeDisplay` | `src/components/assigneeDisplay/AssigneeDisplay` | 自建 |

---

## 实现检查清单

在编写任何 UI 代码前，必须完成以下检查：

1. **确认需求**：我需要什么 UI 元素？（按钮、输入、选择、弹窗、骨架屏...）
2. **查表匹配**：在上面速查表中找到对应组件
3. **阅读源码**：打开组件文件，了解其 Props 接口和使用方式
4. **参考已有用法**：在项目中搜索该组件的现有使用示例
5. **直接复用**：导入并使用，不自行实现

### 如果现有组件不满足需求

- **优先扩展**：给现有组件添加新的 Props 或变体（variant），而不是创建新组件
- **组合使用**：通过组合多个现有组件来实现复杂 UI
- **确认必要**：只有在确认所有现有组件都无法满足，且无法通过扩展/组合解决时，才创建新组件
- **遵循规范**：新组件必须使用 CSS Modules（`.module.css`），放在 `src/components/<name>/` 目录下

---

## 开发流程（必须严格遵守）

涉及任何组件开发（新建组件、修改现有组件）时，必须按以下阶段顺序执行：

### 阶段 1：测试界面先行验证

- 在 `src/sample/` 目录下创建对应的测试页面（参考已有示例：`Button.tsx`, `Input.tsx`, `Selector.tsx` 等）
- 测试页面需覆盖组件的所有状态和变体（如各种 color/variant/size/disabled/loading 组合）
- 将测试页面挂载到路由（`src/router/RouterConfig.tsx`），使用 `import.meta.env.DEV` 条件限定仅开发环境可见：

```tsx
{/* 测试页面（仅开发环境可见） */}
{import.meta.env.DEV && <Route path="/test/<your-test-page>" element={<YourTestPage />} />}
```

- 在浏览器中打开对应测试路由，确认视觉效果和交互行为正确
- **测试路由命名规范**：统一使用 `/test/<组件名>` 格式（如 `/test/button`, `/test/input`）
- **未在测试界面验证通过的组件，禁止直接写入业务界面**

### 阶段 2：开发者确认

- 开发者（用户）在浏览器中查看测试页面，确认组件表现符合预期
- 确认内容包括：样式正确、交互正常、边界情况处理、无障碍（a11y）
- **必须等待用户明确确认"没问题"后，才能进入下一阶段**

### 阶段 3：集成到业务界面

- 将已验证的组件写入正式的业务页面/模块
- 使用正式数据源（API 数据、真实 Props）替换测试数据
- 测试路由使用了 `import.meta.env.DEV` 条件包裹，生产环境自动排除，无需移除路由配置（测试页面代码保留在 `src/sample/` 中便于后续维护）

### 阶段 4：构建校验与格式化收尾

按顺序执行以下命令：

```bash
# 1. TypeScript 类型检查 + Vite 构建，确保无编译错误
npm run build

# 2. Prettier 格式化所有代码，确保代码风格一致
npm run format
```

- `npm run build` 会执行 `tsc -b && vite build`，首先进行完整的 TypeScript 类型检查，然后构建生产包
- `npm run format` 会格式化 `src/**/*.{js,jsx,ts,tsx,json,css,scss,md}` 所有文件
- 如果 build 报错，必须修复所有错误后重新 build 通过，才算完成

### 流程总结

```
编写测试页面 → 路由挂载 → 用户浏览器确认 → 集成到业务界面 → npm run build → npm run format
     ↑                                                                                    |
     └──────────────────── 如有 build 错误，修复后重新 build ─────────────────────────────┘
```

---

## Props 接口速查

### Button
```tsx
interface ButtonProps {
  children: React.ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  variant?: 'solid' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}
```

### Input
```tsx
interface InputProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onPressEnter?: () => void;
  onClear?: () => void;
  size?: 'small' | 'default' | 'large';
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  allowClear?: boolean;
  loading?: boolean;
  disabled?: boolean;
  placeholder?: string;
}
```

### Modal
```tsx
interface ModalProps {
  visible: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
  size?: 'small' | 'medium' | 'large';
  closeOnMaskClick?: boolean;
}
```

### Selector
```tsx
interface SelectorProps {
  options: Array<{ label: string; value: string }>;
  value?: string | string[];
  defaultValue?: string | string[];
  onChange?: (value: string | string[]) => void;
  mode?: 'single' | 'multiple';
  showSearch?: boolean;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  allowClear?: boolean;
  size?: 'small' | 'default' | 'large';
}
```

### Skeleton
```tsx
interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: number | string;
  height?: number | string;
  lines?: number;
  animation?: 'pulse' | 'wave' | 'none';
}
```

### message (命令式)
```tsx
import { message } from 'src/components/message/Message';
message.success('操作成功');
message.error('操作失败');
message.warn('警告信息');
message.info('提示信息');
```

### confirm (命令式)
```tsx
import { confirm } from 'src/components/confirm/Confirm';
const result = await confirm({
  title: '确认删除',
  content: '此操作不可撤销，确定要删除吗？',
  confirmText: '确定',
  cancelText: '取消',
});
if (result) { /* 用户点击了确定 */ }
```

---

## 反模式（禁止）

- ❌ `import { Button } from 'antd'` — 使用 `import Button from 'src/components/button/Button'`
- ❌ `<input type="text" />` — 使用 `<Input />`
- ❌ `<select>` — 使用 `<Selector />`
- ❌ `window.confirm()` — 使用 `confirm()`
- ❌ `alert()` — 使用 `message.info()`
- ❌ 手写 CSS 骨架屏 — 使用 `<Skeleton />`
- ❌ 手写 `<nav>` 导航 — 使用 `<Navbar />`
- ❌ 手写弹窗 `<div className="modal">` — 使用 `<Modal />`
- ❌ 手写 loading spinner — 使用 `<Loading />`
