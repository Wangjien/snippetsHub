/**
 * SnippetsHub - 专业代码片段管理工具
 * 
 * @file CodeEditor.vue - 代码编辑器组件
 * @author Noah
 * @description 基于Monaco Editor的专业代码编辑器，支持40+种编程语言
 * @created 2026-01-25
 * @modified 2026-01-29
 * @version 1.0.0
 * 
 * 功能特性:
 * - Monaco Editor集成
 * - 40+种编程语言支持
 * - 智能补全和代码片段
 * - 语法高亮和错误检测
 * - 代码格式化和美化
 * - 多光标编辑和快捷键
 * - 标签管理和元数据编辑
 * - 实时预览和保存功能
 */

<template>
  <div class="code-editor" :class="{ 'fullscreen': isFullscreen }">


    <!-- Header: Clean & Modern -->
    <header class="modern-header" v-if="activeTab">
       <div class="header-left">
           <button @click="toggleDiff" class="icon-btn-ghost" :class="{ active: editorStore.isDiffView }" title="对比更改">
             <GitCompare :size="18" />
             <span class="btn-label">对比</span>
           </button>
           
           <div class="divider-vertical"></div>
           
           <button 
             @click="runCode" 
             class="icon-btn-ghost run-btn" 
             :class="{ 'is-running': isRunning }"
             :disabled="isRunning || !canRun"
             title="运行代码 (Cmd+R)"
           >
             <Play :size="16" :class="{ 'fill-current': !isRunning }" />
             <span class="btn-label">{{ isRunning ? '运行中...' : '运行' }}</span>
           </button>
       </div>
       
       <div class="header-actions">
          <span class="save-status" v-if="activeTab.isDirty">
            <div class="unsaved-dot"></div>
            未保存
          </span>
          <button @click="toggleTerminal" class="icon-btn-ghost" :class="{ active: showOutput }" title="显示/隐藏终端">
             <SquareTerminal :size="20" />
          </button>
          <button @click="toggleFullscreen" class="icon-btn-ghost" :title="isFullscreen ? '退出全屏' : '全屏 (F11)'">
             <component :is="isFullscreen ? Minimize2 : Maximize2" :size="20" />
          </button>
          <button @click="generateImage" class="icon-btn-ghost" title="生成代码图片">
             <ImageIcon :size="20" />
          </button>
          <button @click="saveSnippet" class="btn-save-primary" :disabled="!isValid">
             <Save :size="16" />
             <span>保存</span>
          </button>
       </div>
    </header>

    <div class="empty-state" v-if="!activeTab">
        <div class="empty-content">
            <Code2 :size="64" class="empty-icon"/>
            <h3>没有打开的文件</h3>
            <p>选择一个代码片段开始编辑，或按下 Cmd+N 新建</p>
        </div>
    </div>
    
    <!-- Meta Area (Hidden in Fullscreen) -->
    <div class="meta-area" v-if="!isFullscreen && activeTab">
       <!-- Title: Big & Bold -->
       <input 
          v-model="activeTab.title" 
          placeholder="无标题片段..." 
          class="title-input-large" 
          @keydown.enter="$refs.editorContainer.focus()"
       />
       
       <!-- Tags & Metadata Row -->
       <div class="meta-row">
          <div class="meta-item">
             <Code2 :size="16" />
             <select v-model="activeTab.language" class="meta-select" @change="updateLanguage">
                <option v-for="lang in LANGUAGES" :key="lang" :value="lang">
                   {{ lang }}
                </option>
             </select>
          </div>
          
          <div class="meta-item">
             <Tag :size="16" />
             <input 
                v-model="tagInput" 
                placeholder="添加标签 (回车)..." 
                class="meta-input"
                @keydown.enter="addTag"
             />
          </div>

          <div class="tags-list">
             <span v-for="tag in activeTab.tags" :key="tag" class="tag-pill">
                {{ tag }}
                <button @click="removeTag(tag)" class="tag-remove"><X :size="12" /></button>
             </span>
          </div>
       </div>
    </div>

    <!-- Main Content Area -->
    <div class="content-split" v-if="activeTab">
       <!-- Code Area -->
       <div class="editor-pane">
         <div class="pane-header">
            <span class="pane-title">
                <FileCode :size="16" /> 
                {{ editorStore.isDiffView ? '更改对比 (左: 原版 | 右: 当前)' : '代码' }}
            </span>
            <div class="pane-actions">
              <button @click="formatCode" class="action-btn" title="格式化代码">
                <LayoutTemplate :size="14" />
              </button>
               <button @click="copyCode" class="action-btn" title="复制代码">
                 <Copy :size="14" />
               </button>
            </div>
         </div>
         <div class="monaco-container" ref="editorContainer"></div>
         
         <!-- Terminal / Output Panel -->
         <div class="terminal-pane" v-show="showOutput" :style="{ height: terminalHeight + 'px' }">
            <div class="terminal-header" @mousedown="startResize">
                <div class="terminal-title">
                    <SquareTerminal :size="14" />
                    <span>终端输出</span>
                </div>
                <div class="terminal-actions">
                    <button @click="clearOutput" class="action-btn" title="清空"><Trash2 :size="14" /></button>
                    <button @click="showOutput = false" class="action-btn" title="关闭"><X :size="14" /></button>
                </div>
            </div>
            <div class="terminal-content" ref="terminalContentRef">
                <pre v-if="executionOutput">{{ executionOutput }}</pre>
                <div v-else class="terminal-placeholder">点击“运行”按钮查看输出...</div>
            </div>
         </div>
       </div>

       <!-- Right Sidebar (Metadata & Description) -->
       <div class="sidebar-pane" v-if="!isFullscreen && !editorStore.isDiffView">
          <!-- Description -->
          <div class="sidebar-section">
             <div class="section-label"><AlignLeft :size="14" /> 描述</div>
             <textarea 
                v-model="activeTab.description" 
                placeholder="添加描述..." 
                class="description-input"
             ></textarea>
          </div>
       </div>
    </div>
  </div>
