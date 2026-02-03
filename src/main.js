/**
 * SnippetsHub - 代码片段管理工具
 * 
 * @file main.js - 应用程序入口文件 (性能优化版)
 * @author Noah
 * @description Vue 3应用程序的启动入口，负责应用初始化和全局配置
 * @created 2026-01-06
 * @modified 2026-01-31
 * @version 1.1.0
 * 
 * 性能优化:
 * - 懒加载非关键依赖
 * - 延迟初始化重型组件
 * - 优化启动时间
 */

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import 'devicon/devicon.min.css'

// 记录启动时间
const startTime = performance.now()

// 创建应用实例
const app = createApp(App)
const pinia = createPinia()

// 全局错误处理
app.config.errorHandler = (error, instance, info) => {
  console.error('Global error:', error)
  // 可以在这里添加错误上报逻辑
}

// 性能监控
app.config.performance = true

// 立即挂载核心依赖
app.use(pinia)

// 懒加载Toast通知系统
const initializeToast = async () => {
  try {
    const [{ default: Toast }, toastCSS] = await Promise.all([
      import("vue-toastification"),
      import("vue-toastification/dist/index.css")
    ])

    app.use(Toast, {
      position: "bottom-right",
      timeout: 3000,
      closeOnClick: true,
      pauseOnFocusLoss: true,
      pauseOnHover: true,
      draggable: true,
      draggablePercent: 0.6,
      showCloseButtonOnHover: false,
      hideProgressBar: false,
      closeButton: "button",
      icon: true,
      rtl: false
    })
  } catch (error) {
    console.warn('Failed to load toast system:', error)
  }
}

// 挂载应用
app.mount('#app')

// 记录启动性能
const mountTime = performance.now() - startTime
console.log(`App mounted in ${Math.round(mountTime)}ms`)

// 延迟初始化非关键功能
if (typeof requestIdleCallback !== 'undefined') {
  requestIdleCallback(() => {
    initializeToast()
  }, { timeout: 1000 })
} else {
  setTimeout(() => {
    initializeToast()
  }, 100)
}

// 预加载关键资源
const preloadCriticalResources = () => {
  // 预加载Monaco编辑器 (当用户可能需要时)
  const preloadMonaco = () => {
    import('monaco-editor').catch(() => {
      // 静默失败，不影响应用启动
    })
  }

  // 延迟预加载
  setTimeout(preloadMonaco, 2000)
}

// 在空闲时预加载
if (typeof requestIdleCallback !== 'undefined') {
  requestIdleCallback(preloadCriticalResources, { timeout: 3000 })
} else {
  setTimeout(preloadCriticalResources, 200)
}
