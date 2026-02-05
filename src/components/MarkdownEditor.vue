/**
 * SnippetsHub - 专业代码片段管理工具
 * 
 * @file MarkdownEditor.vue - Markdown编辑器组件
 * @author Noah
 * @description 功能丰富的Markdown编辑器，支持实时预览和多种编辑模式
 * @created 2026-01-28
 * @modified 2026-01-29
 * @version 1.0.0
 * 
 * 功能特性:
 * - 实时Markdown预览
 * - 分屏编辑模式
 * - 语法高亮支持
 * - 工具栏快捷操作
 * - 表格和图片插入
 * - 代码块语法高亮
 * - 导出多种格式
 * - 自动保存功能
 */
<template>
  <div class="markdown-editor" :class="{ fullscreen: isFullscreen }">
    <!-- Modern Header -->
    <div class="modern-header">
      <div class="header-left">
        <button class="icon-btn-ghost" @click="$emit('back')" title="返回">
          <ArrowLeft :size="20" />
        </button>
        <button class="icon-btn-ghost" @click="toggleFullscreen" :title="isFullscreen ? '退出全屏' : '全屏'">
          <component :is="isFullscreen ? Minimize2 : Maximize2" :size="20" />
        </button>
      </div>

      <div class="view-switcher">
        <button 
          class="switch-btn" 
          :class="{ active: viewMode === 'edit' }" 
          @click="setViewMode('edit')"
        >
          <Edit3 :size="14" /> <span>编辑</span>
        </button>
        <button 
          class="switch-btn" 
          :class="{ active: viewMode === 'split' }" 
          @click="setViewMode('split')"
        >
          <Columns :size="14" /> <span>分屏</span>
        </button>
        <button 
          class="switch-btn" 
          :class="{ active: viewMode === 'preview' }" 
          @click="setViewMode('preview')"
        >
          <Eye :size="14" /> <span>预览</span>
        </button>
      </div>

      <div class="theme-selector">
        <select 
          :value="markdownStore.currentTheme" 
          @change="handleThemeChange"
          class="theme-select"
        >
          <option 
            v-for="theme in markdownStore.availableThemes" 
            :key="theme.id" 
            :value="theme.id"
          >
            {{ theme.name }}
          </option>
        </select>
        <Palette :size="16" class="theme-icon" />
      </div>
      
      <div class="header-actions">
        <div class="save-status">
          <div v-if="markdownStore.hasUnsavedChanges" class="unsaved-dot"></div>
          <span>{{ markdownStore.hasUnsavedChanges ? '未保存' : '已保存' }}</span>
        </div>
        <button class="btn-save-primary" @click="saveContent" :disabled="!markdownStore.hasUnsavedChanges">
          <Save :size="16" />
          <span>保存</span>
        </button>
        <button 
          class="icon-btn-ghost" 
          :class="{ active: showOutline }"
          @click="showOutline = !showOutline" 
          title="目录大纲"
        >
          <List :size="20" />
        </button>
        <button class="icon-btn-ghost" @click="showExportMenu = !showExportMenu" title="导出">
          <Download :size="20" />
        </button>
        <button class="icon-btn-ghost" @click="openHistory" title="历史记录">
          <History :size="20" />
        </button>
      </div>
    </div>

    <!-- EXPORT DROPDOWN -->
    <div v-if="showExportMenu" class="dropdown-menu export-menu">
      <button @click="handleExport('md')" class="menu-item">
        <FileCode :size="14" />
        <span>导出为 Markdown</span>
      </button>
      <button @click="handleExport('html')" class="menu-item">
        <FileText :size="14" />
        <span>导出为 HTML</span>
      </button>
      <div class="menu-divider"></div>
      <button @click="handleExport('pdf')" class="menu-item">
        <Printer :size="14" />
        <span>导出为 PDF</span>
      </button>
      <button @click="handleExport('doc')" class="menu-item">
        <FileText :size="14" />
        <span>导出为 Word</span>
      </button>
    </div>

    <!-- HISTORY MODAL -->
    <div v-if="showHistoryModal" class="modal-overlay" @click.self="showHistoryModal = false">
      <div class="modal-content history-modal">
        <div class="modal-header">
          <h3><History :size="18" /> 历史记录 / 最近编辑</h3>
           <button class="close-btn" @click="showHistoryModal = false"><X :size="18" /></button>
        </div>
        <div class="modal-body">
           <div v-if="markdownStore.snapshots.length === 0" class="empty-state">
              <ClockIcon :size="48" />
              <p>暂无历史记录</p>
           </div>
           <div v-else class="history-list">
             <div v-for="snap in markdownStore.snapshots" :key="snap.id" class="history-item" @click="restoreSnapshot(snap)">
               <div class="history-info">
                 <span class="history-time">{{ new Date(snap.timestamp).toLocaleString() }}</span>
                 <span class="history-title">{{ snap.title || '无标题' }}</span>
                 <span class="history-summary">{{ snap.summary }}...</span>
               </div>
               <button class="restore-btn" @click.stop="restoreSnapshot(snap)">恢复</button>
             </div>
           </div>
        </div>
      </div>
    </div>

    <!-- Meta & Toolbar Area -->
    <div class="meta-area">
      <input 
        v-model="docTitle"
        class="title-input-large" 
        placeholder="无标题文档" 
        type="text"
      />
      
      <div class="sleek-toolbar">
        <div class="toolbar-group">
          <button @click="markdownStore.undo()" class="tool-btn" title="撤销 (Ctrl+Z)" :disabled="!markdownStore.canUndo" :style="{ opacity: markdownStore.canUndo ? 1 : 0.4 }"><Undo :size="15" /></button>
          <button @click="markdownStore.redo()" class="tool-btn" title="重做 (Ctrl+Shift+Z)" :disabled="!markdownStore.canRedo" :style="{ opacity: markdownStore.canRedo ? 1 : 0.4 }"><Redo :size="15" /></button>
        </div>
        
        <div class="divider-vertical small"></div>

        <div class="toolbar-group">
          <button @click="insertText('# ')" class="tool-btn" title="一级标题">H1</button>
          <button @click="insertText('## ')" class="tool-btn" title="二级标题">H2</button>
          <button @click="insertText('### ')" class="tool-btn" title="三级标题">H3</button>
        </div>
        
        <div class="divider-vertical small"></div>
        
        <div class="toolbar-group">
          <button @click="insertText('**', '**')" class="tool-btn" title="粗体"><Bold :size="15" /></button>
          <button @click="insertText('*', '*')" class="tool-btn" title="斜体"><Italic :size="15" /></button>
          <button @click="insertText('~~', '~~')" class="tool-btn" title="删除线"><Strikethrough :size="15" /></button>
        </div>

        <div class="divider-vertical small"></div>

        <div class="toolbar-group">
          <button @click="insertText('`', '`')" class="tool-btn" title="行内代码"><Code :size="15" /></button>
          <button @click="insertText('```\n', '\n```')" class="tool-btn" title="代码块"><Code2 :size="15" /></button>
          <button @click="insertText('> ')" class="tool-btn" title="引用"><Quote :size="15" /></button>
        </div>

        <div class="divider-vertical small"></div>

        <div class="toolbar-group">
          <button @click="insertText('- ')" class="tool-btn" title="列表"><List :size="15" /></button>
          <button @click="insertText('1. ')" class="tool-btn" title="有序列表"><ListOrdered :size="15" /></button>
          <button @click="insertTable" class="tool-btn" title="表格"><Table :size="15" /></button>
        </div>

        <div class="divider-vertical small"></div>

        <div class="toolbar-group">
          <button @click="insertText('[', '](url)')" class="tool-btn" title="链接"><Link :size="15" /></button>
          <button @click="insertText('![', '](url)')" class="tool-btn" title="图片"><Image :size="15" /></button>
        </div>
        
        <div class="spacer"></div>
        
        <div class="toolbar-group right">
           <button @click="clearContent" class="tool-btn danger" title="清空"><Eraser :size="15" /></button>
        </div>
      </div>
    </div>

    <!-- Editor Body -->
    <div class="editor-body" :class="`mode-${viewMode}`">
      <!-- Edit Pane -->
      <div v-show="viewMode !== 'preview'" class="pane editor-pane">
        <div class="line-numbers" v-if="showLineNumbers">
          <div 
            v-for="n in lineCount" 
            :key="n" 
            class="line-number"
            :class="{ active: n === currentLine }"
          >
            {{ n }}
          </div>
        </div>
        <textarea
          ref="textareaRef"
          :value="markdownStore.content"
          @input="handleInput"
          @scroll="handleScroll('editor')"
          @paste="handlePaste"
          @keydown="handleKeydown"
          @click="updateCursorPosition"
          @mouseup="handleTextSelection"
          @select="handleTextSelection"
          class="main-textarea"
          placeholder="开始写作..."
          spellcheck="false"
          :style="{ fontSize: fontSize + 'px' }"
        ></textarea>
      </div>

      <!-- Preview Pane -->
      <div v-show="viewMode !== 'edit'" class="pane preview-pane" ref="previewRef" @scroll="handleScroll('preview')" :style="previewPaneStyle">
         <div class="markdown-preview" :class="`theme-${markdownStore.currentTheme}`" v-html="previewHtml"></div>
      </div>

      <!-- 目录大纲 -->
      <MarkdownOutline
        v-if="showOutline"
        :content="markdownStore.content"
        :scrollContainer="previewRef"
        @close="showOutline = false"
        @scroll-to="scrollToHeading"
      />
    </div>

    <!-- 浮动工具栏 -->
    <MarkdownFloatingToolbar
      :show="showFloatingToolbar"
      :selection="textSelection"
      :textareaRef="textareaRef"
      @format="handleFloatingFormat"
      @copy="handleCopy"
    />

    <!-- Floating Status Bar -->
    <div class="floating-status">
      <div class="status-item">
        <span class="label">字数</span>
        <span class="value">{{ markdownStore.wordCount }}</span>
      </div>
      <div class="divider-dot"></div>
      <div class="status-item">
        <span class="label">行数</span>
        <span class="value">{{ markdownStore.lineCount }}</span>
      </div>
      <div class="divider-dot"></div>
      <div class="status-item">
        <span class="label">位置</span>
        <span class="value">{{ currentLine }}:{{ currentColumn }}</span>
      </div>
    </div>

    <!-- Loading Overlay -->
    <LoadingSpinner v-if="markdownStore.isLoading" text="加载中..." />
    
    <!-- Hidden File Input -->
    <input
      ref="fileInputRef"
      type="file"
      accept=".md,.markdown,.txt"
      style="display: none"
      @change="handleFileImport"
    />
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, watch } from 'vue'
import { 
  Eye, EyeOff, Save, Hash, Bold, Italic, Code, Code2, 
  List, Link, Quote, FileText, Clock, Type, Download, Upload, Trash2,
  Edit3, Columns, Strikethrough, Image, ListOrdered, Table, FileCode,
  MapPin, Settings, X, ArrowLeft, Maximize2, Minimize2, Check, LayoutTemplate,
  Palette, Eraser, Undo, Redo, History, Clock as ClockIcon, Printer
} from 'lucide-vue-next'
import { useMarkdownStore } from '../stores/markdownStore'
import { fileUtils } from '../utils'
import LoadingSpinner from './LoadingSpinner.vue'
import MarkdownFloatingToolbar from './MarkdownFloatingToolbar.vue'
import MarkdownOutline from './MarkdownOutline.vue'