</template>

<script setup>
/**
 * @file CodeEditor.vue
 * @description 核心代码编辑器组件
 * @author Noah
 * 
 * 集成了以下核心功能：
 * - Monaco Editor 编辑器实例管理
 * - 代码高亮与智能提示
 * - 多语言运行环境 (Code Runner)
 * - 终端输出面板
 * - 代码截图/Diff对比/VIM模式
 */
import { ref, onMounted, onBeforeUnmount, watch, computed, nextTick } from 'vue'
import { 
  Save, X, FileText, Code2, Tag, Copy, AlignLeft,
  Maximize2, Minimize2, LayoutTemplate, 
  Image as ImageIcon, GitCompare, FileCode,
  Play, SquareTerminal, Trash2
} from 'lucide-vue-next'
import html2canvas from 'html2canvas'
import { useThemeStore } from '../stores/themeStore'
import { useEditorStore } from '../stores/editorStore'

import { useGlobalNotifications } from '../composables/useNotifications'
import { useLSP } from '../services/lspService'

// Tauri APIs
import { Command } from '@tauri-apps/plugin-shell'
import { writeTextFile, BaseDirectory } from '@tauri-apps/plugin-fs'
import { appCacheDir, join } from '@tauri-apps/api/path'

import loader from '@monaco-editor/loader'
import { registerLanguageCompletions } from '../utils/languageCompletion'

const emit = defineEmits(['save', 'close'])
const themeStore = useThemeStore()
const editorStore = useEditorStore()
const { error, info } = useGlobalNotifications()
const { lspService, initialize: initializeLSP, getCompletion, getHover, formatDocument } = useLSP()

const activeTab = computed(() => editorStore.activeTab)
const tagInput = ref('')
const editorContainer = ref(null)
let editor = null
let diffEditor = null
let monaco = null
const isFullscreen = ref(false)

// LSP Integration State
const lspInitialized = ref(false)
const diagnostics = ref([])
const completionProvider = ref(null)

