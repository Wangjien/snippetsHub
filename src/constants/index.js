/**
 * SnippetsHub - 专业代码片段管理工具
 * 
 * @file constants/index.js - 应用程序常量定义
 * @author Noah
 * @description 应用程序的全局常量、配置项和枚举定义
 * @created 2026-01-28
 * @modified 2026-01-29
 * @version 1.0.0
 * 
 * 功能特性:
 * - 应用基础信息常量
 * - 视图和路由常量
 * - 主题系统配置
 * - 快捷键定义
 * - 存储键名管理
 * - 消息文本常量
 * - 配置默认值
 * - 枚举类型定义
 */

// 应用常量
export const APP_NAME = 'SnippetsHub'
export const APP_VERSION = '1.0.0'

// 视图类型
export const VIEWS = {
  CODE: 'code',
  TODO: 'todo',
  FAVORITES: 'favorites',
  MARKDOWN: 'markdown',
  SETTINGS: 'settings',
  ABOUT: 'about'
}

// 主题类型
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto',
  HIGH_CONTRAST: 'high-contrast',
  SEPIA: 'sepia'
}

export const THEME_LABELS = {
  [THEMES.LIGHT]: '明色主题',
  [THEMES.DARK]: '暗色主题',
  [THEMES.AUTO]: '跟随系统',
  [THEMES.HIGH_CONTRAST]: '高对比度',
  [THEMES.SEPIA]: '护眼模式'
}

// 优先级
export const PRIORITY = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
}

export const PRIORITY_LABELS = {
  [PRIORITY.HIGH]: '高',
  [PRIORITY.MEDIUM]: '中',
  [PRIORITY.LOW]: '低'
}

// 编程语言
export const LANGUAGES = [
  'javascript',
  'typescript',
  'python',
  'r',
  'perl',
  'ruby',
  'rust',
  'go',
  'java',
  'cpp',
  'csharp',
  'php',
  'swift',
  'kotlin',
  'html',
  'css',
  'scss',
  'sql',
  'shell',
  'bash',
  'json',
  'yaml',
  'xml',
  'markdown',
  'dockerfile'
]

// 快捷键
export const SHORTCUTS = {
  COMMAND_PALETTE: 'Alt+Space',
  NEW_SNIPPET: 'Cmd+N',
  SAVE: 'Cmd+S',
  ESCAPE: 'Escape',
  TOGGLE_THEME: 'Cmd+Shift+T'
}

// 存储键名
export const STORAGE_KEYS = {
  TODOS: 'snippetshub_todos',
  TODO_TAGS: 'snippetshub_todo_tags',
  MARKDOWN_CONTENT: 'snippetshub_markdown',
  MARKDOWN_THEME: 'snippetshub_markdown_theme',
  MARKDOWN_SETTINGS: 'snippetshub_markdown_settings',
  MARKDOWN_METADATA: 'snippetshub_markdown_metadata',
  SETTINGS: 'snippetshub_settings',
  THEME: 'snippetshub_theme'
}

// 默认设置
export const DEFAULT_SETTINGS = {
  theme: THEMES.DARK,
  fontSize: 14,
  autoSave: true,
  showMinimap: true,
  wordWrap: true,
  followSystemTheme: false,
  vimMode: false,
  tabSize: 2,
  showLineNumbers: true
}

