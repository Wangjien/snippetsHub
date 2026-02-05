/**
 * SnippetsHub - 代码片段管理工具
 * 
 * @file App.vue - 应用程序主组件
 * @author Noah
 * @description 应用程序的根组件，负责整体布局、路由管理和全局状态协调
 * @created 2026-01-08
 * @modified 2026-01-29
 * @version 1.0.0
 * 
 * 功能特性:
 * - 侧边栏导航和视图切换
 * - 代码片段管理界面
 * - TODO列表和Markdown编辑器
 * - 设置和关于页面
 * - 全局快捷键支持
 * - 主题系统集成
 * - 性能监控和通知系统
 */

<template>
  <div class="app">
    <Sidebar
      :current-view="appStore.currentView"
      @navigate="handleNavigate"
      @quick-action="handleQuickAction"
    />

    <div class="main-content">
      <!-- Tabs (Only in Code view) -->
      <EditorTabs v-if="appStore.currentView === 'code'" />

      <!-- 代码管理视图 (Home List) -->
      <SnippetList
        v-if="appStore.currentView === 'code' && !editorStore.activeTabId"
        :snippets="displaySnippets"
        :languages="snippetStore.allLanguages"
        @create="showEditor(null)"
        @select="viewSnippet"
        @edit="showEditor"
        @delete="deleteSnippet"
        @favorite="toggleFavorite"
      />

      <!-- TODO 视图 -->
      <TodoListModern v-if="appStore.currentView === 'todo'" />

      <!-- 收藏视图 -->
      <FavoritesView 
        v-if="appStore.currentView === 'favorites'"
        :snippets="snippetStore.snippets"
        :languages="snippetStore.allLanguages"
        @create="showEditor(null)"
        @select="viewSnippet"
        @edit="showEditor"
        @delete="deleteSnippet"
        @favorite="toggleFavorite"
        @navigate="handleNavigate"
      />

      <!-- Markdown 视图 -->
      <MarkdownEditor 
        v-if="appStore.currentView === 'markdown'" 
        @back="appStore.setCurrentView('code')"
      />

      <!-- 设置和关于视图 -->
      <SettingsPanel v-if="appStore.currentView === 'settings' || appStore.currentView === 'about'" />

      <!-- 代码编辑器 (Tab Content) -->
      <CodeEditor
        v-if="appStore.currentView === 'code' && editorStore.activeTabId"
        :vim-mode="appStore.settings.vimMode"
        @save="saveSnippet"
        @close="closeEditor"
      />
    </div>

    <!-- 命令面板 -->
    <CommandPalette
      :is-open="commandPaletteOpen"
      @close="commandPaletteOpen = false"

      @open-snippet="handleSnippetSelect"
      @create-snippet="showModeSelection = true"
      :snippets="snippetStore.snippets"
    />

    <!-- 模式选择弹窗 -->
    <ModeSelectionModal
      v-if="showModeSelection"
      @cancel="showModeSelection = false"
      @select="handleModeSelect"
    />

    <!-- 通知系统 -->
    <NotificationSystem />

    <!-- 确认对话框 -->
    <ConfirmDialog
      v-if="confirmState.isVisible"
      :title="confirmState.title"
      :message="confirmState.message"
      :confirmText="confirmState.confirmText"
      :isLoading="confirmState.isLoading"
      @confirm="handleConfirm"
      @cancel="handleCancel"
    />

    <!-- 更新管理器 -->
    <UpdateManager />

    <!-- 加载状态 -->
    <LoadingSpinner v-if="appStore.isLoading" overlay />
  </div>
</template>

<script setup>
/**
 * @file App.vue
 * @description 应用主入口组件 (性能优化版)
 * @author Noah
 * 
 * 性能优化:
 * - 组件懒加载
 * - 延迟初始化非关键服务
 * - 优化启动流程
 */