// Runner State
const isRunning = ref(false)
const showOutput = ref(false)
const executionOutput = ref('')
const terminalHeight = ref(200)
const terminalContentRef = ref(null)

const LANGUAGES = [
  'javascript', 'typescript', 'python', 'java', 'c', 'cpp', 'html', 'css', 
  'json', 'rust', 'go', 'php', 'ruby', 'swift', 'kotlin', 'sql', 'shell', 'markdown',
  'r', 'perl', 'bash'
]

// Map language to interpreter/command
const LANGUAGE_COMMANDS = {
    'python': { cmd: 'python3', ext: 'py' }, // or python
    'javascript': { cmd: 'node', ext: 'js' },
    'shell': { cmd: 'bash', ext: 'sh' },
    'bash': { cmd: 'bash', ext: 'sh' },
    'markdown': { cmd: 'cat', ext: 'md' } // Just echo content
}

const canRun = computed(() => {
    return activeTab.value && LANGUAGE_COMMANDS[activeTab.value.language]
})

// Validation
const isValid = computed(() => {
  return activeTab.value && activeTab.value.title.trim() && activeTab.value.content.trim()
})

onMounted(async () => {
    // Initialize LSP service
    try {
        await initializeLSP()
        lspInitialized.value = true
        info('LSP 服务已启动')
    } catch (err) {
        console.warn('LSP initialization failed:', err)
    }
    
    // Waiting for tab to be set
    if(activeTab.value) {
        await initMonaco()
    }
})

// Watch active tab change to re-init or set model
watch(() => editorStore.activeTabId, async (newId) => {
    if (newId) {
        if (!editor && !diffEditor) {
            await initMonaco()
        } else {
             updateEditorContent()
             // Clear output on switch? No, keep history or clear?
             // Maybe clear to avoid confusion.
             executionOutput.value = ''
        }
    }
})

// Watch diff view toggle
watch(() => editorStore.isDiffView, async (isDiff) => {
    if (activeTab.value) {
        // Dispose current editors
        if (editor) {
            // Save view state if possible
            const model = editor.getModel();
            editor.dispose();
            editor = null;
        }
        if (diffEditor) {
            diffEditor.dispose();
            diffEditor = null;
        }
        
        // Re-init in new mode
        await nextTick();
        await initMonaco();
    }
})

onBeforeUnmount(() => {
  if (editor) editor.dispose()
  if (diffEditor) diffEditor.dispose()
})

// Monaco Editor Initialization
const initMonaco = async () => {
  if (!editorContainer.value) return
  
  loader.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.43.0/min/vs' } })
  monaco = await loader.init()
  registerLanguageCompletions(monaco)

  const commonOptions = {
    theme: themeStore.isDark ? 'vs-dark' : 'vs',
    automaticLayout: true,
    fontSize: 14,
    fontFamily: "'Fira Code', 'JetBrains Mono', Consolas, monospace",
    fontLigatures: true,
    minimap: { enabled: true },
    scrollBeyondLastLine: false,
    lineNumbers: 'on',
    roundedSelection: true,
    padding: { top: 16, bottom: 16 },
    cursorBlinking: 'smooth',
    cursorSmoothCaretAnimation: 'on',
    smoothScrolling: true,
    formatOnPaste: true,
    formatOnType: false,
    // LSP-enhanced features
    quickSuggestions: {
      other: true,
      comments: true,
      strings: true
    },
    suggestOnTriggerCharacters: true,
    acceptSuggestionOnEnter: 'on',
    tabCompletion: 'on',
    wordBasedSuggestions: 'matchingDocuments',
    // Enhanced IntelliSense
    hover: { enabled: true },
    parameterHints: { enabled: true },
    definitionLinkOpensInPeek: false,
    gotoLocation: {
      multipleReferences: 'peek',
      multipleDefinitions: 'peek',
      multipleDeclarations: 'peek'
    }
  }

  if (editorStore.isDiffView) {
      // Init Diff Editor
      diffEditor = monaco.editor.createDiffEditor(editorContainer.value, {
          ...commonOptions,
          originalEditable: false,
          readOnly: false
      });
      
      const originalModel = monaco.editor.createModel(activeTab.value.originalContent, activeTab.value.language);
      const modifiedModel = monaco.editor.createModel(activeTab.value.content, activeTab.value.language);
      
      diffEditor.setModel({
          original: originalModel,
          modified: modifiedModel
      });
      
      modifiedModel.onDidChangeContent(() => {
         const val = modifiedModel.getValue();
         if(activeTab.value) {
             editorStore.updateTabContent(activeTab.value.id, val);
         }
      });
      
  } else {
      // Init Normal Editor
      editor = monaco.editor.create(editorContainer.value, {
        ...commonOptions,
        value: activeTab.value.content,
        language: activeTab.value.language,
      });
      
      editor.onDidChangeModelContent(() => {
        if(activeTab.value) {
            editorStore.updateTabContent(activeTab.value.id, editor.getValue());
        }
      })
      
      // Setup LSP integration
      await setupLSPIntegration()
  }
}

