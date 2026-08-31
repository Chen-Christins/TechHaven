# TechHaven

[简体中文](README.md)

TechHaven is a knowledge and collaboration platform frontend for technical teams. It brings technical blogging, community interaction, organization collaboration, and lightweight development management into one application.

Users can publish and read technical articles, participate in discussions, and manage requirements, bugs, tasks, assignments, and GitHub Pull Request data within organizations. The platform also includes a personal center, real-time notifications, development trend analysis, and an administration console, connecting knowledge sharing with engineering execution.

> This repository contains the web frontend only. Running the complete application requires compatible HTTP API, file service, and WebSocket services.

## Core Features

### Technical Blog

- Article feed with keyword search, tag and category filters, and pagination.
- Markdown article creation, editing, live preview, and temporary draft recovery.
- GFM, syntax highlighting, KaTeX mathematical formulas, and Mermaid diagrams.
- Table of contents extraction, scroll positioning, and active section highlighting.
- Streaming AI summaries over SSE.
- Article review workflow and content management in the admin console.

### Community Interaction

- Likes for articles and comments.
- Nested comments, replies, and comment editing.
- Author following, follower lists, and following lists.
- User profiles, personal articles, and usage statistics.
- Online user count, real-time notifications, and system broadcasts.

### Organization Collaboration

- Organization list, organization details, and organization creation requests.
- Organization member, role, and join-request management.
- Organization tasks and assignment publishing.
- Assignment file submission, upload progress, and chunked uploads.
- Organization repository information and GitHub Pull Request data entry points.

### Development Workspace

- Development dashboard and pending work item summaries.
- Create, edit, delete, and view details for requirements, bugs, and tasks.
- My tickets and organization-level filtering.
- GitHub Pull Request synchronization, search, and review status display.
- Seven-day and thirty-day development trend analysis.
- Access control based on authentication, organization membership, and organization roles.

### Administration Console

- User, article, comment, category, assignment, and organization management.
- Data backups, exports, and storage statistics.
- Site settings, maintenance mode, and session settings.
- System notifications and broadcast management.
- User feedback, FAQ, and help content operations.

### Platform Experience

- Light and dark modes, theme skins, custom cursors, and layout width switching.
- Responsive layouts, skeleton screens, empty states, error states, and shared feedback components.
- Maintenance-mode guarding and idle session timeouts.
- Automatic reconnect for notification and presence WebSocket connections.

## Architecture and Stack

| Category                | Technology                                                   |
| ----------------------- | ------------------------------------------------------------ |
| Application             | React 19, TypeScript, Vite 8                                 |
| Routing                 | React Router 7                                               |
| Networking              | Axios, Fetch, SSE                                            |
| Real-time communication | WebSocket                                                    |
| UI and styling          | Custom component library, CSS Modules, CSS custom properties |
| Content rendering       | React Markdown, GFM, KaTeX, Mermaid, Highlight.js            |
| Data visualization      | ECharts                                                      |
| Page scrolling          | SimpleBar                                                    |
| Tooling                 | Strict TypeScript, Prettier, GitHub Actions                  |

New business interfaces should reuse components from `src/components/`. Although `antd` remains in the dependency tree, business source code does not directly use its native components, and new UI should not replace the project's existing components with antd components.

## Requirements

- Node.js `^20.19.0` or `>=22.12.0`
- npm
- Accessible HTTP API, file service, and WebSocket service

The repository includes `package-lock.json`; `npm ci` is recommended for reproducible dependency installation.

## Quick Start

```bash
git clone https://github.com/Chen-Christins/TechHaven.git
cd TechHaven
npm ci
npm run dev
```

Use the local address printed by Vite after startup.

## Environment Variables

Vite loads environment files according to the current mode, including `.env.development` and `.env.production`.