// 主题配置
export const THEME_CONFIG = {
  [THEMES.LIGHT]: {
    name: '明色主题',
    colors: {
      // 背景色
      background: '#ffffff',
      backgroundSecondary: '#f8f9fa',
      backgroundTertiary: '#e9ecef',

      // 文字色
      textPrimary: '#212529',
      textSecondary: '#6c757d',
      textTertiary: '#adb5bd',

      // 边框色
      border: '#dee2e6',
      borderSecondary: '#e9ecef',

      // 强调色
      primary: '#0d6efd',
      primaryHover: '#0b5ed7',
      success: '#198754',
      warning: '#ffc107',
      error: '#dc3545',
      errorRgb: '220, 53, 69',

      // 特殊色
      shadow: 'rgba(0, 0, 0, 0.1)',
      overlay: 'rgba(0, 0, 0, 0.5)',

      // 代码编辑器
      editorBackground: '#ffffff',
      editorForeground: '#24292f',
      editorSelection: '#0969da20',
      editorLineHighlight: '#f6f8fa',

      // Markdown Code
      codeBackground: '#e9ecef',
      codeBlockBackground: '#f8f9fa'
    }
  },

  [THEMES.DARK]: {
    name: '暗色主题',
    colors: {
      // 背景色
      background: '#1e1e2e',
      backgroundSecondary: '#181825',
      backgroundTertiary: '#11111b',

      // 文字色
      textPrimary: '#cdd6f4',
      textSecondary: '#a6adc8',
      textTertiary: '#7f849c',

      // 边框色
      border: '#313244',
      borderSecondary: '#45475a',

      // 强调色
      primary: '#89b4fa',
      primaryHover: '#74c7ec',
      success: '#a6e3a1',
      warning: '#f9e2af',
      error: '#f38ba8',
      errorRgb: '243, 139, 168',

      // 特殊色
      shadow: 'rgba(0, 0, 0, 0.3)',
      overlay: 'rgba(0, 0, 0, 0.7)',

      // 代码编辑器
      editorBackground: '#1e1e2e',
      editorForeground: '#cdd6f4',
      editorSelection: '#89b4fa20',
      editorLineHighlight: '#313244',

      // Markdown Code
      codeBackground: '#313244',
      codeBlockBackground: '#11111b'
    }
  },

  [THEMES.HIGH_CONTRAST]: {
    name: '高对比度',
    colors: {
      // 背景色
      background: '#000000',
      backgroundSecondary: '#1a1a1a',
      backgroundTertiary: '#333333',

      // 文字色
      textPrimary: '#ffffff',
      textSecondary: '#e0e0e0',
      textTertiary: '#cccccc',

      // 边框色
      border: '#666666',
      borderSecondary: '#888888',

      // 强调色
      primary: '#00ff00',
      primaryHover: '#00cc00',
      success: '#00ff00',
      warning: '#ffff00',
      error: '#ff0000',
      errorRgb: '255, 0, 0',

      // 特殊色
      shadow: 'rgba(255, 255, 255, 0.2)',
      overlay: 'rgba(0, 0, 0, 0.9)',

      // 代码编辑器
      editorBackground: '#000000',
      editorForeground: '#ffffff',
      editorSelection: '#00ff0040',
      editorLineHighlight: '#333333',

      // Markdown Code
      codeBackground: '#333333',
      codeBlockBackground: '#11111b'
    }
  },

  [THEMES.SEPIA]: {
    name: '护眼模式',
    colors: {
      // 背景色
      background: '#f4f1ea',
      backgroundSecondary: '#ede6d3',
      backgroundTertiary: '#e6dcc6',

      // 文字色
      textPrimary: '#5c4b37',
      textSecondary: '#8b7355',
      textTertiary: '#a68b5b',

      // 边框色
      border: '#d4c4a8',
      borderSecondary: '#c7b299',

      // 强调色
      primary: '#8b4513',
      primaryHover: '#a0522d',
      success: '#6b8e23',
      warning: '#daa520',
      error: '#cd5c5c',
      errorRgb: '205, 92, 92',

      // 特殊色
      shadow: 'rgba(92, 75, 55, 0.1)',
      overlay: 'rgba(92, 75, 55, 0.5)',

      // 代码编辑器
      editorBackground: '#f4f1ea',
      editorForeground: '#5c4b37',
      editorSelection: '#8b451320',
      editorLineHighlight: '#ede6d3',

      // Markdown Code
      codeBackground: '#e6dcc6',
      codeBlockBackground: '#ede6d3'
    }
  }
}

// 错误消息
export const ERROR_MESSAGES = {
  NETWORK_ERROR: '网络连接失败，请检查网络设置',
  SAVE_FAILED: '保存失败，请重试',
  LOAD_FAILED: '加载失败，请刷新页面',
  INVALID_INPUT: '输入内容无效，请检查后重试',
  PERMISSION_DENIED: '权限不足，无法执行此操作'
}

// 成功消息
export const SUCCESS_MESSAGES = {
  SAVED: '保存成功',
  DELETED: '删除成功',
  CREATED: '创建成功',
  UPDATED: '更新成功',
  COPIED: '已复制到剪贴板',
  THEME_CHANGED: '主题已切换'
}