// LSP Integration Setup
const setupLSPIntegration = async () => {
    if (!editor || !lspInitialized.value || !activeTab.value) return
    
    const model = editor.getModel()
    if (!model) return
    
    const uri = model.uri.toString()
    const language = activeTab.value.language
    
    try {
        // Register document with LSP
        await lspService.didOpen(language, uri, activeTab.value.content)
        
        // Setup completion provider
        if (completionProvider.value) {
            completionProvider.value.dispose()
        }
        
        completionProvider.value = monaco.languages.registerCompletionItemProvider(language, {
            provideCompletionItems: async (model, position) => {
                try {
                    const completions = await getCompletion(language, uri, {
                        line: position.lineNumber - 1,
                        character: position.column - 1
                    })
                    
                    if (!completions) return { suggestions: [] }
                    
                    return {
                        suggestions: completions.map(item => ({
                            label: item.label,
                            kind: monaco.languages.CompletionItemKind[getCompletionKind(item.kind)],
                            detail: item.detail,
                            documentation: item.documentation,
                            insertText: item.insertText,
                            insertTextRules: item.insertTextFormat === 2 
                                ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet 
                                : undefined,
                            sortText: item.sortText,
                            filterText: item.filterText,
                            additionalTextEdits: item.additionalTextEdits
                        }))
                    }
                } catch (err) {
                    console.warn('LSP completion failed:', err)
                    return { suggestions: [] }
                }
            },
            triggerCharacters: ['.', ':', '<', '"', "'", '/', '@', '#']
        })
        
        // Setup hover provider
        monaco.languages.registerHoverProvider(language, {
            provideHover: async (model, position) => {
                try {
                    const hover = await getHover(language, uri, {
                        line: position.lineNumber - 1,
                        character: position.column - 1
                    })
                    
                    if (!hover) return null
                    
                    return {
                        range: hover.range ? new monaco.Range(
                            hover.range.start.line + 1,
                            hover.range.start.character + 1,
                            hover.range.end.line + 1,
                            hover.range.end.character + 1
                        ) : undefined,
                        contents: hover.contents.map(content => ({
                            value: content.value,
                            isTrusted: true
                        }))
                    }
                } catch (err) {
                    console.warn('LSP hover failed:', err)
                    return null
                }
            }
        })
        
        // Setup document formatting
        monaco.languages.registerDocumentFormattingEditProvider(language, {
            provideDocumentFormattingEdits: async (model, options) => {
                try {
                    const edits = await formatDocument(language, uri, {
                        tabSize: options.tabSize,
                        insertSpaces: options.insertSpaces
                    })
                    
                    if (!edits) return []
                    
                    return edits.map(edit => ({
                        range: new monaco.Range(
                            edit.range.start.line + 1,
                            edit.range.start.character + 1,
                            edit.range.end.line + 1,
                            edit.range.end.character + 1
                        ),
                        text: edit.newText
                    }))
                } catch (err) {
                    console.warn('LSP formatting failed:', err)
                    return []
                }
            }
        })
        
        // Listen for content changes to sync with LSP
        model.onDidChangeContent((e) => {
            const changes = e.changes.map(change => ({
                range: {
                    start: {
                        line: change.range.startLineNumber - 1,
                        character: change.range.startColumn - 1
                    },
                    end: {
                        line: change.range.endLineNumber - 1,
                        character: change.range.endColumn - 1
                    }
                },
                rangeLength: change.rangeLength,
                text: change.text
            }))
            
            lspService.didChange(language, uri, changes, model.getVersionId())
        })
        
        console.log(`LSP integration setup complete for ${language}`)
        
    } catch (err) {
        console.error('LSP integration setup failed:', err)
    }
}

