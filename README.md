# SnippetsHub - 专业代码片段管理工具

SnippetsHub 是一款基于 **Tauri** 和 **Vue 3** 构建的现代化跨平台桌面应用，专为开发者打造。它不仅是一个高效的代码片段管理器，更是一个集成了任务管理、知识库写作和生产力统计的个人开发工作台。

借助 Rust 的高性能后端，SnippetsHub 能够在 macOS 和 Windows 上提供极致流畅的体验。

## ✨ 核心特性

- ⚡ **轻量极速**：基于 Tauri (Rust) 构建，启动快，资源占用极低。
- 📝 **专业编辑**：集成 Monaco Editor，支持 100+ 种语言语法高亮与智能提示。
- 📚 **知识管理**：支持 Markdown 分屏实时预览，可一键导出 PDF、Word 或 HTML。
- 📅 **任务协同**：内置 **看板 (Kanban)** 与 **日历视图**，轻松规划开发进度与待办事项。
- 🔍 **智能检索**：全局快捷键唤起命令面板，毫秒级搜索代码与笔记。
- 📊 **效率洞察**：可视化生产力仪表盘，自动生成代码热力图与工作习惯分析。
- 🎨 **高度定制**：支持明暗多主题切换，完全自定义的快捷键与界面布局。

## 🛠️ 技术栈

- **前端**: Vue 3, Vite, Pinia
- **后端**: Tauri (Rust)
- **数据库**: SQLite/SQLx
- **UI 组件**: Lucide Icons, Custom CSS Variables

## 🚀 快速开始

1. 克隆仓库
   ```bash
   git clone https://github.com/Wangjien/snippetsHub.git
   cd snippetsHub
   ```

2. 安装依赖
   ```bash
   npm install
   ```

3. 启动开发服务器
   ```bash
   npm run tauri dev
   ```

## 📦 打包发布

```bash
npm run tauri build
```

---
Copyright © 2026 Noah. All rights reserved.