// 导入highlight.js样式
import 'highlight.js/styles/github.css'

const markdownStore = useMarkdownStore()

const emit = defineEmits(['back'])

const isFullscreen = ref(false)
const viewMode = ref('edit') // edit, split, preview
const textareaRef = ref(null)
const previewRef = ref(null)
const fileInputRef = ref(null)

// State for new features
const showExportMenu = ref(false)
const showHistoryModal = ref(false)
const showOutline = ref(false)
const showFloatingToolbar = ref(false)
const textSelection = ref(null)

const isScrolling = ref(false) // 用于防止滚动循环触发
const showSettings = ref(false)
const showLineNumbers = ref(true)
const showToc = ref(false)
const wordWrap = ref(true)
const fontSize = ref(15) // 默认为 15px
const currentLine = ref(1)
const currentColumn = ref(1)
const docTitle = ref('') // 新增标题状态

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
}

const previewHtml = computed(() => {
  return markdownStore.convertToHtml()
})

const previewPaneStyle = computed(() => {
  const themeBackgrounds = {
    'github': '#ffffff',
    'material': '#fafafa', 
    'dracula': '#282a36',
    'solarized': '#fdf6e3',
    'nord': '#2e3440',
    'monokai': '#272822',
    'minimal': '#fff',
    'academic': '#fff'
  }
  
  return {
    background: themeBackgrounds[markdownStore.currentTheme] || 'var(--color-background)'
  }
})