// Helper function to map LSP completion kinds to Monaco kinds
const getCompletionKind = (lspKind) => {
    const kindMap = {
        1: 'Text',
        2: 'Method',
        3: 'Function',
        4: 'Constructor',
        5: 'Field',
        6: 'Variable',
        7: 'Class',
        8: 'Interface',
        9: 'Module',
        10: 'Property',
        11: 'Unit',
        12: 'Value',
        13: 'Enum',
        14: 'Keyword',
        15: 'Snippet',
        16: 'Color',
        17: 'File',
        18: 'Reference',
        19: 'Folder',
        20: 'EnumMember',
        21: 'Constant',
        22: 'Struct',
        23: 'Event',
        24: 'Operator',
        25: 'TypeParameter'
    }
    
    return kindMap[lspKind] || 'Text'
}

const updateEditorContent = () => {
    if (!activeTab.value) return;
    
    if (editorStore.isDiffView && diffEditor) {
        const originalModel = monaco.editor.createModel(activeTab.value.originalContent, activeTab.value.language);
        const modifiedModel = monaco.editor.createModel(activeTab.value.content, activeTab.value.language);
        diffEditor.setModel({ original: originalModel, modified: modifiedModel });
        
        modifiedModel.onDidChangeContent(() => {
             editorStore.updateTabContent(activeTab.value.id, modifiedModel.getValue());
        });
    } else if (editor) {
        const model = editor.getModel();
        if (model) {
            monaco.editor.setModelLanguage(model, activeTab.value.language);
            // Verify if values match to avoid cursor jump
            if (model.getValue() !== activeTab.value.content) {
                editor.setValue(activeTab.value.content);
            }
            
            // Re-setup LSP integration for new content
            setupLSPIntegration()
        }
    }
}

// Logic: Code Runner
const runCode = async () => {
    if (isRunning.value || !activeTab.value) return;
    const config = LANGUAGE_COMMANDS[activeTab.value.language];
    if (!config) {
        info('当前语言暂不支持运行');
        return;
    }
    
    isRunning.value = true;
    showOutput.value = true;
    executionOutput.value = `> 正在运行 ${activeTab.value.language}...\n\n`;
    
    await runCodeWithFile(config);
}

const runCodeWithFile = async (config) => {
     try {
        const cacheDir = await appCacheDir();
        const fileName = `runner_temp.${config.ext}`;
        const filePath = await join(cacheDir, fileName);
        
        await writeTextFile(fileName, activeTab.value.content, {
            baseDir: BaseDirectory.AppCache
        });
        
        const command = Command.create(config.cmd, [filePath]);
        
        command.on('close', data => {
            isRunning.value = false;
            executionOutput.value += `\n[已完成 (退出码: ${data.code})]`;
            scrollToBottom();
        });
        
        command.on('error', error => {
            isRunning.value = false;
            executionOutput.value += `\n[错误: ${error}]`;
            scrollToBottom();
        });
        
        command.stdout.on('data', line => {
            executionOutput.value += line + '\n';
            scrollToBottom();
        });
        
        command.stderr.on('data', line => {
            executionOutput.value += line + '\n'; 
            scrollToBottom();
        });
        
        await command.spawn();
        
     } catch (err) {
        isRunning.value = false;
        executionOutput.value += `\n[执行失败: ${err.message}]`;
     }
}