import { ref, computed, onMounted, onUnmounted, defineAsyncComponent } from 'vue'
import { Package, Palette, Monitor, Sun, Moon, Eye, Contrast } from 'lucide-vue-next'
import { useSnippetStore } from './stores/snippetStore'
import { useAppStore } from './stores/appStore'
import { useThemeStore } from './stores/themeStore'
import { useCloudStore } from './stores/cloudStore'
import { useEditorStore } from './stores/editorStore'
import { APP_VERSION, SHORTCUTS, THEMES } from './constants'
import { useKeyboardShortcuts } from './composables/useKeyboardShortcuts'
import { useGlobalShortcuts } from './composables/useGlobalShortcuts'
import { useNotifications } from './composables/useNotifications'
import { useConfirm } from './composables/useConfirm'
import { performanceMonitor } from './utils/performanceOptimized'


// 立即加载的核心组件
import Sidebar from './components/Sidebar.vue'
import LoadingSpinner from './components/LoadingSpinner.vue'

// 懒加载的组件
const SnippetList = defineAsyncComponent(() => import('./components/SnippetList.vue'))
const CodeEditor = defineAsyncComponent(() => import('./components/CodeEditor.vue'))
const EditorTabs = defineAsyncComponent(() => import('./components/EditorTabs.vue'))
const CommandPalette = defineAsyncComponent(() => import('./components/CommandPalette.vue'))
const TodoListModern = defineAsyncComponent(() => import('./components/TodoListModern.vue'))
const FavoritesView = defineAsyncComponent(() => import('./components/FavoritesView.vue'))
const MarkdownEditor = defineAsyncComponent(() => import('./components/MarkdownEditor.vue'))
const SettingsPanel = defineAsyncComponent(() => import('./components/SettingsPanel.vue'))
const NotificationSystem = defineAsyncComponent(() => import('./components/NotificationSystem.vue'))
const ConfirmDialog = defineAsyncComponent(() => import('./components/ConfirmDialog.vue'))
const ModeSelectionModal = defineAsyncComponent(() => import('./components/ModeSelectionModal.vue'))
const UpdateManager = defineAsyncComponent(() => import('./components/UpdateManager.vue'))

const snippetStore = useSnippetStore()
const appStore = useAppStore()
const themeStore = useThemeStore()
const cloudStore = useCloudStore()
const editorStore = useEditorStore()
const { success, error, info } = useNotifications()
const { confirmState, handleConfirm, handleCancel } = useConfirm()

// Auto Sync Timers
const syncTimers = {}

// 初始化高级功能
const { register: registerShortcut, setContext } = useKeyboardShortcuts()
useGlobalShortcuts()

const showEditorView = ref(false)
const showModeSelection = ref(false)
const editingSnippet = ref(null)
const commandPaletteOpen = ref(false)
const selectedFolderId = ref(null)

// 编辑器设置
const editorFontSize = ref(14)
const showMinimap = ref(true)
const wordWrap = ref(true)

// 性能监控
const appStartTime = performance.now()

// 主题统计信息
const themeStats = computed(() => themeStore.getThemeStats())

const displaySnippets = computed(() => {
  // Check if searching
  if (snippetStore.isSearching) {
      return snippetStore.searchResults
  }
  
  if (selectedFolderId.value) {
    return snippetStore.snippets.filter(s => s.folder_id === selectedFolderId.value)
  }
  return snippetStore.snippets
})

// 获取快捷键显示
const getShortcutKey = () => {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0
  return isMac ? '⌘⇧T' : 'Ctrl+Shift+T'
}

// 获取当前主题图标
const getCurrentThemeIcon = () => {
  if (themeStore.followSystemTheme) {
    return Monitor
  }
  
  switch (themeStore.appliedTheme) {
    case THEMES.LIGHT:
      return Sun
    case THEMES.DARK:
      return Moon
    case THEMES.HIGH_CONTRAST:
      return Contrast
    case THEMES.SEPIA:
      return Eye
    default:
      return Palette
  }
}

// 获取当前主题标签
const getCurrentThemeLabel = () => {
  if (themeStore.followSystemTheme) {
    return '跟随系统'
  }
  
  const labels = {
    [THEMES.LIGHT]: '明色主题',
    [THEMES.DARK]: '暗色主题',
    [THEMES.HIGH_CONTRAST]: '高对比度',
    [THEMES.SEPIA]: '护眼模式'
  }
  
  return labels[themeStore.appliedTheme] || '未知主题'
}

