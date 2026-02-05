/**
 * SnippetsHub - 专业代码片段管理工具
 * 
 * @file useKeyboardShortcuts.js - 键盘快捷键组合式函数
 * @author Noah
 * @description 全局键盘快捷键管理系统，支持上下文感知和动态注册
 * @created 2026-01-28
 * @modified 2026-01-29
 * @version 1.0.0
 * 
 * 功能特性:
 * - 全局快捷键注册
 * - 上下文感知切换
 * - 快捷键冲突检测
 * - 动态绑定和解绑
 * - 跨平台兼容性
 * - 快捷键提示系统
 * - 用户自定义支持
 * - 性能优化
 */

import { ref, onMounted, onUnmounted } from 'vue'
// import { performanceMonitor } from '../utils/performance' // 暂时注释掉不存在的导入

/**
 * 键盘快捷键组合式函数
 * 提供全局和局部快捷键管理功能
 */
export function useKeyboardShortcuts() {
  const shortcuts = ref(new Map())
  const activeModifiers = ref(new Set())
  const isEnabled = ref(true)
  const currentContext = ref('global')
  
  // 预定义的快捷键
  const defaultShortcuts = {
    // 全局快捷键
    'global': {
      'Alt+Space': { action: 'openCommandPalette', description: '打开命令面板' },
      'Cmd+N': { action: 'createSnippet', description: '新建代码片段' },
      'Cmd+S': { action: 'save', description: '保存' },
      'Cmd+Shift+T': { action: 'toggleTheme', description: '切换主题' },
      'Cmd+K': { action: 'focusSearch', description: '聚焦搜索' },
      'Cmd+,': { action: 'openSettings', description: '打开设置' },
      'Escape': { action: 'escape', description: '取消/关闭' },
      'F1': { action: 'showHelp', description: '显示帮助' },
      'Cmd+Shift+P': { action: 'openCommandPalette', description: '命令面板' },
      'Cmd+B': { action: 'toggleSidebar', description: '切换侧边栏' }
    },
    
    // 编辑器快捷键
    'editor': {
      'Cmd+Enter': { action: 'saveAndRun', description: '保存并运行' },
      'Cmd+D': { action: 'duplicate', description: '复制行' },
      'Cmd+Shift+K': { action: 'deleteLine', description: '删除行' },
      'Alt+Up': { action: 'moveLineUp', description: '向上移动行' },
      'Alt+Down': { action: 'moveLineDown', description: '向下移动行' },
      'Cmd+/': { action: 'toggleComment', description: '切换注释' },
      'Cmd+F': { action: 'find', description: '查找' },
      'Cmd+H': { action: 'replace', description: '替换' },
      'F2': { action: 'rename', description: '重命名' }
    },
    
    // 列表快捷键
    'list': {
      'ArrowUp': { action: 'selectPrevious', description: '选择上一项' },
      'ArrowDown': { action: 'selectNext', description: '选择下一项' },
      'Enter': { action: 'selectCurrent', description: '选择当前项' },
      'Space': { action: 'toggleSelection', description: '切换选择' },
      'Cmd+A': { action: 'selectAll', description: '全选' },
      'Delete': { action: 'deleteSelected', description: '删除选中项' },
      'Home': { action: 'selectFirst', description: '选择第一项' },
      'End': { action: 'selectLast', description: '选择最后一项' }
    },
    
    // 搜索快捷键
    'search': {
      'Tab': { action: 'switchMode', description: '切换搜索模式' },
      'Cmd+Enter': { action: 'searchInFiles', description: '在文件中搜索' },
      'Shift+Enter': { action: 'searchBackward', description: '向后搜索' },
      'Cmd+G': { action: 'findNext', description: '查找下一个' },
      'Cmd+Shift+G': { action: 'findPrevious', description: '查找上一个' }
    }
  }

  // 修饰键映射
  const modifierKeys = {
    'Meta': 'Cmd',
    'Control': 'Ctrl',
    'Alt': 'Alt',
    'Shift': 'Shift'
  }

  // 特殊键映射
  const specialKeys = {
    ' ': 'Space',
    'ArrowUp': 'Up',
    'ArrowDown': 'Down',
    'ArrowLeft': 'Left',
    'ArrowRight': 'Right',
    'Backspace': 'Backspace',
    'Delete': 'Delete',
    'Enter': 'Enter',
    'Tab': 'Tab',
    'Escape': 'Escape'
  }

  /**
   * 注册快捷键
   * @param {string} key - 快捷键组合
   * @param {Function} handler - 处理函数
   * @param {Object} options - 选项
   */
  function register(key, handler, options = {}) {
    const normalizedKey = normalizeKey(key)
    const context = options.context || currentContext.value
    
    if (!shortcuts.value.has(context)) {
      shortcuts.value.set(context, new Map())
    }
    
    shortcuts.value.get(context).set(normalizedKey, {
      handler,
      description: options.description || '',
      preventDefault: options.preventDefault !== false,
      stopPropagation: options.stopPropagation !== false,
      enabled: options.enabled !== false,
      priority: options.priority || 0
    })

    // 记录快捷键注册
    // performanceMonitor.recordInteraction('register-shortcut', {
    //   key: normalizedKey,
    //   context,
    //   description: options.description
    // })
  }

  /**
   * 注销快捷键
   * @param {string} key - 快捷键组合
   * @param {string} context - 上下文
   */
  function unregister(key, context = currentContext.value) {
    const normalizedKey = normalizeKey(key)
    const contextShortcuts = shortcuts.value.get(context)
    
    if (contextShortcuts) {
      contextShortcuts.delete(normalizedKey)
      
      if (contextShortcuts.size === 0) {
        shortcuts.value.delete(context)
      }
    }
  }

  /**
   * 批量注册快捷键
   * @param {Object} shortcutMap - 快捷键映射
   * @param {string} context - 上下文
   */
  function registerBatch(shortcutMap, context = currentContext.value) {
    Object.entries(shortcutMap).forEach(([key, config]) => {
      register(key, config.handler || config.action, {
        ...config,
        context
      })
    })
  }

  /**
   * 设置上下文
   * @param {string} context - 上下文名称
   */
  function setContext(context) {
    currentContext.value = context
  }

  /**
   * 启用/禁用快捷键
   * @param {boolean} enabled - 是否启用
   */
  function setEnabled(enabled) {
    isEnabled.value = enabled
  }

  /**
   * 处理键盘事件
   * @param {KeyboardEvent} event - 键盘事件
   */
  function handleKeyDown(event) {
    if (!isEnabled.value) return

    // 更新修饰键状态
    updateModifiers(event)

    // 构建快捷键字符串
    const shortcutKey = buildShortcutKey(event)
    
    // 查找匹配的快捷键
    const shortcut = findShortcut(shortcutKey)
    
    if (shortcut) {
      // 记录快捷键使用
      // performanceMonitor.recordInteraction('use-shortcut', {
      //   key: shortcutKey,
      //   context: currentContext.value
      // })

      // 阻止默认行为
      if (shortcut.preventDefault) {
        event.preventDefault()
      }
      
      if (shortcut.stopPropagation) {
        event.stopPropagation()
      }

      // 执行处理函数
      try {
        if (typeof shortcut.handler === 'function') {
          shortcut.handler(event)
        } else if (typeof shortcut.handler === 'string') {
          // 触发自定义事件
          window.dispatchEvent(new CustomEvent('shortcut', {
            detail: { action: shortcut.handler, event }
          }))
        }
      } catch (error) {
        console.error('Shortcut handler error:', error)
        // performanceMonitor.recordInteraction('shortcut-error', {
        //   key: shortcutKey,
        //   error: error.message
        // })
      }
    }
  }

  /**
   * 处理键盘释放事件
   * @param {KeyboardEvent} event - 键盘事件
   */
  function handleKeyUp(event) {
    updateModifiers(event, false)
  }

  /**
   * 更新修饰键状态
   * @param {KeyboardEvent} event - 键盘事件
   * @param {boolean} pressed - 是否按下
   */
  function updateModifiers(event, pressed = true) {
    Object.keys(modifierKeys).forEach(key => {
      const modifier = modifierKeys[key]
      if (event.getModifierState(key)) {
        if (pressed) {
          activeModifiers.value.add(modifier)
        }
      } else {
        activeModifiers.value.delete(modifier)
      }
    })
  }

  /**
   * 构建快捷键字符串
   * @param {KeyboardEvent} event - 键盘事件
   * @returns {string} 快捷键字符串
   */
  function buildShortcutKey(event) {
    const parts = []
    
    // 添加修饰键
    if (event.metaKey) parts.push('Cmd')
    if (event.ctrlKey) parts.push('Ctrl')
    if (event.altKey) parts.push('Alt')
    if (event.shiftKey) parts.push('Shift')
    
    // 添加主键
    let key = event.key
    
    // 处理特殊键
    if (specialKeys[key]) {
      key = specialKeys[key]
    } else if (key.length === 1) {
      // 字母和数字键转为大写
      key = key.toUpperCase()
    }
    
    parts.push(key)
    
    return parts.join('+')
  }

  /**
   * 标准化快捷键字符串
   * @param {string} key - 快捷键字符串
   * @returns {string} 标准化后的快捷键字符串
   */
  function normalizeKey(key) {
    return key.split('+')
      .map(part => part.trim())
      .map(part => {
        // 标准化修饰键
        if (part.toLowerCase() === 'meta' || part.toLowerCase() === 'cmd') return 'Cmd'
        if (part.toLowerCase() === 'control' || part.toLowerCase() === 'ctrl') return 'Ctrl'
        if (part.toLowerCase() === 'alt') return 'Alt'
        if (part.toLowerCase() === 'shift') return 'Shift'
        
        // 标准化特殊键
        const normalized = Object.entries(specialKeys).find(([k, v]) => 
          v.toLowerCase() === part.toLowerCase() || k === part
        )
        if (normalized) return normalized[1]
        
        // 字母数字键转大写
        return part.length === 1 ? part.toUpperCase() : part
      })
      .join('+')
  }

  /**
   * 查找快捷键
   * @param {string} key - 快捷键字符串
   * @returns {Object|null} 快捷键配置
   */
  function findShortcut(key) {
    // 按优先级查找：当前上下文 -> 全局上下文
    const contexts = [currentContext.value, 'global']
    
    for (const context of contexts) {
      const contextShortcuts = shortcuts.value.get(context)
      if (contextShortcuts && contextShortcuts.has(key)) {
        const shortcut = contextShortcuts.get(key)
        if (shortcut.enabled) {
          return shortcut
        }
      }
    }
    
    return null
  }

  /**
   * 获取快捷键列表
   * @param {string} context - 上下文
   * @returns {Array} 快捷键列表
   */
  function getShortcuts(context = null) {
    const result = []
    
    const contexts = context ? [context] : Array.from(shortcuts.value.keys())
    
    contexts.forEach(ctx => {
      const contextShortcuts = shortcuts.value.get(ctx)
      if (contextShortcuts) {
        contextShortcuts.forEach((config, key) => {
          result.push({
            key,
            context: ctx,
            description: config.description,
            enabled: config.enabled,
            priority: config.priority
          })
        })
      }
    })
    
    return result.sort((a, b) => b.priority - a.priority)
  }

  /**
   * 检查快捷键冲突
   * @param {string} key - 快捷键字符串
   * @param {string} context - 上下文
   * @returns {Array} 冲突的快捷键
   */
  function checkConflicts(key, context = currentContext.value) {
    const normalizedKey = normalizeKey(key)
    const conflicts = []
    
    shortcuts.value.forEach((contextShortcuts, ctx) => {
      if (contextShortcuts.has(normalizedKey)) {
        conflicts.push({
          key: normalizedKey,
          context: ctx,
          description: contextShortcuts.get(normalizedKey).description
        })
      }
    })
    
    return conflicts
  }

  /**
   * 格式化快捷键显示
   * @param {string} key - 快捷键字符串
   * @returns {string} 格式化后的显示文本
   */
  function formatKey(key) {
    // 根据平台调整显示
    const isMac = typeof navigator !== 'undefined' && navigator.platform.includes('Mac')
    
    return key.replace(/Cmd/g, isMac ? '⌘' : 'Ctrl')
              .replace(/Alt/g, isMac ? '⌥' : 'Alt')
              .replace(/Shift/g, isMac ? '⇧' : 'Shift')
              .replace(/Ctrl/g, isMac ? '⌃' : 'Ctrl')
  }

  /**
   * 初始化默认快捷键
   */
  function initializeDefaults() {
    Object.entries(defaultShortcuts).forEach(([context, shortcuts]) => {
      Object.entries(shortcuts).forEach(([key, config]) => {
        register(key, config.action, {
          ...config,
          context
        })
      })
    })
  }

  /**
   * 导出快捷键配置
   * @returns {Object} 快捷键配置
   */
  function exportConfig() {
    const config = {}
    
    shortcuts.value.forEach((contextShortcuts, context) => {
      config[context] = {}
      contextShortcuts.forEach((shortcut, key) => {
        config[context][key] = {
          description: shortcut.description,
          enabled: shortcut.enabled,
          priority: shortcut.priority
        }
      })
    })
    
    return config
  }

  /**
   * 导入快捷键配置
   * @param {Object} config - 快捷键配置
   */
  function importConfig(config) {
    Object.entries(config).forEach(([context, contextShortcuts]) => {
      Object.entries(contextShortcuts).forEach(([key, shortcutConfig]) => {
        register(key, shortcutConfig.action || shortcutConfig.handler, {
          ...shortcutConfig,
          context
        })
      })
    })
  }

  // 生命周期管理
  onMounted(() => {
    document.addEventListener('keydown', handleKeyDown, true)
    document.addEventListener('keyup', handleKeyUp, true)
    
    // 初始化默认快捷键
    initializeDefaults()
    
    // 监听焦点变化，自动切换上下文
    document.addEventListener('focusin', (event) => {
      const target = event.target
      
      // 根据焦点元素自动切换上下文
      if (target.closest('.monaco-editor')) {
        setContext('editor')
      } else if (target.closest('.snippet-list')) {
        setContext('list')
      } else if (target.closest('.search-box')) {
        setContext('search')
      } else {
        setContext('global')
      }
    })
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyDown, true)
    document.removeEventListener('keyup', handleKeyUp, true)
  })

  return {
    // 状态
    shortcuts,
    activeModifiers,
    isEnabled,
    currentContext,
    
    // 方法
    register,
    unregister,
    registerBatch,
    setContext,
    setEnabled,
    getShortcuts,
    checkConflicts,
    formatKey,
    exportConfig,
    importConfig,
    
    // 工具方法
    normalizeKey,
    buildShortcutKey
  }
}

export default useKeyboardShortcuts