const scrollToBottom = () => {
    nextTick(() => {
        if (terminalContentRef.value) {
            terminalContentRef.value.scrollTop = terminalContentRef.value.scrollHeight;
        }
    })
}

const startResize = (e) => {
    // Implement resize logic if needed, simple version:
    const startY = e.clientY;
    const startH = terminalHeight.value;
    
    const onMove = (e) => {
        const delta = startY - e.clientY;
        terminalHeight.value = Math.max(100, Math.min(600, startH + delta));
    }
    
    const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
    }
    
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
}

const clearOutput = () => executionOutput.value = ''
const toggleTerminal = () => showOutput.value = !showOutput.value

// Actions
const saveSnippet = () => {
  if (!isValid.value) return
  emit('save', { 
      id: activeTab.value.snippetId,
      title: activeTab.value.title,
      description: activeTab.value.description,
      language: activeTab.value.language,
      code: activeTab.value.content,
      tags: [...activeTab.value.tags],
      tabId: activeTab.value.id // Pass tabId to handle post-save logic
  })
}

const toggleDiff = () => {
    editorStore.toggleDiffView()
}

const addTag = () => {
  if(!activeTab.value) return
  const tag = tagInput.value.trim()
  if (tag && !activeTab.value.tags.includes(tag)) {
    activeTab.value.tags.push(tag)
  }
  tagInput.value = ''
}

const removeTag = (tag) => {
  if(!activeTab.value) return
  activeTab.value.tags = activeTab.value.tags.filter(t => t !== tag)
}

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
  nextTick(() => {
     editor?.layout()
     diffEditor?.layout()
  })
}

// 格式化代码
const formatCode = () => {
  if (editor) {
    editor.getAction('editor.action.formatDocument')?.run()
  } else if (diffEditor) {
     diffEditor.getModifiedEditor().getAction('editor.action.formatDocument')?.run()
  }
}

const updateLanguage = () => {
    if(editor) {
        const model = editor.getModel();
        monaco.editor.setModelLanguage(model, activeTab.value.language);
    }
    // For diff editor, we'd need to recreate models or set language on both
}

// 生成代码图片
const generateImage = async () => {
  if (!editorContainer.value) return
  
  try {
    const canvas = await html2canvas(editorContainer.value, {
      backgroundColor: themeStore.isDark ? '#1e1e2e' : '#ffffff',
      scale: 2,
    })
    
    const link = document.createElement('a')
    link.download = `snippet-${activeTab.value.title || 'code'}.png`
    link.href = canvas.toDataURL()
    link.click()
    
    if (typeof window !== 'undefined' && window.showNotification) {
      window.showNotification('代码图片已生成', 'success')
    }
  } catch (err) {
    console.error('Failed to generate image:', err)
  }
}

const copyCode = async () => {
    try {
        await navigator.clipboard.writeText(activeTab.value.content)
        if (typeof window !== 'undefined' && window.showNotification) {
          window.showNotification('代码已复制', 'success')
        }
    } catch (e) {
        console.error('Failed to copy', e)
    }
}
</script>

<style scoped>
.code-editor {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  width: 100%;
  background: var(--color-background);
  color: var(--color-text-primary);
  position: relative;
  z-index: 1;
}

.code-editor.fullscreen {
  z-index: 1000;
  position: fixed;
}

.empty-state {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-tertiary);
}

.empty-content {
    text-align: center;
}

.empty-icon {
    margin-bottom: 24px;
    opacity: 0.5;
}

/* Header */
.modern-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: var(--color-background-secondary);
  border-bottom: 1px solid var(--color-border);
  height: 50px;
}

.header-left {
    display: flex;
    align-items: center;
    gap: 12px;
}

.divider-vertical {
    width: 1px;
    height: 20px;
    background: var(--color-border);
    margin: 0 4px;
}