onMounted(() => { // No async to prevent blocking mount
  const initStartTime = performance.now()
  
  try {
    // 第一阶段：核心初始化 (立即执行)
    appStore.initialize()
    themeStore.initializeTheme()
    
    // 第二阶段：数据加载 (非阻塞，并行执行)
    // 不使用 await，让 UI 立即渲染，数据加载后自动更新
    Promise.all([
      snippetStore.loadSnippets(),
      snippetStore.loadFolders()
    ]).then(async () => {
      // 数据加载完成
    }).catch(err => {
      console.error('Data loading failed:', err)
      error('数据加载失败: ' + err.message)
    })
    
    // 第三阶段：注册快捷键 (立即需要)
    registerGlobalShortcuts()
    
    // 第四阶段：延迟初始化高级服务 (后台执行)
    const initServices = () => {
       initializeAdvancedServices()
    }

    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(initServices, { timeout: 3000 })
    } else {
      setTimeout(initServices, 200)
    }
    
    // 设置全局通知显示函数
    window.showNotification = (message, type = 'info') => {
      switch (type) {
        case 'success': return success(message)
        case 'error': return error(message)
        case 'info': return info(message)
        default: return info(message)
      }
    }

    // 记录应用启动性能
    // 注意：这里记录的是挂载时间，数据加载可能还在进行中
    const initTime = performance.now() - initStartTime
    const totalStartTime = performance.now() - appStartTime
    
    performanceMonitor.recordMetric('app', 'startup-time', { 
      duration: totalStartTime,
      initTime 
    })
    
    console.log(`SnippetsHub UI mounted in ${Math.round(totalStartTime)}ms`)
    
  } catch (err) {
    error('应用初始化失败: ' + err.message)
    console.error('App initialization error:', err)
  }

  // Auto Sync Listener (延迟初始化)
  setTimeout(() => {
    initializeAutoSync()
  }, 2000)
})

// 延迟初始化高级服务
const initializeAdvancedServices = async () => {
  console.log('Initializing advanced services...')
  
  // 动态导入服务模块
  const [
    { lspService },
    { codeExecutionService },
    { projectService },
    { gitService },
    { pluginService }
  ] = await Promise.all([
    import('./services/lspService'),
    import('./services/codeExecutionService'),
    import('./services/projectService'),
    import('./services/gitService'),
    import('./services/pluginService')
  ])
  
  // 并行初始化服务 (非阻塞)
  const servicePromises = [
    initializeLSPService(lspService),
    initializeCodeExecutionService(codeExecutionService),
    initializeProjectService(projectService),
    initializeGitService(gitService),
    initializePluginService(pluginService)
  ]
  
  // 等待所有服务初始化完成，但不阻塞主线程
  Promise.allSettled(servicePromises).then(results => {
    const successful = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length
    
    if (successful > 0) {
      info(`高级功能已启用 (${successful}/${results.length} 个服务)`)
    }
    if (failed > 0) {
      console.warn(`${failed} 个服务初始化失败`)
    }
  })
}

// 各个服务的初始化函数
const initializeLSPService = async (lspService) => {
  try {
    await lspService.initialize()
    console.log('LSP service initialized')
    
    const supportedLanguages = lspService.getSupportedLanguages()
    const availableServers = Array.from(lspService.servers.keys())
    if (availableServers.length > 0) {
      info(`智能补全已启用 (${availableServers.length}/${supportedLanguages.length} 种语言)`)
    }
  } catch (err) {
    console.warn('LSP service initialization failed:', err)
  }
}

const initializeCodeExecutionService = async (codeExecutionService) => {
  try {
    await codeExecutionService.initialize()
    console.log('Code execution service initialized')
    
    const availableRuntimes = codeExecutionService.getAvailableRuntimes()
    if (availableRuntimes.length > 0) {
      info(`代码执行支持已启用 (${availableRuntimes.length} 种语言)`)
    }
  } catch (err) {
    console.warn('Code execution service initialization failed:', err)
  }
}

