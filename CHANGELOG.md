# Changelog

本项目所有重要变更均记录于此。格式参考 [Keep a Changelog](https://keepachangelog.com/)，版本号遵循 [Semantic Versioning](https://semver.org/)。

发版时请新增一个 `## [vX.Y.Z] - YYYY-MM-DD` 段落，CI 会自动将其作为 GitHub Release 的说明。

## [v1.0.0] - 2026-08-28

首个正式版本，对应当前 master 节点。

### 新增
- 首页侧边栏「每日一言」组件，调用一言（Hitokoto）公开接口，按日缓存并支持手动刷新。
- 主题风格选择面板，支持时代周刊、极简黑白、护眼豆绿、海洋蓝、樱花粉、赛博朋克、暗金奢华、薰衣草紫等风格。

### 变更
- 默认主题风格由「默认」改为「时代周刊」（纸刊衬线风），移除「默认」选项。
- CI/CD 改为基于 git tag（`v*`）发布：仅 tag 推送触发部署并生成 GitHub Release；master 推送与 PR 仅做构建检查。

### 其他
- 首页「订阅更新」卡片改为仅开发环境可见（功能尚未实现）。
- 部署版本目录由时间戳改为 tag 名称，与 Release 一一对应，便于回滚溯源。
