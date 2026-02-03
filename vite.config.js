/**
 * SnippetsHub - 专业代码片段管理工具
 * 
 * @file vite.config.js - Vite构建配置
 * @author Noah
 * @description Vite构建工具的配置文件，针对Tauri应用进行了优化
 * @created 2026-01-28
 * @modified 2026-01-29
 * @version 1.0.0
 * 
 * 配置特性:
 * - Tauri开发环境优化
 * - 代码分割和懒加载
 * - 生产环境性能优化
 * - HMR热更新配置
 * - 依赖预构建优化
 * - 资源压缩和混淆
 * 
 * 性能优化:
 * - 手动代码分割减少初始加载时间
 * - Monaco编辑器按需加载
 * - 生产环境移除调试代码
 * - CSS代码分割
 * - Terser压缩优化
 */

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// 获取Tauri开发环境的主机地址
const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(async () => ({
  // Vue插件配置
  plugins: [vue()],

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },

  // 性能优化配置
  build: {
    // 启用代码分割
    rollupOptions: {
      output: {
        // 手动分割代码块
        manualChunks: {
          // Vue核心库
          'vue-vendor': ['vue', 'pinia'],
          // Monaco编辑器 (大型库)
          'monaco': ['monaco-editor', '@monaco-editor/loader', 'monaco-vim'],
          // Markdown相关
          'markdown': ['marked', 'highlight.js'],
          // UI组件库
          'ui-vendor': ['lucide-vue-next', 'vue-toastification'],
          // 工具库
          'utils': ['lodash-es', 'dayjs', '@vueuse/core'],
          // Tauri相关
          'tauri': [
            '@tauri-apps/api',
            '@tauri-apps/plugin-clipboard-manager',
            '@tauri-apps/plugin-fs',
            '@tauri-apps/plugin-global-shortcut',
            '@tauri-apps/plugin-opener',
            '@tauri-apps/plugin-shell'
          ]
        }
      }
    },
    // 启用压缩
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // 生产环境移除console
        drop_debugger: true
      }
    },
    // 设置chunk大小警告限制
    chunkSizeWarningLimit: 1000,
    // 启用CSS代码分割
    cssCodeSplit: true
  },

  // 优化依赖预构建
  optimizeDeps: {
    include: [
      'vue',
      'pinia',
      'lucide-vue-next',
      'dayjs',
      '@vueuse/core',
      'lodash-es'
    ],
    exclude: [
      'monaco-editor', // Monaco编辑器按需加载
      '@tauri-apps/api'
    ]
  },

  // 启用esbuild优化
  esbuild: {
    // 移除生产环境的console和debugger
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : []
  }
}));