const initializeProjectService = async (projectService) => {
  try {
    await projectService.initialize()
    console.log('Project service initialized')
  } catch (err) {
    console.warn('Project service initialization failed:', err)
  }
}

const initializeGitService = async (gitService) => {
  try {
    await gitService.initialize()
    console.log('Git service initialized')
  } catch (err) {
    console.warn('Git service initialization failed:', err)
  }
}

const initializePluginService = async (pluginService) => {
  try {
    // 设置插件API方法
    pluginService.setAPIMethod('showNotification', (message, type) => {
      switch (type) {
        case 'success': return success(message)
        case 'error': return error(message)
        case 'info': return info(message)
        default: return info(message)
      }
    })
    
    pluginService.setAPIMethod('getSnippets', () => snippetStore.snippets)
    pluginService.setAPIMethod('createSnippet', (data) => snippetStore.createSnippet(data))
    pluginService.setAPIMethod('updateSnippet', (data) => snippetStore.updateSnippet(data))
    pluginService.setAPIMethod('deleteSnippet', (id) => snippetStore.deleteSnippet(id))
    
    await pluginService.initialize()
    console.log('Plugin system initialized')
  } catch (err) {
    console.warn('Plugin system initialization failed:', err)
  }
}

// 初始化自动同步
const initializeAutoSync = () => {
  cloudStore.init()
  snippetStore.$onAction(({ name, args, after }) => {
    if (name === 'updateSnippet') {
      after(() => {
        const snippetData = args[0]
        const snippetId = snippetData.id
        if (!snippetId) return
        
        // Clear existing timer
        if (syncTimers[snippetId]) clearTimeout(syncTimers[snippetId])
        
        // Debounce 5s
        syncTimers[snippetId] = setTimeout(async () => {
           const snippet = snippetStore.snippets.find(s => s.id === snippetId)
           if (!snippet) return
           
           const platforms = ['github', 'gitee', 'gitlab']
           for (const p of platforms) {
               if (cloudStore.autoSyncSettings[p] && cloudStore.isSyncedToPlatform(snippetId, p)) {
                   try {
                       await cloudStore.syncSnippet(snippet, p)
                       success(`自动同步：已更新到 ${p === 'github' ? 'GitHub' : (p === 'gitee' ? 'Gitee' : 'GitLab')}`)
                   } catch (e) {
                        console.error(`Auto sync failed for ${p}:`, e)
                   }
               }
           }
           delete syncTimers[snippetId]
        }, 5000)
      })
    }
  })
}

onUnmounted(() => {
  // 清理资源
  performanceMonitor.cleanup()
})

// 注册全局快捷键
const registerGlobalShortcuts = () => {
  // 命令面板
  registerShortcut('Alt+Space', () => {
    commandPaletteOpen.value = !commandPaletteOpen.value
  }, { description: '打开/关闭命令面板' })
  
  registerShortcut('Cmd+Shift+P', () => {
    commandPaletteOpen.value = !commandPaletteOpen.value
  }, { description: '打开命令面板' })

  // 新建代码片段
  registerShortcut('Cmd+N', () => {
    showModeSelection.value = true
  }, { description: '新建代码片段' })

  // 主题切换
  registerShortcut('Cmd+Shift+T', () => {
    themeStore.quickToggleTheme(true)
  }, { description: '快速切换主题' })

  // 搜索聚焦
  registerShortcut('Cmd+K', () => {
    const searchInput = document.querySelector('.search-input')
    if (searchInput) {
      searchInput.focus()
    }
  }, { description: '聚焦搜索框' })

  // 设置页面
  registerShortcut('Cmd+,', () => {
    handleNavigate('settings')
  }, { description: '打开设置' })

  // 关闭模态框
  registerShortcut('Escape', () => {
    if (commandPaletteOpen.value) {
      commandPaletteOpen.value = false
    } else if (showEditorView.value) {
      closeEditor()
    }
  }, { description: '关闭当前模态框' })

  // 视图切换
  registerShortcut('Cmd+1', () => handleNavigate('code'), { description: '代码管理' })
  registerShortcut('Cmd+2', () => handleNavigate('todo'), { description: 'TODO 列表' })
  registerShortcut('Cmd+3', () => handleNavigate('favorites'), { description: '我的收藏' })
  registerShortcut('Cmd+4', () => handleNavigate('markdown'), { description: 'Markdown 编辑器' })
  registerShortcut('Cmd+5', () => handleNavigate('settings'), { description: '设置' })
  registerShortcut('Cmd+6', () => handleNavigate('about'), { description: '关于' })
}

