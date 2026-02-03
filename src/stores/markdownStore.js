/**
 * SnippetsHub - 代码片段管理工具
 * 
 * @file markdownStore.js - Markdown 编辑器状态管理
 * @author Noah
 * @description 管理 Markdown 文档的内容、设置、历史记录、自动保存和导出
 * @created 2026-01-24
 * @modified 2026-02-03
 * @version 1.0.0
 * 
 * 功能特性:
 * - 实时 Markdown 渲染和缓存
 * - 自动保存和防抖机制
 * - 撤销/重做历史记录管理
 * - 文档元数据（标题、标签）管理
 * - 智能格式化和 HTML 转换
 * - 多主题切换支持
 * - 导出为 PDF/HTML/JSON 格式
 * - 模板插入功能
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { STORAGE_KEYS } from '../constants'
import { storage, debounce } from '../utils'
import { marked } from 'marked'
import hljs from 'highlight.js'

// 重新启用highlight.js配置以支持语法高亮 - marked v4.3.0
try {
  if (marked && typeof marked.setOptions === 'function') {
    marked.setOptions({
      highlight: function (code, lang) {
        // 确保参数不为空
        if (!code || typeof code !== 'string') {
          return code || ''
        }

        // 确保语言名称有效
        const validLang = lang && typeof lang === 'string' && hljs.getLanguage(lang) ? lang : null

        try {
          if (validLang) {
            const result = hljs.highlight(code.trim(), {
              language: validLang,
              ignoreIllegals: true
            })
            return result.value
          } else {
            // 自动检测语言
            const result = hljs.highlightAuto(code.trim(), [
              'javascript', 'typescript', 'python', 'java', 'cpp', 'c',
              'html', 'css', 'json', 'xml', 'bash', 'sql', 'php', 'go', 'rust'
            ])
            return result.value
          }
        } catch (err) {
          console.warn('Highlight error:', err)
          // 返回转义的原始代码
          return code.replace(/[<>&"']/g, function (match) {
            const escapeMap = {
              '&': '&amp;',
              '<': '&lt;',
              '>': '&gt;',
              '"': '&quot;',
              "'": '&#39;'
            }
            return escapeMap[match]
          })
        }
      },
      langPrefix: 'hljs language-',
      breaks: true, // 启用换行符转换为<br>
      gfm: true, // 启用GitHub风格Markdown
      sanitize: false,
      smartypants: false,
      xhtml: false,
      pedantic: false // 不使用严格模式，允许更宽松的解析
    })

    // 暂时移除自定义渲染器，使用默认的
    // 自定义渲染器可能导致问题
  }
} catch (error) {
  console.warn('Failed to configure marked:', error)
}

// 简化的渲染器配置 - 避免复杂配置
// 暂时禁用自定义渲染器，使用默认配置
// 如果需要自定义渲染，可以在convertToHtml函数中处理

export const useMarkdownStore = defineStore('markdown', () => {
  // 状态
  const content = ref('')
  const isLoading = ref(false)
  const lastSaved = ref(null)
  const hasUnsavedChanges = ref(false)
  const currentTheme = ref('github')
  const isPreviewMode = ref(false)
  const fontSize = ref(16)
  const lineHeight = ref(1.6)
  const wordWrap = ref(true)
  const showLineNumbers = ref(true)
  const enableSpellCheck = ref(false)
  const autoSave = ref(true)
  const autoSaveInterval = ref(30000) // 30秒

  // 撤销/重做历史
  const history = ref([''])
  const historyIndex = ref(0)
  const maxHistorySize = 50

  // 文档元数据
  const documentTitle = ref('')
  const documentTags = ref([])
  const createdAt = ref(null)
  const modifiedAt = ref(null)

  // 编辑器设置
  const editorSettings = ref({
    tabSize: 2,
    insertSpaces: true,
    trimTrailingWhitespace: true,
    insertFinalNewline: true,
    detectIndentation: true
  })

  // 可用主题列表
  const availableThemes = [
    { id: 'github', name: 'GitHub', description: '经典GitHub风格', category: 'light' },
    { id: 'material', name: 'Material', description: 'Material Design风格', category: 'light' },
    { id: 'dracula', name: 'Dracula', description: '暗黑主题', category: 'dark' },
    { id: 'solarized', name: 'Solarized', description: 'Solarized配色', category: 'light' },
    { id: 'nord', name: 'Nord', description: 'Nord极地配色', category: 'dark' },
    { id: 'monokai', name: 'Monokai', description: 'Monokai经典配色', category: 'dark' },
    { id: 'minimal', name: 'Minimal', description: '极简风格', category: 'light' },
    { id: 'academic', name: 'Academic', description: '学术论文风格', category: 'light' }
  ]

  // 计算属性
  const characterCount = computed(() => String(content.value || '').length)
  const wordCount = computed(() => {
    const text = String(content.value || '').trim()
    if (!text) return 0
    const words = text.split(/\s+/)
    return words[0] === '' ? 0 : words.length
  })
  const lineCount = computed(() => String(content.value || '').split('\n').length)
  const paragraphCount = computed(() => {
    const text = String(content.value || '').trim()
    if (!text) return 0
    return text.split(/\n\s*\n/).filter(p => p.trim()).length
  })
  const readingTime = computed(() => {
    const wordsPerMinute = 200
    const minutes = Math.ceil(wordCount.value / wordsPerMinute)
    return minutes
  })

  // 文档结构分析
  const documentStructure = computed(() => {
    const text = String(content.value || '')
    const headings = []
    const lines = text.split('\n')

    lines.forEach((line, index) => {
      const match = line.match(/^(#{1,6})\s+(.+)/)
      if (match) {
        const level = match[1].length
        const title = match[2].trim()
        const id = title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
        headings.push({
          level,
          title,
          id,
          line: index + 1,
          children: []
        })
      }
    })

    // 构建层级结构
    const buildHierarchy = (items) => {
      const result = []
      const stack = []

      items.forEach(item => {
        while (stack.length > 0 && stack[stack.length - 1].level >= item.level) {
          stack.pop()
        }

        if (stack.length === 0) {
          result.push(item)
        } else {
          stack[stack.length - 1].children.push(item)
        }

        stack.push(item)
      })

      return result
    }

    return buildHierarchy(headings)
  })

  // 防抖保存函数 - 优化延迟时间
  const debouncedSave = debounce(() => {
    if (autoSave.value) {
      saveContent()
    }
  }, 300)

  // 自动保存定时器
  let autoSaveTimer = null

  const startAutoSave = () => {
    if (autoSaveTimer) {
      clearInterval(autoSaveTimer)
    }

    if (autoSave.value && autoSaveInterval.value > 0) {
      autoSaveTimer = setInterval(() => {
        if (hasUnsavedChanges.value) {
          saveContent()
        }
      }, autoSaveInterval.value)
    }
  }

  const stopAutoSave = () => {
    if (autoSaveTimer) {
      clearInterval(autoSaveTimer)
      autoSaveTimer = null
    }
  }

  // 方法
  const loadContent = () => {
    try {
      isLoading.value = true
      const savedContent = storage.get(STORAGE_KEYS.MARKDOWN_CONTENT, '')
      const savedTheme = storage.get(STORAGE_KEYS.MARKDOWN_THEME, 'github')
      const savedSettings = storage.get(STORAGE_KEYS.MARKDOWN_SETTINGS, {})

      content.value = savedContent
      currentTheme.value = savedTheme

      // 加载编辑器设置
      Object.assign(editorSettings.value, savedSettings.editor || {})
      fontSize.value = savedSettings.fontSize || 16
      lineHeight.value = savedSettings.lineHeight || 1.6
      wordWrap.value = savedSettings.wordWrap !== false
      showLineNumbers.value = savedSettings.showLineNumbers !== false
      enableSpellCheck.value = savedSettings.enableSpellCheck || false
      autoSave.value = savedSettings.autoSave !== false
      autoSaveInterval.value = savedSettings.autoSaveInterval || 30000

      // 加载文档元数据
      const metadata = storage.get(STORAGE_KEYS.MARKDOWN_METADATA, {})
      documentTitle.value = metadata.title || ''
      documentTags.value = metadata.tags || []
      createdAt.value = metadata.createdAt || new Date().toISOString()
      modifiedAt.value = metadata.modifiedAt || new Date().toISOString()

      hasUnsavedChanges.value = false

      // 初始化历史记录
      history.value = [savedContent]
      historyIndex.value = 0

      // 启动自动保存
      startAutoSave()
    } catch (error) {
      console.error('Failed to load markdown content:', error)
      throw new Error('加载文档失败')
    } finally {
      isLoading.value = false
    }
  }

  const saveContent = () => {
    try {
      storage.set(STORAGE_KEYS.MARKDOWN_CONTENT, content.value)
      storage.set(STORAGE_KEYS.MARKDOWN_THEME, currentTheme.value)

      // 保存编辑器设置
      const settings = {
        editor: editorSettings.value,
        fontSize: fontSize.value,
        lineHeight: lineHeight.value,
        wordWrap: wordWrap.value,
        showLineNumbers: showLineNumbers.value,
        enableSpellCheck: enableSpellCheck.value,
        autoSave: autoSave.value,
        autoSaveInterval: autoSaveInterval.value
      }
      storage.set(STORAGE_KEYS.MARKDOWN_SETTINGS, settings)

      // 保存文档元数据
      const metadata = {
        title: documentTitle.value,
        tags: documentTags.value,
        createdAt: createdAt.value,
        modifiedAt: new Date().toISOString()
      }
      storage.set(STORAGE_KEYS.MARKDOWN_METADATA, metadata)
      modifiedAt.value = metadata.modifiedAt

      lastSaved.value = new Date().toLocaleTimeString('zh-CN')
      hasUnsavedChanges.value = false

      // 创建快照 (最大保留20个)
      createSnapshot()
    } catch (error) {
      console.error('Failed to save markdown content:', error)
      throw new Error('保存文档失败')
    }
  }

  // 快照管理
  const snapshots = ref([])

  const loadSnapshots = () => {
    const saved = storage.get('snippetshub_markdown_snapshots', [])
    snapshots.value = saved
  }

  const createSnapshot = () => {
    const snapshot = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      title: documentTitle.value || '无标题文档',
      summary: content.value.substring(0, 100),
      content: content.value
    }

    snapshots.value.unshift(snapshot)
    if (snapshots.value.length > 20) {
      snapshots.value.pop()
    }
    storage.set('snippetshub_markdown_snapshots', snapshots.value)
  }

  const restoreSnapshot = (snapshot) => {
    content.value = snapshot.content
    documentTitle.value = snapshot.title
    hasUnsavedChanges.value = true // Restored content counts as "unsaved" vs current disk state
    addToHistory(content.value)
  }

  const deleteSnapshot = (id) => {
    snapshots.value = snapshots.value.filter(s => s.id !== id)
    storage.set('snippetshub_markdown_snapshots', snapshots.value)
  }

  const updateContent = (newContent) => {
    // 确保内容是字符串
    const contentString = String(newContent || '')

    // 只有内容真正改变时才添加到历史
    if (contentString !== content.value) {
      // 添加到历史记录
      addToHistory(contentString)

      content.value = contentString
      hasUnsavedChanges.value = true

      // 清除HTML缓存，确保重新转换
      clearHtmlCache()

      debouncedSave() // 自动保存
    }
  }

  // 智能文本插入
  const insertText = (before, after = '', selectedText = '') => {
    const newText = before + selectedText + after
    return newText
  }

  // 格式化文档
  const formatDocument = () => {
    try {
      let formatted = content.value

      // 修复标题格式
      formatted = formatted.replace(/^(#{1,6})\s*(.+)$/gm, (match, hashes, title) => {
        return `${hashes} ${title.trim()}`
      })

      // 修复列表格式
      formatted = formatted.replace(/^(\s*)([-*+])\s*(.+)$/gm, (match, indent, bullet, text) => {
        return `${indent}${bullet} ${text.trim()}`
      })

      // 修复有序列表格式
      formatted = formatted.replace(/^(\s*)(\d+)\.\s*(.+)$/gm, (match, indent, num, text) => {
        return `${indent}${num}. ${text.trim()}`
      })

      // 清理多余空行
      formatted = formatted.replace(/\n{3,}/g, '\n\n')

      // 修复代码块格式
      formatted = formatted.replace(/^```(\w*)\s*\n([\s\S]*?)\n```$/gm, (match, lang, code) => {
        return `\`\`\`${lang}\n${code.trim()}\n\`\`\``
      })

      if (formatted !== content.value) {
        updateContent(formatted)
      }
    } catch (error) {
      console.error('Format document error:', error)
    }
  }

  // 搜索和替换
  const searchAndReplace = (searchTerm, replaceTerm, options = {}) => {
    try {
      const { caseSensitive = false, wholeWord = false, useRegex = false } = options
      let searchPattern

      if (useRegex) {
        const flags = caseSensitive ? 'g' : 'gi'
        searchPattern = new RegExp(searchTerm, flags)
      } else {
        let escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        if (wholeWord) {
          escapedTerm = `\\b${escapedTerm}\\b`
        }
        const flags = caseSensitive ? 'g' : 'gi'
        searchPattern = new RegExp(escapedTerm, flags)
      }

      const newContent = content.value.replace(searchPattern, replaceTerm)
      if (newContent !== content.value) {
        updateContent(newContent)
        return true
      }
      return false
    } catch (error) {
      console.error('Search and replace error:', error)
      return false
    }
  }

  // 获取选中文本的统计信息
  const getSelectionStats = (selectedText) => {
    if (!selectedText) return null

    const chars = selectedText.length
    const words = selectedText.trim().split(/\s+/).filter(w => w).length
    const lines = selectedText.split('\n').length

    return { chars, words, lines }
  }

  // 导出为不同格式
  const exportAs = (format) => {
    try {
      switch (format) {
        case 'markdown':
          return content.value
        case 'html':
          return convertToHtml()
        case 'text':
          return content.value.replace(/[#*`_~\[\]()]/g, '')
        case 'json':
          return JSON.stringify({
            title: documentTitle.value,
            content: content.value,
            tags: documentTags.value,
            createdAt: createdAt.value,
            modifiedAt: modifiedAt.value,
            stats: getStats()
          }, null, 2)
        default:
          throw new Error(`Unsupported format: ${format}`)
      }
    } catch (error) {
      console.error('Export error:', error)
      throw new Error(`导出${format}格式失败`)
    }
  }

  // 文档模板
  const insertTemplate = (templateType) => {
    const templates = {
      'readme': `# 项目名称

## 简介
项目的简短描述

## 安装
\`\`\`bash
npm install
\`\`\`

## 使用方法
\`\`\`javascript
// 示例代码
\`\`\`

## 贡献
欢迎提交 Pull Request

## 许可证
MIT
`,
      'blog': `# 文章标题

> 发布日期：${new Date().toLocaleDateString('zh-CN')}

## 摘要
文章摘要...

## 正文
文章内容...

## 总结
总结内容...

---
标签：#博客 #技术
`,
      'meeting': `# 会议纪要

**时间**：${new Date().toLocaleDateString('zh-CN')}
**参与者**：
**主持人**：

## 议程
1. 
2. 
3. 

## 讨论要点

## 决议事项

## 行动计划
- [ ] 任务1
- [ ] 任务2

## 下次会议
**时间**：
**议题**：
`,
      'api': `# API 文档

## 概述
API 的基本信息

## 认证
\`\`\`
Authorization: Bearer <token>
\`\`\`

## 端点

### GET /api/resource
获取资源列表

**参数**：
- \`page\` (number): 页码
- \`limit\` (number): 每页数量

**响应**：
\`\`\`json
{
  "data": [],
  "total": 0,
  "page": 1
}
\`\`\`

## 错误码
- 400: 请求参数错误
- 401: 未授权
- 404: 资源不存在
- 500: 服务器错误
`
    }

    const template = templates[templateType]
    if (template) {
      if (content.value.trim()) {
        updateContent(content.value + '\n\n' + template)
      } else {
        updateContent(template)
      }
    }
  }

  // 撤销/重做相关方法
  const addToHistory = (contentToAdd) => {
    // 移除当前位置之后的历史
    history.value = history.value.slice(0, historyIndex.value + 1)

    // 添加新的历史记录
    history.value.push(contentToAdd)

    // 限制历史记录大小
    if (history.value.length > maxHistorySize) {
      history.value = history.value.slice(-maxHistorySize)
    }

    historyIndex.value = history.value.length - 1
  }

  const canUndo = computed(() => historyIndex.value > 0)
  const canRedo = computed(() => historyIndex.value < history.value.length - 1)

  const undo = () => {
    if (canUndo.value) {
      historyIndex.value--
      content.value = history.value[historyIndex.value]
      hasUnsavedChanges.value = true
    }
  }

  const redo = () => {
    if (canRedo.value) {
      historyIndex.value++
      content.value = history.value[historyIndex.value]
      hasUnsavedChanges.value = true
    }
  }

  const exportMarkdown = () => {
    try {
      return content.value
    } catch (error) {
      console.error('Failed to export markdown:', error)
      throw new Error('导出文档失败')
    }
  }

  const importMarkdown = (markdownContent) => {
    try {
      content.value = markdownContent
      hasUnsavedChanges.value = true
      saveContent()
    } catch (error) {
      console.error('Failed to import markdown:', error)
      throw new Error('导入文档失败')
    }
  }

  const clearContent = () => {
    content.value = ''
    hasUnsavedChanges.value = true
    saveContent()
  }

  // 主题相关方法
  const setTheme = (themeId) => {
    if (availableThemes.find(t => t.id === themeId)) {
      currentTheme.value = themeId
      storage.set(STORAGE_KEYS.MARKDOWN_THEME, themeId)
    }
  }

  const getCurrentTheme = () => {
    return availableThemes.find(t => t.id === currentTheme.value) || availableThemes[0]
  }

  // Markdown 转 HTML（使用marked库 + 缓存优化）
  const htmlCache = new Map()
  const maxCacheSize = 20

  // 清除缓存的方法
  const clearHtmlCache = () => {
    htmlCache.clear()
  }

  const convertToHtml = (markdownText = content.value) => {
    try {
      // 确保输入是字符串
      const textToConvert = String(markdownText || '')

      if (!textToConvert.trim()) {
        return '<p class="empty-placeholder">开始写作...</p>'
      }

      // 生成缓存键
      const cacheKey = `${textToConvert.length}:${textToConvert.slice(0, 100)}`

      // 检查缓存
      if (htmlCache.has(cacheKey)) {
        return htmlCache.get(cacheKey)
      }

      let html

      // 优先使用marked库
      try {
        if (typeof marked === 'function') {
          html = marked(textToConvert)
        } else {
          throw new Error('marked not available')
        }
      } catch (markedError) {
        console.warn('marked library error:', markedError)

        // 使用简化的转换器作为回退
        html = simpleMarkdownToHtml(textToConvert)
      }

      // 最终检查确保html是字符串
      if (typeof html !== 'string') {
        html = simpleMarkdownToHtml(textToConvert)
      }

      // 缓存结果
      if (htmlCache.size >= maxCacheSize) {
        const firstKey = htmlCache.keys().next().value
        htmlCache.delete(firstKey)
      }
      htmlCache.set(cacheKey, html)

      return html
    } catch (error) {
      console.error('Failed to convert markdown to HTML:', error)
      // 最终回退：直接返回转义的文本
      const escapedText = String(markdownText || '').replace(/[<>&"']/g, (m) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' })[m])
      return `<p>${escapedText}</p>`
    }
  }

  // 简化的Markdown转HTML实现
  const simpleMarkdownToHtml = (text) => {
    try {
      let html = text

      // 转义HTML字符
      html = html.replace(/[<>&"']/g, (m) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' })[m])

      // 处理代码块（三个反引号）
      html = html.replace(/```(\w*)\n?([\s\S]*?)\n?```/gim, (match, lang, code) => {
        const langClass = lang ? `language-${lang}` : 'language-plaintext'

        // 尝试使用highlight.js进行语法高亮
        let highlightedCode = code.trim()
        try {
          if (lang && hljs.getLanguage(lang)) {
            const result = hljs.highlight(highlightedCode, {
              language: lang,
              ignoreIllegals: true
            })
            highlightedCode = result.value
          } else {
            // 自动检测语言
            const result = hljs.highlightAuto(highlightedCode, [
              'javascript', 'typescript', 'python', 'java', 'cpp', 'c',
              'html', 'css', 'json', 'xml', 'bash', 'sql', 'php', 'go', 'rust'
            ])
            highlightedCode = result.value
          }
        } catch (error) {
          console.warn('Highlight error in simple converter:', error)
          // 如果高亮失败，保持转义的代码
        }

        return `<pre class="terminal-code-block"><code class="hljs ${langClass}" data-language="${lang || 'plaintext'}">${highlightedCode}</code></pre>`
      })

      // 处理行内代码（单个反引号）
      html = html.replace(/`([^`\n]+)`/gim, '<code class="hljs-inline">$1</code>')

      // 处理标题
      html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>')
      html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>')
      html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>')

      // 处理粗体和斜体
      html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>')

      // 处理链接
      html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank">$1</a>')

      // 处理列表
      html = html.replace(/^\* (.+)$/gim, '<li>$1</li>')
      html = html.replace(/^- (.+)$/gim, '<li>$1</li>')
      html = html.replace(/^(\d+)\. (.+)$/gim, '<li>$1. $2</li>')

      // 处理引用
      html = html.replace(/^> (.+)$/gim, '<blockquote>$1</blockquote>')

      // 处理段落 - 简化版本
      // 将双换行符分割成段落
      const paragraphs = html.split(/\n\s*\n/)
      html = paragraphs.map(paragraph => {
        paragraph = paragraph.trim()
        if (!paragraph) return ''

        // 将单换行符替换为<br>
        paragraph = paragraph.replace(/\n/g, '<br>')

        // 如果不是HTML标签开头，包装在<p>标签中
        if (!paragraph.match(/^<(h[1-6]|pre|blockquote|ul|ol|li|div)/)) {
          return `<p>${paragraph}</p>`
        }
        return paragraph
      }).filter(p => p).join('\n\n')

      return html
    } catch (error) {
      console.error('Simple markdown converter error:', error)
      // 最终回退
      return `<p>${text.replace(/[<>&"']/g, (m) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' })[m])}</p>`
    }
  }

  // 获取文档统计信息
  const getStats = () => {
    return {
      characters: characterCount.value,
      words: wordCount.value,
      lines: lineCount.value,
      lastSaved: lastSaved.value,
      hasUnsavedChanges: hasUnsavedChanges.value
    }
  }

  // 初始化
  const initialize = () => {
    loadContent()
  }

  // 清理函数
  const cleanup = () => {
    stopAutoSave()
  }

  return {
    // 状态
    content,
    isLoading,
    lastSaved,
    hasUnsavedChanges,
    currentTheme,
    availableThemes,
    isPreviewMode,
    fontSize,
    lineHeight,
    wordWrap,
    showLineNumbers,
    enableSpellCheck,
    autoSave,
    autoSaveInterval,
    documentTitle,
    documentTags,
    createdAt,
    modifiedAt,
    editorSettings,

    // 计算属性
    characterCount,
    wordCount,
    lineCount,
    paragraphCount,
    readingTime,
    documentStructure,
    canUndo,
    canRedo,

    // 方法
    loadContent,
    saveContent,
    updateContent,
    insertText,
    exportMarkdown,
    importMarkdown,
    clearContent,
    convertToHtml,
    clearHtmlCache,
    getStats,
    initialize,
    cleanup,
    setTheme,
    getCurrentTheme,
    undo,
    redo,
    formatDocument,
    searchAndReplace,
    getSelectionStats,
    exportAs,
    insertTemplate,
    startAutoSave,

    // Snapshots
    snapshots,
    loadSnapshots,
    createSnapshot,
    restoreSnapshot,
    deleteSnapshot
  }
})