const lineCount = computed(() => {
  return markdownStore.content.split('\n').length
})

const tableOfContents = computed(() => {
  const headings = []
  const lines = markdownStore.content.split('\n')
  
  lines.forEach((line, index) => {
    const match = line.match(/^(#{1,6})\s+(.+)/)
    if (match) {
      const level = match[1].length
      const text = match[2]
      const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
      headings.push({ level, text, id, line: index + 1 })
    }
  })
  
  return headings
})

onMounted(() => {
  markdownStore.initialize()
  // 初始化时应用代码块样式
  nextTick(() => {
    applyCodeBlockStyles()
  })
})

// 监听主题变化，重新应用样式
watch(() => markdownStore.currentTheme, () => {
  nextTick(() => {
    applyCodeBlockStyles()
  })
})

const handleInput = (event) => {
  markdownStore.updateContent(event.target.value)
  updateCursorPosition()
}

const handleScroll = (source) => {
  if (viewMode.value !== 'split') return
  // 简单的防抖锁，防止循环触发
  if (isScrolling.value) return

  isScrolling.value = true
  
  const editor = textareaRef.value
  const preview = previewRef.value
  
  if (editor && preview) {
    if (source === 'editor') {
      const percentage = editor.scrollTop / (editor.scrollHeight - editor.clientHeight)
      preview.scrollTop = percentage * (preview.scrollHeight - preview.clientHeight)
    } else if (source === 'preview') {
      const percentage = preview.scrollTop / (preview.scrollHeight - preview.clientHeight)
      editor.scrollTop = percentage * (editor.scrollHeight - editor.clientHeight)
    }
  }

  setTimeout(() => {
    isScrolling.value = false
  }, 50)
}

const handlePaste = (event) => {
  const items = event.clipboardData?.items
  if (!items) return

  for (const item of items) {
    if (item.type.indexOf('image') !== -1) {
      event.preventDefault()
      const blob = item.getAsFile()
      
      // 显示上传中...或者处理中
      const reader = new FileReader()
      reader.onload = (e) => {
        const base64 = e.target.result
        // 插入图片 Markdown
        insertText(`![Image](${base64})`)
      }
      reader.readAsDataURL(blob)
      return
    }
  }
}

const handleKeydown = (event) => {
  // 处理快捷键
  if (event.ctrlKey || event.metaKey) {
    switch (event.key) {
      case 's':
        event.preventDefault()
        saveContent()
        break
      case 'b':
        event.preventDefault()
        insertText('**', '**')
        break
      case 'i':
        event.preventDefault()
        insertText('*', '*')
        break
      case 'k':
        event.preventDefault()
        insertText('[', '](url)')
        break
      case 'z':
        if (event.shiftKey) {
            event.preventDefault()
            markdownStore.redo()
        } else {
            event.preventDefault()
            markdownStore.undo()
        }
        break
      case 'y':
        event.preventDefault()
        markdownStore.redo()
        break
    }
  }
  
  // Tab 键处理
  if (event.key === 'Tab') {
    event.preventDefault()
    insertText('  ') // 插入两个空格
  }
}

const updateCursorPosition = () => {
  const textarea = textareaRef.value
  if (!textarea) return
  
  const cursorPos = textarea.selectionStart
  const textBeforeCursor = markdownStore.content.substring(0, cursorPos)
  const lines = textBeforeCursor.split('\n')
  
  currentLine.value = lines.length
  currentColumn.value = lines[lines.length - 1].length + 1
}

const handleThemeChange = (event) => {
  markdownStore.setTheme(event.target.value)
}

const setViewMode = (mode) => {
  viewMode.value = mode
}

const insertText = (before, after = '') => {
  const textarea = textareaRef.value
  if (!textarea) return

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selectedText = markdownStore.content.substring(start, end)
  
  const newText = markdownStore.insertText(before, after, selectedText)
  const newContent = 
    markdownStore.content.substring(0, start) + 
    newText + 
    markdownStore.content.substring(end)
  
  markdownStore.updateContent(newContent)

  nextTick(() => {
    textarea.focus()
    textarea.setSelectionRange(
      start + before.length,
      start + before.length + selectedText.length
    )
    updateCursorPosition()
  })
}

const insertTable = () => {
  const tableTemplate = `
| 列1 | 列2 | 列3 |
|-----|-----|-----|
| 内容1 | 内容2 | 内容3 |
| 内容4 | 内容5 | 内容6 |
`
  insertText(tableTemplate)
}

const saveContent = async () => {
  try {
    await markdownStore.saveContent()
    // 这里可以添加成功通知
  } catch (error) {
    console.error('Save failed:', error)
    // 这里可以添加错误通知
  }
}

const exportMarkdown = () => {
  try {
    const content = markdownStore.exportMarkdown()
    const filename = `markdown-${new Date().toISOString().split('T')[0]}.md`
    fileUtils.downloadFile(content, filename, 'text/markdown')
    // 成功通知
  } catch (error) {
    console.error('Export failed:', error)
    // 错误通知
  }
}

const exportHtml = () => {
  try {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Markdown Export</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1, h2, h3 { color: #333; }
    code { background: #f4f4f4; padding: 2px 4px; border-radius: 3px; }
    pre { background: #f4f4f4; padding: 10px; border-radius: 5px; overflow-x: auto; }
    blockquote { border-left: 4px solid #ddd; margin: 0; padding-left: 20px; color: #666; }
  </style>
</head>
<body>
${previewHtml.value}
</body>
</html>`
    const filename = `markdown-${new Date().toISOString().split('T')[0]}.html`
    fileUtils.downloadFile(html, filename, 'text/html')
  } catch (error) {
    console.error('Export HTML failed:', error)
  }
}

const importMarkdown = () => {
  fileInputRef.value?.click()
}

const handleFileImport = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  try {
    const content = await fileUtils.readFileAsText(file)
    markdownStore.importMarkdown(content)
    // 成功通知
  } catch (error) {
    console.error('Import failed:', error)
    // 错误通知
  } finally {
    // 清空文件输入
    event.target.value = ''
  }
}

// 处理文本选择
const handleTextSelection = () => {
  const textarea = textareaRef.value
  if (!textarea) return

  const start = textarea.selectionStart
  const end = textarea.selectionEnd

  if (start !== end) {
    textSelection.value = { start, end }
    showFloatingToolbar.value = true
  } else {
    showFloatingToolbar.value = false
    textSelection.value = null
  }
}

// 处理浮动工具栏格式化
const handleFloatingFormat = ({ start, end, text, cursorOffset }) => {
  const textarea = textareaRef.value
  if (!textarea) return

  const newContent = 
    markdownStore.content.substring(0, start) + 
    text + 
    markdownStore.content.substring(end)
  
  markdownStore.updateContent(newContent)

  nextTick(() => {
    textarea.focus()
    const newCursorPos = start + cursorOffset
    textarea.setSelectionRange(newCursorPos, newCursorPos + (end - start))
    showFloatingToolbar.value = false
  })
}

// 处理复制
const handleCopy = (text) => {
  console.log('Copied:', text)
  showFloatingToolbar.value = false
}

// 滚动到标题
const scrollToHeading = (heading) => {
  const textarea = textareaRef.value
  if (!textarea) return

  const lines = markdownStore.content.split('\n')
  let charCount = 0
  
  for (let i = 0; i < heading.lineIndex; i++) {
    charCount += lines[i].length + 1 // +1 for newline
  }

  textarea.focus()
  textarea.setSelectionRange(charCount, charCount)
  
  // 滚动到视图
  const lineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 24
  textarea.scrollTop = heading.lineIndex * lineHeight - 100
}

const clearContent = () => {
  if (markdownStore.content && !confirm('确定要清空所有内容吗？此操作不可撤销。')) {
    return
  }
  
  markdownStore.clearContent()
}

const toggleToc = () => {
  showToc.value = !showToc.value
}

const toggleSettings = () => {
  showSettings.value = !showSettings.value
}

// New functions for export and history
const openHistory = () => {
    markdownStore.loadSnapshots()
    showHistoryModal.value = true
}

const handleExport = (type) => {
    if(type === 'md') {
        exportMarkdown()
    } else if (type === 'html') {
        exportHtml()
    } else if (type === 'pdf') {
        // Use browser native print which allows Save as PDF
        window.print()
    } else if (type === 'doc') {
        // Export as minimalist Word doc (MHTML/HTML method)
        const contentHtml = markdownStore.convertToHtml(markdownStore.content)
        const preHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Export HTML to Word Document with JavaScript</title></head><body>`
        const postHtml = "</body></html>"
        const html = preHtml + contentHtml + postHtml

        const blob = new Blob(['\ufeff', html], {
            type: 'application/msword'
        })
        
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${markdownStore.documentTitle || 'document'}.doc`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }
    showExportMenu.value = false
}

const restoreSnapshot = (snap) => {
    if(confirm('恢复此历史版本将覆盖当前内容，是否继续？')) {
        markdownStore.restoreSnapshot(snap)
        showHistoryModal.value = false
    }
}

// 监听设置变化
watch(fontSize, (newSize) => {
  if (textareaRef.value) {
    textareaRef.value.style.fontSize = `${newSize}px`
  }
})

watch(wordWrap, (wrap) => {
  if (textareaRef.value) {
    textareaRef.value.style.whiteSpace = wrap ? 'pre-wrap' : 'pre'
  }
})

// 监听预览内容变化，强制应用代码块阴影
watch(previewHtml, () => {
  nextTick(() => {
    applyCodeBlockStyles()
  })
})

// 强制应用代码块阴影样式的函数
const applyCodeBlockStyles = () => {
  if (!previewRef.value) return
  
  const codeBlocks = previewRef.value.querySelectorAll('pre')
  codeBlocks.forEach(block => {
    // 强制应用阴影样式
    block.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)'
    block.style.border = '1px solid rgba(0, 0, 0, 0.1)'
    
    // 根据当前主题应用特定的阴影
    const currentTheme = markdownStore.currentTheme
    switch(currentTheme) {
      case 'github':
        block.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.05)'
        break
      case 'material':
        block.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2), 0 2px 4px rgba(0, 0, 0, 0.1)'
        break
      case 'dracula':
        block.style.boxShadow = '0 4px 12px rgba(68, 71, 90, 0.4), 0 2px 4px rgba(0, 0, 0, 0.2)'
        break
      case 'solarized':
        block.style.boxShadow = '0 4px 12px rgba(0, 43, 54, 0.6), 0 2px 4px rgba(0, 0, 0, 0.3)'
        break
      case 'nord':
        block.style.boxShadow = '0 4px 12px rgba(59, 66, 82, 0.4), 0 2px 4px rgba(0, 0, 0, 0.2)'
        break
      case 'monokai':
        block.style.boxShadow = '0 4px 12px rgba(73, 72, 62, 0.4), 0 2px 4px rgba(0, 0, 0, 0.3)'
        break
      case 'minimal':
        block.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.05)'
        break
      case 'academic':
        block.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)'
        break
      default:
        block.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)'
    }
  })
  
  // 也为行内代码添加轻微阴影
  const inlineCodes = previewRef.value.querySelectorAll('code:not(pre code)')
  inlineCodes.forEach(code => {
    code.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)'
  })
}
</script>

<style scoped>
.markdown-editor {
  position: absolute; inset: 0; z-index: 50;
  display: flex; flex-direction: column;
  background: var(--color-background);
  font-family: 'Inter', system-ui, sans-serif;
}
.markdown-editor.fullscreen {
  position: fixed; z-index: 9999;
}

/* Modern Header */
.modern-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 20px;
  background: var(--color-background);
  border-bottom: 1px solid transparent; 
  flex-shrink: 0;
}

.header-left, .header-actions {
  display: flex; align-items: center; gap: 12px;
}

.icon-btn-ghost {
  display: flex; align-items: center; justify-content: center;
  width: 36px; height: 36px;
  border-radius: 8px;
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}
.icon-btn-ghost:hover { background: var(--color-background-tertiary); color: var(--color-text-primary); }
.icon-btn-ghost.active {
  background: var(--color-primary);
  color: white;
}

.view-switcher {
  display: flex; background: var(--color-background-secondary);
  padding: 3px; border-radius: 8px;
  gap: 2px;
}
.switch-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 12px;
  border: none; background: transparent;
  font-size: 13px; color: var(--color-text-tertiary);
  border-radius: 6px; cursor: pointer;
  font-weight: 500;
}
.switch-btn.active {
  background: var(--color-background);
  color: var(--color-text-primary);
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.theme-selector {
  position: relative;
  display: flex;
  align-items: center;
}

.theme-select {
  appearance: none;
  background: var(--color-background-secondary);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 6px 32px 6px 12px;
  font-size: 13px;
  color: var(--color-text-primary);
  cursor: pointer;
  min-width: 120px;
}

.theme-select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(var(--color-primary-rgb), 0.1);
}

.theme-icon {
  position: absolute;
  right: 8px;
  color: var(--color-text-secondary);
  pointer-events: none;
}

.save-status { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--color-text-tertiary); }
.unsaved-dot { width: 6px; height: 6px; background: var(--color-warning); border-radius: 50%; }

.btn-save-primary {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 16px;
  background: var(--color-primary);
  color: white; border: none; border-radius: 8px;
  font-size: 13px; font-weight: 600; cursor: pointer;
  transition: all 0.2s;
}
.btn-save-primary:hover:not(:disabled) { filter: brightness(1.1); transform: translateY(-1px); }
.btn-save-primary:disabled { opacity: 0.5; cursor: not-allowed; }

/* Meta & Toolbar */
.meta-area {
  padding: 0 24px 16px;
  display: flex; flex-direction: column; gap: 12px;
  flex-shrink: 0;
  border-bottom: 1px solid var(--color-border);
}

.title-input-large {
  width: 100%;
  font-size: 24px; font-weight: 700;
  color: var(--color-text-primary);
  background: transparent; border: none;
  padding: 8px 0; outline: none;
}
.title-input-large::placeholder { opacity: 0.4; }

.sleek-toolbar {
  display: flex; align-items: center; gap: 4px;
  overflow-x: auto;
}
.toolbar-group { display: flex; align-items: center; gap: 2px; }
.toolbar-group.right { margin-left: auto; }
.spacer { flex: 1; }

.tool-btn {
  display: flex; align-items: center; justify-content: center;
  height: 32px; min-width: 32px; padding: 0 8px;
  border-radius: 6px; border: none; background: transparent;
  color: var(--color-text-secondary);
  font-size: 13px; font-family: monospace;
  cursor: pointer; transition: all 0.15s;
}
.tool-btn:hover { background: var(--color-background-secondary); color: var(--color-text-primary); }
.tool-btn.danger:hover { background: rgba(var(--color-error), 0.1); color: var(--color-error); }

.divider-vertical.small {
  width: 1px; height: 16px; background: var(--color-border);
  margin: 0 8px;
}

/* Editor Body */
.editor-body {
  flex: 1; position: relative;
  display: flex; overflow: hidden;
  background: var(--color-background-secondary);
}
.pane {
  flex: 1; display: flex; flex-direction: column;
  height: 100%; overflow: hidden;
  background: var(--color-background);
}
.editor-pane { position: relative; }
.preview-pane {
  border-left: 1px solid var(--color-border);
  padding: 32px 48px;
  overflow-y: auto;
}

/* 为每个主题设置预览面板背景 */
.preview-pane:has(.markdown-preview.theme-github) { background: #ffffff !important; }
.preview-pane:has(.markdown-preview.theme-material) { background: #fafafa !important; }
.preview-pane:has(.markdown-preview.theme-dracula) { background: #282a36 !important; }
.preview-pane:has(.markdown-preview.theme-solarized) { background: #fdf6e3 !important; }
.preview-pane:has(.markdown-preview.theme-nord) { background: #2e3440 !important; }
.preview-pane:has(.markdown-preview.theme-monokai) { background: #272822 !important; }
.preview-pane:has(.markdown-preview.theme-minimal) { background: #fff !important; }
.preview-pane:has(.markdown-preview.theme-academic) { background: #fff !important; }

/* 备用方案：直接设置主题背景 */
.preview-pane .markdown-preview.theme-github { background: #ffffff !important; }
.preview-pane .markdown-preview.theme-material { background: #fafafa !important; }
.preview-pane .markdown-preview.theme-dracula { background: #282a36 !important; }
.preview-pane .markdown-preview.theme-solarized { background: #fdf6e3 !important; }
.preview-pane .markdown-preview.theme-nord { background: #2e3440 !important; }
.preview-pane .markdown-preview.theme-monokai { background: #272822 !important; }
.preview-pane .markdown-preview.theme-minimal { background: #fff !important; }
.preview-pane .markdown-preview.theme-academic { background: #fff !important; }
.mode-split .pane { width: 50%; }

.line-numbers {
  position: absolute; left: 0; top: 0; bottom: 0;
  width: 48px;
  background: var(--color-background);
  border-right: 1px solid var(--color-border-secondary);
  padding-top: 24px;
  text-align: right; 
  z-index: 10;
  pointer-events: none;
}
.line-number {
  font-family: 'JetBrains Mono', monospace; font-size: 14px; line-height: 1.6;
  color: var(--color-text-tertiary); opacity: 0.5; padding-right: 12px;
}
.line-number.active { color: var(--color-text-primary); opacity: 1; }

.main-textarea {
  width: 100%; height: 100%;
  padding: 24px 24px 24px 60px; /* Left padding for line numbers */
  border: none; outline: none; resize: none;
  background: var(--color-background);
  color: var(--color-text-primary);
  font-family: 'JetBrains Mono', monospace;
  font-size: 15px; line-height: 1.6;
}

/* Preview Styles (Typo) */
.markdown-preview {
  max-width: 800px; margin: 0 auto;
  font-family: -apple-system, sans-serif;
  font-size: 16px; line-height: 1.7;
  color: var(--color-text-primary);
}

/* 代码高亮基础样式 */
.markdown-preview pre {
  position: relative;
  overflow-x: auto;
  border-radius: 8px;
  margin: 16px 0;
  background: var(--color-code-block-background);
  /* 强制应用阴影效果 */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1) !important;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.markdown-preview pre code {
  display: block;
  padding: 16px;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 14px;
  line-height: 1.5;
}

.markdown-preview code:not(pre code) {
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.9em;
  background: var(--color-code-background);
  /* 行内代码也添加轻微阴影 */
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
}

/* 空状态样式 */
.empty-placeholder {
  color: var(--color-text-tertiary);
  font-style: italic;
  text-align: center;
  padding: 2em;
}

.error {
  color: var(--color-error);
  background: rgba(var(--color-error-rgb), 0.1);
  padding: 1em;
  border-radius: 4px;
  border-left: 4px solid var(--color-error);
}

/* GitHub Theme */
.markdown-preview.theme-github {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif;
  color: #24292f !important;
  background: #ffffff !important;
}
.markdown-preview.theme-github h1, .markdown-preview.theme-github h2 { 
  border-bottom: 1px solid #d0d7de; 
  padding-bottom: 0.3em; 
  margin-top: 24px; 
  color: #24292f !important;
}
.markdown-preview.theme-github h1 { font-size: 2em; font-weight: 600; }
.markdown-preview.theme-github h2 { font-size: 1.5em; font-weight: 600; }
.markdown-preview.theme-github h3 { font-size: 1.25em; font-weight: 600; color: #24292f !important; }
.markdown-preview.theme-github p { margin: 16px 0; color: #24292f !important; }
.markdown-preview.theme-github code { 
  background: rgba(175,184,193,0.2) !important; 
  color: #24292f !important;
  padding: 2px 6px; 
  border-radius: 6px; 
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace; 
  font-size: 85%; 
}
.markdown-preview.theme-github pre { 
  background: #f6f8fa !important; 
  color: #24292f !important;
  padding: 16px; 
  border-radius: 6px; 
  overflow-x: auto; 
  border: 1px solid #d0d7de;
  /* GitHub 主题阴影效果 */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.05) !important;
}
.markdown-preview.theme-github pre code { background: none !important; padding: 0; color: #24292f !important; }
.markdown-preview.theme-github blockquote { 
  border-left: 4px solid #d0d7de; 
  margin: 0; 
  padding-left: 16px; 
  color: #656d76 !important; 
}
.markdown-preview.theme-github table { border-collapse: collapse; width: 100%; margin: 16px 0; }
.markdown-preview.theme-github th, .markdown-preview.theme-github td { 
  border: 1px solid #d0d7de; 
  padding: 6px 13px; 
  color: #24292f !important;
}
.markdown-preview.theme-github th { background: #f6f8fa !important; font-weight: 600; }
.markdown-preview.theme-github tr:nth-child(2n) { background: #f6f8fa !important; }

/* Material Theme */
.markdown-preview.theme-material {
  font-family: 'Roboto', -apple-system, sans-serif;
  color: #212121 !important;
  background: #fafafa !important;
}
.markdown-preview.theme-material h1, .markdown-preview.theme-material h2 { 
  color: #1976d2 !important; 
  font-weight: 500;
  margin-top: 32px;
}
.markdown-preview.theme-material h1 { font-size: 2.125rem; }
.markdown-preview.theme-material h2 { font-size: 1.5rem; }
.markdown-preview.theme-material h3 { font-size: 1.25rem; color: #1976d2 !important; font-weight: 500; }
.markdown-preview.theme-material p { color: #212121 !important; }
.markdown-preview.theme-material code { 
  background: #e8f5e8 !important; 
  color: #2e7d32 !important; 
  padding: 2px 6px; 
  border-radius: 4px; 
  font-family: 'Roboto Mono', monospace; 
}
.markdown-preview.theme-material pre { 
  background: #263238 !important; 
  color: #eeffff !important; 
  padding: 16px; 
  border-radius: 4px; 
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2), 0 2px 4px rgba(0, 0, 0, 0.1) !important;
}
.markdown-preview.theme-material pre code { background: none !important; color: #eeffff !important; padding: 0; }
.markdown-preview.theme-material blockquote { 
  border-left: 4px solid #1976d2; 
  background: #e3f2fd !important; 
  color: #212121 !important;
  margin: 16px 0; 
  padding: 16px; 
  border-radius: 0 4px 4px 0;
}

/* Dracula Theme */
.markdown-preview.theme-dracula {
  font-family: 'Fira Code', monospace;
  color: #f8f8f2 !important;
  background: #282a36 !important;
}
.markdown-preview.theme-dracula h1, .markdown-preview.theme-dracula h2 { 
  color: #bd93f9 !important; 
  border-bottom: 1px solid #44475a;
}
.markdown-preview.theme-dracula h3 { color: #8be9fd !important; }
.markdown-preview.theme-dracula p { color: #f8f8f2 !important; }
.markdown-preview.theme-dracula code { 
  background: #44475a !important; 
  color: #50fa7b !important; 
  padding: 2px 6px; 
  border-radius: 4px; 
}
.markdown-preview.theme-dracula pre { 
  background: #44475a !important; 
  color: #f8f8f2 !important;
  padding: 16px; 
  border-radius: 8px; 
  border: 1px solid #6272a4;
  /* Dracula 主题阴影效果 */
  box-shadow: 0 4px 12px rgba(68, 71, 90, 0.4), 0 2px 4px rgba(0, 0, 0, 0.2) !important;
}
.markdown-preview.theme-dracula pre code { background: none !important; color: #f8f8f2 !important; }
.markdown-preview.theme-dracula blockquote { 
  border-left: 4px solid #ffb86c; 
  color: #f1fa8c !important; 
  background: rgba(255, 184, 108, 0.1) !important;
  padding: 16px;
  border-radius: 0 4px 4px 0;
}

/* Solarized Theme */
.markdown-preview.theme-solarized {
  font-family: 'Source Code Pro', monospace;
  color: #657b83 !important;
  background: #fdf6e3 !important;
}
.markdown-preview.theme-solarized h1, .markdown-preview.theme-solarized h2 { 
  color: #b58900 !important; 
  border-bottom: 1px solid #eee8d5;
}
.markdown-preview.theme-solarized h3 { color: #cb4b16 !important; }
.markdown-preview.theme-solarized p { color: #657b83 !important; }
.markdown-preview.theme-solarized code { 
  background: #eee8d5 !important; 
  color: #dc322f !important; 
  padding: 2px 6px; 
  border-radius: 3px; 
}
.markdown-preview.theme-solarized pre { 
  background: #002b36 !important; 
  color: #839496 !important; 
  padding: 16px; 
  border-radius: 6px; 
  /* Solarized 主题阴影效果 */
  box-shadow: 0 4px 12px rgba(0, 43, 54, 0.6), 0 2px 4px rgba(0, 0, 0, 0.3) !important;
}
.markdown-preview.theme-solarized pre code { background: none !important; color: #839496 !important; }
.markdown-preview.theme-solarized blockquote { 
  border-left: 4px solid #268bd2; 
  color: #586e75 !important; 
  background: rgba(38, 139, 210, 0.05) !important;
}

/* Nord Theme */
.markdown-preview.theme-nord {
  font-family: 'Inter', sans-serif;
  color: #d8dee9 !important;
  background: #2e3440 !important;
}
.markdown-preview.theme-nord h1, .markdown-preview.theme-nord h2 { 
  color: #88c0d0 !important; 
  border-bottom: 1px solid #4c566a;
}
.markdown-preview.theme-nord h3 { color: #81a1c1 !important; }
.markdown-preview.theme-nord p { color: #d8dee9 !important; }
.markdown-preview.theme-nord code { 
  background: #3b4252 !important; 
  color: #a3be8c !important; 
  padding: 2px 6px; 
  border-radius: 4px; 
}
.markdown-preview.theme-nord pre { 
  background: #3b4252 !important; 
  color: #d8dee9 !important;
  padding: 16px; 
  border-radius: 8px; 
  border: 1px solid #4c566a;
  /* Nord 主题阴影效果 */
  box-shadow: 0 4px 12px rgba(59, 66, 82, 0.4), 0 2px 4px rgba(0, 0, 0, 0.2) !important;
}
.markdown-preview.theme-nord pre code { background: none !important; color: #d8dee9 !important; }
.markdown-preview.theme-nord blockquote { 
  border-left: 4px solid #5e81ac; 
  color: #e5e9f0 !important; 
  background: rgba(94, 129, 172, 0.1) !important;
}

/* Monokai Theme */
.markdown-preview.theme-monokai {
  font-family: 'Monaco', 'Menlo', monospace;
  color: #f8f8f2 !important;
  background: #272822 !important;
}
.markdown-preview.theme-monokai h1, .markdown-preview.theme-monokai h2 { 
  color: #a6e22e !important; 
  border-bottom: 1px solid #49483e;
}
.markdown-preview.theme-monokai h3 { color: #66d9ef !important; }
.markdown-preview.theme-monokai p { color: #f8f8f2 !important; }
.markdown-preview.theme-monokai code { 
  background: #49483e !important; 
  color: #e6db74 !important; 
  padding: 2px 6px; 
  border-radius: 3px; 
}
.markdown-preview.theme-monokai pre { 
  background: #49483e !important; 
  color: #f8f8f2 !important;
  padding: 16px; 
  border-radius: 6px; 
  /* Monokai 主题阴影效果 */
  box-shadow: 0 4px 12px rgba(73, 72, 62, 0.4), 0 2px 4px rgba(0, 0, 0, 0.3) !important;
}
.markdown-preview.theme-monokai pre code { background: none !important; color: #f8f8f2 !important; }
.markdown-preview.theme-monokai blockquote { 
  border-left: 4px solid #f92672; 
  color: #f8f8f2 !important; 
  background: rgba(249, 38, 114, 0.1) !important;
}

/* Minimal Theme */
.markdown-preview.theme-minimal {
  font-family: 'Georgia', serif;
  color: #333 !important;
  background: #fff !important;
  max-width: 680px;
}
.markdown-preview.theme-minimal h1, .markdown-preview.theme-minimal h2 { 
  color: #000 !important; 
  font-weight: 400;
  border: none;
  margin-top: 2em;
}
.markdown-preview.theme-minimal h1 { font-size: 1.8em; }
.markdown-preview.theme-minimal h2 { font-size: 1.4em; }
.markdown-preview.theme-minimal h3 { font-size: 1.2em; color: #666 !important; font-weight: 400; }
.markdown-preview.theme-minimal p { margin: 1.5em 0; color: #333 !important; }
.markdown-preview.theme-minimal code { 
  background: #f0f0f0 !important; 
  color: #d14 !important; 
  padding: 2px 5px; 
  border-radius: 3px; 
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
  border: 1px solid #e0e0e0;
}
.markdown-preview.theme-minimal pre { 
  background: #f4f4f4 !important; 
  color: #333 !important;
  padding: 1.2em; 
  border-left: 4px solid #ddd; 
  background-image: linear-gradient(to right, #f4f4f4 0%, #f4f4f4 100%);
  margin: 1.5em 0;
  /* Minimal 主题阴影效果 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.05) !important;
}
.markdown-preview.theme-minimal pre code { background: none !important; color: #333 !important; }
.markdown-preview.theme-minimal blockquote { 
  border-left: 3px solid #ddd; 
  color: #666 !important; 
  font-style: italic;
  margin: 1.5em 0;
  padding-left: 1em;
}

/* Academic Theme */
.markdown-preview.theme-academic {
  font-family: 'Times New Roman', serif;
  color: #000 !important;
  background: #fff !important;
  max-width: 720px;
  line-height: 1.8;
}
.markdown-preview.theme-academic h1, .markdown-preview.theme-academic h2 { 
  color: #000 !important; 
  font-weight: bold;
  text-align: center;
  border: none;
  margin: 2em 0 1em;
}
.markdown-preview.theme-academic h1 { font-size: 1.6em; }
.markdown-preview.theme-academic h2 { font-size: 1.3em; }
.markdown-preview.theme-academic h3 { 
  font-size: 1.1em; 
  color: #000 !important; 
  font-weight: bold; 
  margin: 1.5em 0 0.5em;
}
.markdown-preview.theme-academic p { 
  margin: 1em 0; 
  text-align: justify; 
  text-indent: 2em;
  color: #000 !important;
}
.markdown-preview.theme-academic code { 
  background: #e1e4e8 !important; 
  color: #24292e !important; 
  padding: 2px 4px; 
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 0.9em;
  border-radius: 3px;
}
.markdown-preview.theme-academic pre { 
  background: #f1f3f5 !important; 
  color: #24292e !important;
  padding: 1.2em; 
  border: 1px solid #e1e4e8; 
  margin: 1.5em 0;
  font-size: 0.9em;
  border-radius: 6px;
  /* Academic 主题阴影效果 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04) !important;
}
.markdown-preview.theme-academic pre code { background: none !important; color: #000 !important; }
.markdown-preview.theme-academic blockquote { 
  border-left: none; 
  color: #000 !important; 
  font-style: italic;
  margin: 1em 2em;
  text-align: center;
}
.markdown-preview.theme-academic table { 
  margin: 1.5em auto; 
  font-size: 0.9em;
}
.markdown-preview.theme-academic th { 
  background: #f0f0f0 !important; 
  font-weight: bold; 
  text-align: center;
  color: #000 !important;
}
.markdown-preview.theme-academic td { 
  color: #000 !important;
}

/* Common theme styles */
.markdown-preview h1, .markdown-preview h2 { border-bottom: 1px solid var(--color-border); padding-bottom: 0.3em; margin-top: 24px; }
.markdown-preview h1 { font-size: 2em; }
.markdown-preview h2 { font-size: 1.5em; }
.markdown-preview p { margin: 1em 0; }
.markdown-preview code { background: var(--color-code-background); padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 0.9em; }
.markdown-preview pre { 
  background: var(--color-code-block-background); 
  padding: 16px; 
  border-radius: 8px; 
  overflow-x: auto; 
  /* 确保所有代码块都有阴影效果 */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1) !important;
}
.markdown-preview pre code { background: none; padding: 0; }
.markdown-preview blockquote { border-left: 4px solid var(--color-primary); margin: 0; padding-left: 16px; color: var(--color-text-secondary); font-style: italic; }
.markdown-preview img { max-width: 100%; border-radius: 8px; }
.markdown-preview ul, .markdown-preview ol { padding-left: 2em; }
.markdown-preview table { border-collapse: collapse; width: 100%; margin: 1em 0; }
.markdown-preview th, .markdown-preview td { border: 1px solid var(--color-border); padding: 6px 13px; }
.markdown-preview tr:nth-child(2n) { background-color: var(--color-background-secondary); }

/* Floating Status */
.floating-status {
  position: absolute; bottom: 20px; right: 24px;
  display: flex; align-items: center; gap: 12px;
  padding: 6px 16px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  font-size: 11px; color: var(--color-text-secondary);
  z-index: 100;
  pointer-events: none; /* Let clicks pass */
}
.status-item { display: flex; align-items: center; gap: 6px; }
.label { color: var(--color-text-tertiary); }
.value { font-family: monospace; font-weight: 600; color: var(--color-text-primary); }
.divider-dot { width: 3px; height: 3px; background: var(--color-text-tertiary); border-radius: 50%; opacity: 0.5; }
</style>

<style scoped>
/* Export Menu & History Modal Styles */
.export-menu {
  position: absolute;
  top: 60px;
  right: 120px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  padding: 8px;
  z-index: 1000;
  min-width: 180px;
}
.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  text-align: left;
  background: none;
  border: none;
  color: var(--color-text-primary);
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}
.menu-item:hover {
  background: var(--color-background-secondary);
}

.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 2000;
  display: flex; align-items: center; justify-content: center;
}
.modal-content.history-modal {
  width: 500px;
  max-height: 80vh;
  background: var(--color-background);
  border-radius: 12px;
  display: flex; flex-direction: column;
  box-shadow: 0 20px 50px rgba(0,0,0,0.3);
}
.history-modal .modal-header {
  padding: 16px 20px; border-bottom: 1px solid var(--color-border);
  display: flex; justify-content: space-between; align-items: center;
  color: var(--color-text-primary); 
}
.history-modal .modal-header h3 {
    font-size: 16px;
    font-weight: 600;
    display: flex; align-items: center; gap: 8px;
    margin: 0;
}
.history-modal .modal-body {
  padding: 0; overflow-y: auto; flex: 1;
}
.history-modal .close-btn {
    background: none; border: none; cursor: pointer; color: var(--color-text-tertiary);
    padding: 4px; border-radius: 4px;
}
.history-modal .close-btn:hover { background: var(--color-background-secondary); color: var(--color-text-primary); }

.empty-state {
  padding: 40px; text-align: center; color: var(--color-text-tertiary);
  display: flex; flex-direction: column; align-items: center; gap: 16px;
}
.history-list {
  display: flex; flex-direction: column;
}
.history-item {
  padding: 12px 20px;
  border-bottom: 1px solid var(--color-border);
  cursor: pointer;
  display: flex; justify-content: space-between; align-items: center;
  transition: background 0.2s;
}
.history-item:hover {
  background: var(--color-background-secondary);
}
.history-info {
  display: flex; flex-direction: column; gap: 4px;
}
.history-time { font-size: 12px; color: var(--color-text-tertiary); }
.history-title { font-weight: 600; font-size: 14px; color: var(--color-text-primary); }
.history-summary { font-size: 12px; color: var(--color-text-secondary); opacity: 0.8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 300px; }
.restore-btn {
  padding: 4px 10px; border-radius: 4px;
  background: var(--color-primary); color: white;
  border: none; font-size: 12px; opacity: 0; transition: opacity 0.2s; cursor: pointer;
}
.history-item:hover .restore-btn { opacity: 1; }
</style>

<style>
@media print {
  /* Global reset for print */
  @page {
    margin: 2cm;
    size: auto;
  }

  /* Hide UI elements rigorously */
  body > *:not(.markdown-editor),
  .modern-header,
  .meta-area,
  .floating-status,
  .pane.editor-pane,
  .dropdown-menu,
  .modal-overlay,
  .loading-overlay,
  .icon-btn-ghost,
  .btn-save-primary,
  .sidebar,
  .app-sidebar, 
  .title-bar,
  .view-switcher,
  .theme-selector,
  .header-actions {
    display: none !important;
  }

  /* Reset layout constraints */
  html, body, #app, .markdown-editor, .editor-body {
    height: auto !important;
    overflow: visible !important;
    position: static !important;
    background: white !important;
    width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  /* Force preview visibility and layout */
  .pane.preview-pane {
    display: block !important;
    position: static !important;
    width: 100% !important;
    height: auto !important;
    overflow: visible !important;
    background: white !important;
    padding: 0 !important;
    margin: 0 !important;
  }

  .markdown-preview {
    width: 100% !important;
    max-width: 100% !important;
    padding: 0 !important;
    border: none !important;
    box-shadow: none !important;
    background: white !important;
    color: black !important;
    font-size: 12pt !important;
    line-height: 1.6;
  }

  /* Typography for print */
  :deep(h1), :deep(h2), :deep(h3) {
    page-break-after: avoid;
    break-after: avoid;
    color: #000 !important;
  }

  :deep(pre), :deep(blockquote) {
    page-break-inside: avoid;
    border: 1px solid #ddd !important;
  }

  :deep(a) {
    text-decoration: underline;
    color: #000 !important;
  }

  :deep(img) {
    max-width: 100% !important;
    page-break-inside: avoid;
  }
}
</style>