const handleNavigate = (view) => {
  appStore.setCurrentView(view)
  showEditorView.value = false
  selectedFolderId.value = null
  
  // 设置键盘快捷键上下文
  setContext(view === 'code' ? 'list' : 'global')
  
  // 记录导航
  performanceMonitor.recordInteraction('navigate', { view })
}

const handleQuickAction = (action) => {
  switch (action) {
    case 'new-snippet':
      showModeSelection.value = true
      break
    case 'command-palette':
      commandPaletteOpen.value = true
      break
    default:
      console.warn('Unknown quick action:', action)
  }
}

const selectFolder = (folderId) => {
  selectedFolderId.value = folderId
  appStore.setCurrentView('code')
}

const showEditor = (snippet) => {
  editorStore.openSnippet(snippet)
  showEditorView.value = true
  
  // 设置编辑器上下文
  setContext('editor')
  
  // 记录编辑器打开
  performanceMonitor.recordInteraction('open-editor', {
    isNew: !snippet,
    snippetId: snippet?.id
  })
}

const closeEditor = () => {
  showEditorView.value = false
  editingSnippet.value = null
}

const saveSnippet = async (snippetData) => {
  const saveStartTime = performance.now()
  
  try {
    appStore.setLoading(true)
    
    let savedSnippet;
    if (snippetData.id) {
      savedSnippet = await snippetStore.updateSnippet(snippetData)
      success('代码片段已更新')
    } else {
      savedSnippet = await snippetStore.createSnippet(snippetData)
      success('代码片段已创建')
    }
    
    // Update tab state
    if (snippetData.tabId && savedSnippet) {
        editorStore.saveTab(snippetData.tabId, savedSnippet)
    }
    
    // 记录保存性能
    const saveTime = performance.now() - saveStartTime
    performanceMonitor.recordMetric('editor', 'save-time', { 
      duration: saveTime,
      isUpdate: !!snippetData.id
    })
    
  } catch (err) {
    error('保存失败: ' + err.message)
    performanceMonitor.recordInteraction('save-error', {
      error: err.message
    })
  } finally {
    appStore.setLoading(false)
  }
}

const viewSnippet = (snippet) => {
  showEditor(snippet)
}

const deleteSnippet = async (id) => {
  try {
    appStore.setLoading(true)
    await snippetStore.deleteSnippet(id)
    success('代码片段已删除')
    
    performanceMonitor.recordInteraction('delete-snippet', { snippetId: id })
  } catch (err) {
    error('删除失败: ' + err.message)
  } finally {
    appStore.setLoading(false)
  }
}

const toggleFavorite = async (snippetId, isFavorite) => {
  try {
    appStore.setLoading(true)
    
    // Update the snippet with the new favorite status
    // Note: The database uses 'is_favorite' but we need to map from 'isFavorite'
    const updatedSnippet = await snippetStore.updateSnippet({
      id: snippetId,
      is_favorite: isFavorite
    })
    
    const action = isFavorite ? '已收藏' : '已取消收藏'
    success(`代码片段${action}`)
    
    performanceMonitor.recordInteraction('toggle-favorite', {
      snippetId,
      isFavorite
    })
  } catch (err) {
    console.error('Toggle favorite error:', err)
    error('收藏操作失败: ' + err.message)
  } finally {
    appStore.setLoading(false)
  }
}

const showCreateFolder = () => {
  const name = prompt('输入文件夹名称:')
  if (name) {
    snippetStore.createFolder(name)
  }
}

const handleSnippetSelect = (snippet) => {
  if (snippet.id) {
    showEditor(snippet)
  }
}