| Variable                   | Purpose                                                                           |
| -------------------------- | --------------------------------------------------------------------------------- |
| `VITE_API_BASE_URL`        | Direct API URL, or the target URL for the Vite development proxy                  |
| `VITE_WS_URL`              | Base URL of the WebSocket service                                                 |
| `VITE_USE_PROXY`           | When set to the string `"true"`, HTTP requests use the same-origin `/api/v1` path |
| `VITE_REQUIRE_CREDENTIALS` | When set to the string `"true"`, enables Axios `withCredentials`                  |

### Request Modes

- `VITE_USE_PROXY=true`: the browser requests same-origin `/api/v1`. In development, Vite forwards these requests. In production, Nginx, an API gateway, or another web server must provide the equivalent reverse proxy.
- `VITE_USE_PROXY=false`: Axios uses `VITE_API_BASE_URL` directly.
- The Vite development proxy covers the AI summary SSE endpoint, general `/api/v1` requests, and the `/file` file service.
- WebSocket connections use `VITE_WS_URL` as their base and connect to notification and presence endpoints.

All `VITE_*` variables are exposed to browser code. Never put passwords, private keys, server secrets, or other sensitive values in them. Local overrides can be placed in Git-ignored `.env.local` or `.env.*.local` files.

## Common Commands

| Command           | Description                                        |
| ----------------- | -------------------------------------------------- |
| `npm run dev`     | Start the Vite development server                  |
| `npm run build`   | Run `tsc --noEmit` and build the production bundle |
| `npm run preview` | Locally preview the built `dist/` output           |
| `npm run format`  | Format supported files under `src/` with Prettier  |

The repository currently has no automated unit-test, end-to-end-test, or ESLint scripts. `src/sample/` contains browser-based manual verification pages rather than automated tests.

## Project Structure

```text
TechHaven/
├─ .github/workflows/        # CI build checks and tag-based releases
├─ docs/                     # Data models and API contracts for selected pages
├─ public/                   # Logo, favicon, and theme cursor assets
├─ src/
│  ├─ components/            # Shared UI, layout, and cross-page business components
│  ├─ contexts/              # Auth, theme, layout, site settings, and RD organization contexts
│  ├─ hooks/                 # AI summary, presence, idle timeout, and other hooks
│  ├─ pages/                 # Blog, organization, personal, development, and admin pages
│  ├─ router/                # Centralized route configuration
│  ├─ sample/                # Manual component verification pages
│  ├─ services/              # Domain-oriented API services
│  ├─ types/                 # Shared domain types
│  ├─ utils/                 # HTTP, WebSocket, Cookie, error-code, and ID utilities
│  ├─ App.tsx                # Providers, application shell, and runtime capabilities
│  └─ main.tsx               # React application entry point
├─ CHANGELOG.md              # Release changelog
├─ AGENTS.md                 # Repository development conventions
├─ package.json
└─ vite.config.ts
```

## Route Overview

Routes are centralized in `src/router/RouterConfig.tsx`.

| Path                       | Function                                   | Access                                                        |
| -------------------------- | ------------------------------------------ | ------------------------------------------------------------- |
| `/index`                   | Article feed                               | Public page                                                   |
| `/auth`                    | Login, registration, and password recovery | Not affected by maintenance mode                              |
| `/article/*`               | Article creation, editing, and details     | Some actions require authentication                           |
| `/personal`                | Personal center                            | Features are selected with the `tab` query parameter          |
| `/profile/:id`             | User profile                               | Authentication required                                       |
| `/organizations/list`      | Organization list                          | Login checked by the page                                     |
| `/organization/detail/:id` | Organization details                       | Login checked by the page                                     |
| `/assignment/*`            | Assignment submission and details          | Login checked by the page                                     |
| `/rd/*`                    | Development workspace                      | Authentication and organization access required               |
| `/admin/*`                 | Administration console                     | Administrator role required; not affected by maintenance mode |
| `/help`                    | Help center                                | Public page                                                   |

All routes except `/auth` and `/admin/*` are protected by `MaintenanceGuard`. `/assignments` redirects to `/personal?tab=assignments`.

Development builds also mount demonstration or verification pages such as `/messages`, `/test/*`, and `/admin/media`.

## Architecture Conventions

### Providers