.btn-label {
    font-size: 13px;
    margin-left: 6px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.save-status {
  font-size: 12px;
  color: var(--color-text-tertiary);
  display: flex;
  align-items: center;
  gap: 6px;
  margin-right: 12px;
}

.unsaved-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-warning);
}

.icon-btn-ghost {
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.icon-btn-ghost:hover, .icon-btn-ghost.active {
  background: var(--color-background-tertiary);
  color: var(--color-text-primary);
}

.icon-btn-ghost.active {
    color: var(--color-primary);
}

.run-btn {
    color: var(--color-success);
    font-weight: 500;
}
.run-btn:hover {
    background: rgba(var(--color-success), 0.1);
    color: var(--color-success);
}
.run-btn.is-running {
    opacity: 0.7;
    cursor: wait;
}
.fill-current {
    fill: currentColor;
}

.btn-save-primary {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 13px;
}

.btn-save-primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.btn-save-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Meta Area */
.meta-area {
  padding: 16px 24px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-background);
}

.title-input-large {
  width: 100%;
  background: transparent;
  border: none;
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text-primary);
  outline: none;
  margin-bottom: 12px;
}

.title-input-large::placeholder {
  color: var(--color-text-tertiary);
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--color-text-secondary);
  background: var(--color-background-secondary);
  padding: 4px 10px;
  border-radius: 4px;
  border: 1px solid var(--color-border);
  font-size: 13px;
}

.meta-select {
  background: transparent;
  border: none;
  color: var(--color-text-primary);
  font-size: 13px;
  outline: none;
  cursor: pointer;
}

.meta-input {
  background: transparent;
  border: none;
  color: var(--color-text-primary);
  font-size: 13px;
  width: 100px;
  outline: none;
}

.tags-list {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.tag-pill {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  background: var(--color-primary); 
  color: white; 
  border-radius: 12px; 
  font-size: 11px;
  font-weight: 500;
}

.tag-remove {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 0;
}

.tag-remove:hover {
  color: white;
}

/* Editor Layout */
.content-split {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.editor-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--color-border);
  min-width: 0; 
}

.pane-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 12px;
  background: var(--color-background-secondary);
  border-bottom: 1px solid var(--color-border);
  font-size: 11px;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.pane-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
}

.pane-actions {
  display: flex;
  gap: 6px;
}

.action-btn {
  background: transparent;
  border: none;
  color: var(--color-text-tertiary);
  cursor: pointer;
  padding: 3px;
  border-radius: 3px;
  transition: all 0.2s;
}

.action-btn:hover {
  color: var(--color-text-primary);
  background: var(--color-background-tertiary);
}

.monaco-container {
  flex: 1;
  width: 100%;
}

.sidebar-pane {
  width: 280px;
  background: var(--color-background-secondary);
  border-left: 1px solid var(--color-border);
  padding: 16px;
  overflow-y: auto;
}

.sidebar-section {
  margin-bottom: 20px;
}

.section-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  text-transform: uppercase;
}

.description-input {
  width: 100%;
  height: 100px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 10px;
  color: var(--color-text-primary);
  font-size: 13px;
  line-height: 1.5;
  resize: vertical;
  outline: none;
}

.description-input:focus {
  border-color: var(--color-primary);
}

/* Terminal Styles */
.terminal-pane {
    background: #1e1e1e;
    color: #cccccc;
    display: flex;
    flex-direction: column;
    border-top: 1px solid var(--color-border);
}

.terminal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 12px;
    background: var(--color-background-secondary);
    border-bottom: 1px solid #333;
    cursor: row-resize;
    user-select: none;
}

.terminal-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    font-weight: 600;
    color: var(--color-text-secondary);
}

.terminal-actions {
    display: flex;
    gap: 8px;
}

.terminal-content {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
    font-family: 'Fira Code', monospace;
    font-size: 13px;
    line-height: 1.5;
}

.terminal-content pre {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-all;
}

.terminal-placeholder {
    color: #666;
    font-style: italic;
}
</style>