const handleModeSelect = (mode) => {
  showModeSelection.value = false
  
  if (mode === 'code') {
    if (appStore.currentView !== 'code') {
       appStore.setCurrentView('code')
    }
    // Small delay to ensure view transition
    setTimeout(() => showEditor(null), 50)
  } else if (mode === 'markdown') {
    appStore.setCurrentView('markdown')
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  /* 默认主题变量 - 将被 JavaScript 动态覆盖 */
  --color-background: #1e1e2e;
  --color-background-secondary: #181825;
  --color-background-tertiary: #11111b;
  --color-text-primary: #cdd6f4;
  --color-text-secondary: #a6adc8;
  --color-text-tertiary: #7f849c;
  --color-border: #313244;
  --color-border-secondary: #45475a;
  --color-primary: #89b4fa;
  --color-primary-hover: #74c7ec;
  --color-success: #a6e3a1;
  --color-warning: #f9e2af;
  --color-error: #f38ba8;
  --color-shadow: rgba(0, 0, 0, 0.3);
  --color-overlay: rgba(0, 0, 0, 0.7);
  --color-editor-background: #1e1e2e;
  --color-editor-foreground: #cdd6f4;
  --color-editor-selection: #89b4fa20;
  --color-editor-line-highlight: #313244;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  overflow: hidden;
  background: var(--color-background);
  color: var(--color-text-primary);
  transition: background-color 0.3s ease, color 0.3s ease;
}

.app {
  display: flex;
  height: 100vh;
  background: var(--color-background);
  color: var(--color-text-primary);
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative; /* Ensure absolute children (CodeEditor) are positioned correctly */
}

/* 设置页面样式 */
.settings-view {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.settings-header {
  margin-bottom: 32px;
}

.settings-header h2 {
  font-size: 24px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 8px;
}

.settings-content {
  max-width: 800px;
}

.setting-group {
  margin-bottom: 40px;
}

.setting-group h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 20px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-border);
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid var(--color-border);
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-info {
  flex: 1;
  margin-right: 16px;
}

.setting-info label {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
  display: block;
  margin-bottom: 4px;
}

.setting-description {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.4;
}

.setting-select {
  background: var(--color-background-secondary);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 8px 12px;
  color: var(--color-text-primary);
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s ease;
  min-width: 120px;
}

.setting-select:focus {
  border-color: var(--color-primary);
}

/* 切换开关样式 */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 24px;
  cursor: pointer;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--color-border-secondary);
  border-radius: 24px;
  transition: all 0.2s ease;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background: white;
  border-radius: 50%;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.toggle-switch input:checked + .toggle-slider {
  background: var(--color-primary);
}

.toggle-switch input:checked + .toggle-slider:before {
  transform: translateX(24px);
}

/* 主题统计卡片 */
.theme-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: var(--color-background-secondary);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  transition: all 0.2s ease;
}

.stat-card:hover {
  border-color: var(--color-border-secondary);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px var(--color-shadow);
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: var(--color-primary);
  color: white;
  border-radius: 12px;
  flex-shrink: 0;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 4px;
}

.stat-label {
  font-size: 13px;
  color: var(--color-text-secondary);
}

/* 关于页面样式 */
.about-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  text-align: center;
}

.about-header {
  margin-bottom: 32px;
}

.about-icon {
  color: var(--color-primary);
  margin-bottom: 16px;
}

.about-header h2 {
  font-size: 32px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 8px;
}

.version {
  font-size: 16px;
  color: var(--color-text-secondary);
  font-weight: 500;
}

.about-content {
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.about-content p {
  margin-bottom: 8px;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--color-background-secondary);
}

::-webkit-scrollbar-thumb {
  background: var(--color-border-secondary);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-tertiary);
}

/* 主题过渡动画 */
* {
  transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease;
}

/* 明色主题特定样式 */
.theme-light {
  color-scheme: light;
}

/* 暗色主题特定样式 */
.theme-dark {
  color-scheme: dark;
}

/* 高对比度模式支持 */
@media (prefers-contrast: high) {
  :root {
    --color-border: currentColor;
    --color-border-secondary: currentColor;
  }
}

/* 减少动画模式支持 */
@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
    animation: none !important;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .settings-view,
  .about-view {
    padding: 16px;
  }
  
  .setting-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>