The primary global provider order is:

```text
BrowserRouter
└─ ThemeProvider
   └─ AuthProvider
      └─ LayoutWidthProvider
         └─ SiteSettingsProvider
            └─ MessageProvider
               └─ ConfirmProvider
```

The `/rd` layout additionally mounts `RdOrgProvider` for the current organization and organization role.

### Authentication and Storage

- The application restores the token from the `S_TOKEN` Cookie at startup.
- During runtime, the token is managed by `AuthContext` and the in-memory `TokenManager`.
- The Axios request interceptor adds the Bearer token automatically.
- Sensitive state such as tokens, user data, roles, and permissions must not be written to `localStorage` or `sessionStorage`.
- Non-sensitive data such as themes, layout preferences, public configuration caches, and content drafts may be persisted when appropriate.
- Frontend permission checks only control the UI; the backend must enforce actual permissions.

### HTTP and Real-Time Communication

- Regular business APIs are organized by domain under `src/services/` and reuse the shared Axios instance from `src/utils/http.ts`.
- The HTTP layer handles business `errno` values, dynamic error-code tables, HTTP errors, and authentication expiration.
- AI summaries use the native Fetch API to consume an SSE stream.
- Notifications and presence use separate WebSocket connections, connect after login, disconnect after logout, and support automatic reconnects.

### UI Development

- Check and reuse existing components in `src/components/` before building a new interface.
- Use CSS Modules for local styles. Global theme variables are defined in `src/index.css` and `src/App.css`.
- `data-theme` controls light/dark mode, `data-skin` controls theme skins, and `data-width-mode` controls layout width.
- Create a verification page in `src/sample/` for new components and expose it through a development-only route while validating it in the browser.
- Run `npm run build` and `npm run format` after completing changes.

See [AGENTS.md](AGENTS.md) and the [component reuse guide](.agents/skills/use-existing-components/SKILL.md) for detailed conventions.

## Feature Status

The following pages or capabilities are currently demonstrations, partially integrated, or intentionally limited:

- The messaging page is development-only and uses frontend mock conversation data.
- Some bookmark and account-security capabilities are frontend demonstrations.
- The homepage subscription component is not connected to a production subscription service and is shown only in development.
- The admin media library is mounted only in development builds.
- The GitHub Pull Request module focuses on synchronization, search, and review-status display; it does not provide a complete code-diff review, approval, or merge workflow.
- `docs/` currently contains data models and API contracts for selected pages, not a complete reference for every business domain.

## CI and Releases

### Build Checks

Pushes to `master` and pull requests targeting `master` trigger GitHub Actions to:

1. Install dependencies with Node.js 20.
2. Run `npm run build`.
3. Verify that `dist/` exists and is not empty.

### Version Releases

Pushing a Git tag matching `v*` triggers the release workflow:

1. Build the production bundle.
2. Upload `dist/` to a versioned directory on the server.
3. Switch the active version through a symbolic link.
4. Keep the five most recent tag versions.
5. Extract the matching section from `CHANGELOG.md` and create a GitHub Release.

Before publishing, add a version heading that exactly matches the tag:

```markdown
## [v1.0.1] - 2026-08-31
```

The `vX.Y.Z` Git tag is the release trigger. Production infrastructure must also provide SPA fallback for React Router, HTTP API and file-service reverse proxies, SSE support, and WebSocket upgrades.

## Documentation

- [Changelog](CHANGELOG.md)
- [Development and repository conventions](AGENTS.md)
- [Custom component reuse guide](.agents/skills/use-existing-components/SKILL.md)
- [Selected page API and data contracts](docs/README.md)

## License

This project is licensed under the [GNU Affero General Public License v3.0](LICENSE).

AGPL-3.0 permits use, modification, distribution, and commercial use. When distributing a modified version or providing a modified version to users over a network, you must provide the corresponding source code to those users as required by the license and preserve the applicable copyright and license notices.

If you want to use this project in a closed-source commercial product that cannot comply with AGPL-3.0, obtain a separate commercial license from the copyright holders.
