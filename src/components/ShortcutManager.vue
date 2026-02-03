/**
 * SnippetsHub - 专业代码片段管理工具
 * 
 * @file ShortcutManager.vue - 快捷键管理组件
 * @author Noah
 * @description 全局快捷键配置和管理界面
 * @created 2026-01-31
 * @modified 2026-01-31
 * @version 1.0.0
 * 
 * 功能特性:
 * - 快捷键可视化配置
 * - 冲突检测和解决
 * - 自定义快捷键绑定
 * - 快捷键帮助系统
 * - 导入导出配置
 * - 预设方案管理
 */

<template>
  <div class="shortcut-manager">
    <div class="manager-header">
      <h3>快捷键管理</h3>
      <div class="header-actions">
        <button @click="showHelp = !showHelp" class="help-btn">
          <HelpCircle :size="16" />
          <span>帮助</span>
        </button>
        <button @click="resetToDefaults" class="reset-btn">
          <RotateCcw :size="16" />
          <span>重置默认</span>
        </button>
        <button @click="exportShortcuts" class="export-btn">
          <Download :size="16" />
          <span>导出</span>
        </button>
        <input
          ref="importInputRef"
          type="file"
          accept=".json"
          style="display: none"
          @change="importShortcuts"
        />
        <button @click="$refs.importInputRef.click()" class="import-btn">
          <Upload :size="16" />
          <span>导入</span>
        </button>
      </div>
    </div>

    <!-- 快捷键帮助面板 -->
    <div v-if="showHelp" class="help-panel">
      <div class="help-content">
        <h4>快捷键说明</h4>
        <div class="help-grid">
          <div class="help-section">
            <h5>修饰键</h5>
            <ul>
              <li><kbd>Cmd</kbd> - Command (Mac) / Ctrl (Windows/Linux)</li>
              <li><kbd>Alt</kbd> - Option (Mac) / Alt (Windows/Linux)</li>
              <li><kbd>Shift</kbd> - Shift 键</li>
              <li><kbd>Ctrl</kbd> - Control 键</li>
            </ul>
          </div>
          <div class="help-section">
            <h5>组合规则</h5>
            <ul>
              <li>使用 + 连接多个键，如 Cmd+S</li>
              <li>修饰键顺序：Ctrl+Alt+Shift+Key</li>
              <li>特殊键：Space, Enter, Escape, Tab</li>
              <li>功能键：F1-F12</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- 预设方案 -->
    <div class="preset-schemes">
      <label class="scheme-label">预设方案</label>
      <div class="scheme-buttons">
        <button
          v-for="scheme in presetSchemes"
          :key="scheme.id"
          @click="applyScheme(scheme)"
          class="scheme-btn"
          :class="{ active: currentScheme === scheme.id }"
        >
          <component :is="scheme.icon" :size="16" />
          <span>{{ scheme.name }}</span>
        </button>
      </div>
    </div>

    <!-- 快捷键分类 -->
    <div class="shortcut-categories">
      <div class="category-tabs">
        <button
          v-for="category in categories"
          :key="category.id"
          @click="activeCategory = category.id"
          class="category-tab"
          :class="{ active: activeCategory === category.id }"
        >
          <component :is="category.icon" :size="16" />
          <span>{{ category.name }}</span>
          <span class="category-count">{{ getCategoryShortcuts(category.id).length }}</span>
        </button>
      </div>

      <!-- 快捷键列表 -->
      <div class="shortcuts-list">
        <div
          v-for="shortcut in getCategoryShortcuts(activeCategory)"
          :key="shortcut.id"
          class="shortcut-item"
          :class="{ 
            editing: editingShortcut === shortcut.id,
            conflict: hasConflict(shortcut.id)
          }"
        >
          <div class="shortcut-info">
            <div class="shortcut-name">{{ shortcut.name }}</div>
            <div class="shortcut-description">{{ shortcut.description }}</div>
            <div v-if="hasConflict(shortcut.id)" class="conflict-warning">
              <AlertTriangle :size="14" />
              <span>与其他快捷键冲突</span>
            </div>
          </div>

          <div class="shortcut-binding">
            <div v-if="editingShortcut !== shortcut.id" class="current-binding">
              <kbd
                v-for="key in parseShortcut(shortcut.binding)"
                :key="key"
                class="key-badge"
              >
                {{ key }}
              </kbd>
              <button
                @click="startEditing(shortcut.id)"
                class="edit-binding-btn"
                title="编辑快捷键"
              >
                <Edit :size="14" />
              </button>
            </div>

            <div v-else class="binding-editor">
              <input
                ref="bindingInputRef"
                v-model="editingBinding"
                @keydown="captureKeyBinding"
                @blur="cancelEditing"
                class="binding-input"
                placeholder="按下新的快捷键组合..."
                readonly
              />
              <div class="editor-actions">
                <button @click="saveBinding(shortcut.id)" class="save-btn" :disabled="!editingBinding">
                  <Check :size="14" />
                </button>
                <button @click="cancelEditing" class="cancel-btn">
                  <X :size="14" />
                </button>
              </div>
            </div>
          </div>

          <div class="shortcut-actions">
            <button
              @click="testShortcut(shortcut)"
              class="test-btn"
              title="测试快捷键"
            >
              <Play :size="14" />
            </button>
            <button
              @click="resetShortcut(shortcut.id)"
              class="reset-shortcut-btn"
              title="重置为默认"
            >
              <RotateCcw :size="14" />
            </button>
            <button
              @click="removeShortcut(shortcut.id)"
              class="remove-btn"
              title="移除快捷键"
            >
              <Trash2 :size="14" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加自定义快捷键 -->
    <div class="add-shortcut">
      <button @click="showAddDialog = true" class="add-btn">
        <Plus :size="16" />
        <span>添加自定义快捷键</span>
      </button>
    </div>

    <!-- 添加快捷键对话框 -->
    <div v-if="showAddDialog" class="dialog-overlay" @click="showAddDialog = false">
      <div class="add-dialog" @click.stop>
        <div class="dialog-header">
          <h4>添加自定义快捷键</h4>
          <button @click="showAddDialog = false" class="close-dialog">
            <X :size="16" />
          </button>
        </div>
        <div class="dialog-content">
          <div class="form-group">
            <label>名称</label>
            <input v-model="newShortcut.name" type="text" class="form-input" placeholder="快捷键名称" />
          </div>
          <div class="form-group">
            <label>描述</label>
            <input v-model="newShortcut.description" type="text" class="form-input" placeholder="功能描述" />
          </div>
          <div class="form-group">
            <label>分类</label>
            <select v-model="newShortcut.category" class="form-select">
              <option v-for="category in categories" :key="category.id" :value="category.id">
                {{ category.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>快捷键</label>
            <input
              v-model="newShortcut.binding"
              @keydown="captureNewKeyBinding"
              class="form-input"
              placeholder="按下快捷键组合..."
              readonly
            />
          </div>
          <div class="form-group">
            <label>动作类型</label>
            <select v-model="newShortcut.actionType" class="form-select">
              <option value="command">执行命令</option>
              <option value="navigation">页面导航</option>
              <option value="custom">自定义函数</option>
            </select>
          </div>
          <div class="form-group">
            <label>动作内容</label>
            <textarea
              v-model="newShortcut.action"
              class="form-textarea"
              placeholder="输入命令、路径或JavaScript代码..."
            ></textarea>
          </div>
        </div>
        <div class="dialog-actions">
          <button @click="showAddDialog = false" class="cancel-dialog-btn">取消</button>
          <button @click="addCustomShortcut" class="confirm-dialog-btn" :disabled="!isNewShortcutValid">
            添加
          </button>
        </div>
      </div>
    </div>

    <!-- 冲突解决面板 -->
    <div v-if="conflicts.length > 0" class="conflicts-panel">
      <div class="conflicts-header">
        <AlertTriangle :size="16" />
        <span>发现 {{ conflicts.length }} 个快捷键冲突</span>
        <button @click="resolveAllConflicts" class="resolve-all-btn">
          <Zap :size="14" />
          <span>自动解决</span>
        </button>
      </div>
      <div class="conflicts-list">
        <div v-for="conflict in conflicts" :key="conflict.binding" class="conflict-item">
          <div class="conflict-binding">
            <kbd class="key-badge conflict">{{ conflict.binding }}</kbd>
          </div>
          <div class="conflict-shortcuts">
            <div
              v-for="shortcut in conflict.shortcuts"
              :key="shortcut.id"
              class="conflict-shortcut"
            >
              <span>{{ shortcut.name }}</span>
              <button @click="resolveConflict(conflict.binding, shortcut.id)" class="resolve-btn">
                修改
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import {
  HelpCircle, RotateCcw, Download, Upload, Edit, Check, X, Play,
  Trash2, Plus, AlertTriangle, Zap, Code, Navigation, Settings,
  Keyboard, Mouse, Monitor, Smartphone
} from 'lucide-vue-next'
import { useKeyboardShortcuts } from '../composables/useKeyboardShortcuts'
import { useNotifications } from '../composables/useNotifications'
import { fileUtils } from '../utils'

const { success, error, warning } = useNotifications()

// 响应式状态
const showHelp = ref(false)
const activeCategory = ref('general')
const editingShortcut = ref(null)
const editingBinding = ref('')
const showAddDialog = ref(false)
const bindingInputRef = ref(null)
const importInputRef = ref(null)
const currentScheme = ref('default')

// 新快捷键表单
const newShortcut = ref({
  name: '',
  description: '',
  category: 'custom',
  binding: '',
  actionType: 'command',
  action: ''
})

// 预设方案
const presetSchemes = ref([
  {
    id: 'default',
    name: '默认',
    icon: Keyboard,
    description: '标准快捷键配置'
  },
  {
    id: 'vscode',
    name: 'VS Code',
    icon: Code,
    description: 'VS Code 风格快捷键'
  },
  {
    id: 'vim',
    name: 'Vim',
    icon: Monitor,
    description: 'Vim 风格快捷键'
  },
  {
    id: 'minimal',
    name: '极简',
    icon: Smartphone,
    description: '最少快捷键配置'
  }
])

// 快捷键分类
const categories = ref([
  { id: 'general', name: '通用', icon: Settings },
  { id: 'navigation', name: '导航', icon: Navigation },
  { id: 'editor', name: '编辑器', icon: Code },
  { id: 'search', name: '搜索', icon: Search },
  { id: 'custom', name: '自定义', icon: Plus }
])

// 默认快捷键配置
const defaultShortcuts = ref([
  // 通用快捷键
  {
    id: 'command-palette',
    name: '命令面板',
    description: '打开/关闭命令面板',
    category: 'general',
    binding: 'Alt+Space',
    action: 'toggleCommandPalette',
    default: 'Alt+Space'
  },
  {
    id: 'new-snippet',
    name: '新建片段',
    description: '创建新的代码片段',
    category: 'general',
    binding: 'Cmd+N',
    action: 'createSnippet',
    default: 'Cmd+N'
  },
  {
    id: 'save',
    name: '保存',
    description: '保存当前内容',
    category: 'general',
    binding: 'Cmd+S',
    action: 'save',
    default: 'Cmd+S'
  },
  {
    id: 'theme-toggle',
    name: '切换主题',
    description: '在明暗主题间切换',
    category: 'general',
    binding: 'Cmd+Shift+T',
    action: 'toggleTheme',
    default: 'Cmd+Shift+T'
  },
  
  // 导航快捷键
  {
    id: 'nav-code',
    name: '代码管理',
    description: '切换到代码管理视图',
    category: 'navigation',
    binding: 'Cmd+1',
    action: 'navigateToCode',
    default: 'Cmd+1'
  },
  {
    id: 'nav-todo',
    name: 'TODO 列表',
    description: '切换到 TODO 列表视图',
    category: 'navigation',
    binding: 'Cmd+2',
    action: 'navigateToTodo',
    default: 'Cmd+2'
  },
  {
    id: 'nav-markdown',
    name: 'Markdown 编辑器',
    description: '切换到 Markdown 编辑器',
    category: 'navigation',
    binding: 'Cmd+3',
    action: 'navigateToMarkdown',
    default: 'Cmd+3'
  },
  {
    id: 'nav-settings',
    name: '设置',
    description: '打开设置页面',
    category: 'navigation',
    binding: 'Cmd+,',
    action: 'navigateToSettings',
    default: 'Cmd+,'
  },
  
  // 编辑器快捷键
  {
    id: 'editor-undo',
    name: '撤销',
    description: '撤销上一步操作',
    category: 'editor',
    binding: 'Cmd+Z',
    action: 'undo',
    default: 'Cmd+Z'
  },
  {
    id: 'editor-redo',
    name: '重做',
    description: '重做上一步操作',
    category: 'editor',
    binding: 'Cmd+Shift+Z',
    action: 'redo',
    default: 'Cmd+Shift+Z'
  },
  {
    id: 'editor-find',
    name: '查找',
    description: '在编辑器中查找文本',
    category: 'editor',
    binding: 'Cmd+F',
    action: 'find',
    default: 'Cmd+F'
  },
  {
    id: 'editor-replace',
    name: '替换',
    description: '查找并替换文本',
    category: 'editor',
    binding: 'Cmd+H',
    action: 'replace',
    default: 'Cmd+H'
  },
  
  // 搜索快捷键
  {
    id: 'search-focus',
    name: '聚焦搜索',
    description: '将焦点移到搜索框',
    category: 'search',
    binding: 'Cmd+K',
    action: 'focusSearch',
    default: 'Cmd+K'
  },
  {
    id: 'search-clear',
    name: '清除搜索',
    description: '清空搜索内容',
    category: 'search',
    binding: 'Escape',
    action: 'clearSearch',
    default: 'Escape'
  }
])

// 当前快捷键配置
const shortcuts = ref([...defaultShortcuts.value])

// 计算属性
const getCategoryShortcuts = (categoryId) => {
  return shortcuts.value.filter(s => s.category === categoryId)
}

const conflicts = computed(() => {
  const bindingMap = new Map()
  const conflictList = []
  
  shortcuts.value.forEach(shortcut => {
    if (!shortcut.binding) return
    
    const binding = shortcut.binding.toLowerCase()
    if (bindingMap.has(binding)) {
      bindingMap.get(binding).push(shortcut)
    } else {
      bindingMap.set(binding, [shortcut])
    }
  })
  
  bindingMap.forEach((shortcuts, binding) => {
    if (shortcuts.length > 1) {
      conflictList.push({ binding, shortcuts })
    }
  })
  
  return conflictList
})

const hasConflict = (shortcutId) => {
  const shortcut = shortcuts.value.find(s => s.id === shortcutId)
  if (!shortcut || !shortcut.binding) return false
  
  const binding = shortcut.binding.toLowerCase()
  return shortcuts.value.filter(s => s.binding?.toLowerCase() === binding).length > 1
}

const isNewShortcutValid = computed(() => {
  return newShortcut.value.name &&
         newShortcut.value.binding &&
         newShortcut.value.action &&
         !shortcuts.value.some(s => s.binding === newShortcut.value.binding)
})

// 方法
const parseShortcut = (binding) => {
  if (!binding) return []
  return binding.split('+').map(key => key.trim())
}

const startEditing = (shortcutId) => {
  editingShortcut.value = shortcutId
  const shortcut = shortcuts.value.find(s => s.id === shortcutId)
  editingBinding.value = shortcut?.binding || ''
  
  nextTick(() => {
    bindingInputRef.value?.focus()
  })
}

const cancelEditing = () => {
  editingShortcut.value = null
  editingBinding.value = ''
}

const captureKeyBinding = (event) => {
  event.preventDefault()
  
  const keys = []
  if (event.ctrlKey) keys.push('Ctrl')
  if (event.altKey) keys.push('Alt')
  if (event.shiftKey) keys.push('Shift')
  if (event.metaKey) keys.push('Cmd')
  
  const key = event.key
  if (key !== 'Control' && key !== 'Alt' && key !== 'Shift' && key !== 'Meta') {
    let keyName = key
    
    // 特殊键名映射
    const keyMap = {
      ' ': 'Space',
      'Enter': 'Enter',
      'Escape': 'Escape',
      'Tab': 'Tab',
      'Backspace': 'Backspace',
      'Delete': 'Delete',
      'ArrowUp': 'Up',
      'ArrowDown': 'Down',
      'ArrowLeft': 'Left',
      'ArrowRight': 'Right'
    }
    
    if (keyMap[key]) {
      keyName = keyMap[key]
    } else if (key.length === 1) {
      keyName = key.toUpperCase()
    }
    
    keys.push(keyName)
  }
  
  if (keys.length > 1 || (keys.length === 1 && !['Ctrl', 'Alt', 'Shift', 'Cmd'].includes(keys[0]))) {
    editingBinding.value = keys.join('+')
  }
}

const captureNewKeyBinding = (event) => {
  event.preventDefault()
  
  const keys = []
  if (event.ctrlKey) keys.push('Ctrl')
  if (event.altKey) keys.push('Alt')
  if (event.shiftKey) keys.push('Shift')
  if (event.metaKey) keys.push('Cmd')
  
  const key = event.key
  if (key !== 'Control' && key !== 'Alt' && key !== 'Shift' && key !== 'Meta') {
    let keyName = key
    
    const keyMap = {
      ' ': 'Space',
      'Enter': 'Enter',
      'Escape': 'Escape',
      'Tab': 'Tab',
      'Backspace': 'Backspace',
      'Delete': 'Delete',
      'ArrowUp': 'Up',
      'ArrowDown': 'Down',
      'ArrowLeft': 'Left',
      'ArrowRight': 'Right'
    }
    
    if (keyMap[key]) {
      keyName = keyMap[key]
    } else if (key.length === 1) {
      keyName = key.toUpperCase()
    }
    
    keys.push(keyName)
  }
  
  if (keys.length > 1 || (keys.length === 1 && !['Ctrl', 'Alt', 'Shift', 'Cmd'].includes(keys[0]))) {
    newShortcut.value.binding = keys.join('+')
  }
}

const saveBinding = (shortcutId) => {
  const shortcut = shortcuts.value.find(s => s.id === shortcutId)
  if (shortcut && editingBinding.value) {
    // 检查冲突
    const existingShortcut = shortcuts.value.find(s => 
      s.id !== shortcutId && s.binding === editingBinding.value
    )
    
    if (existingShortcut) {
      warning(`快捷键 ${editingBinding.value} 已被 "${existingShortcut.name}" 使用`)
      return
    }
    
    shortcut.binding = editingBinding.value
    saveShortcuts()
    success('快捷键已更新')
  }
  
  cancelEditing()
}

const testShortcut = (shortcut) => {
  success(`测试快捷键: ${shortcut.name} (${shortcut.binding})`)
  // 这里可以实际执行快捷键对应的动作
}

const resetShortcut = (shortcutId) => {
  const shortcut = shortcuts.value.find(s => s.id === shortcutId)
  if (shortcut && shortcut.default) {
    shortcut.binding = shortcut.default
    saveShortcuts()
    success('快捷键已重置为默认值')
  }
}

const removeShortcut = (shortcutId) => {
  const shortcut = shortcuts.value.find(s => s.id === shortcutId)
  if (shortcut) {
    if (shortcut.category === 'custom') {
      // 删除自定义快捷键
      const index = shortcuts.value.findIndex(s => s.id === shortcutId)
      shortcuts.value.splice(index, 1)
    } else {
      // 清空系统快捷键
      shortcut.binding = ''
    }
    saveShortcuts()
    success('快捷键已移除')
  }
}

const addCustomShortcut = () => {
  const customShortcut = {
    id: `custom-${Date.now()}`,
    name: newShortcut.value.name,
    description: newShortcut.value.description,
    category: newShortcut.value.category,
    binding: newShortcut.value.binding,
    action: newShortcut.value.action,
    actionType: newShortcut.value.actionType,
    custom: true
  }
  
  shortcuts.value.push(customShortcut)
  saveShortcuts()
  
  // 重置表单
  newShortcut.value = {
    name: '',
    description: '',
    category: 'custom',
    binding: '',
    actionType: 'command',
    action: ''
  }
  
  showAddDialog.value = false
  success('自定义快捷键已添加')
}

const applyScheme = (scheme) => {
  currentScheme.value = scheme.id
  
  // 这里可以根据不同方案应用不同的快捷键配置
  switch (scheme.id) {
    case 'vscode':
      applyVSCodeScheme()
      break
    case 'vim':
      applyVimScheme()
      break
    case 'minimal':
      applyMinimalScheme()
      break
    default:
      resetToDefaults()
  }
  
  success(`已应用 ${scheme.name} 快捷键方案`)
}

const applyVSCodeScheme = () => {
  // VS Code 风格的快捷键配置
  const vscodeBindings = {
    'command-palette': 'Cmd+Shift+P',
    'new-snippet': 'Cmd+N',
    'search-focus': 'Cmd+P'
  }
  
  shortcuts.value.forEach(shortcut => {
    if (vscodeBindings[shortcut.id]) {
      shortcut.binding = vscodeBindings[shortcut.id]
    }
  })
  
  saveShortcuts()
}

const applyVimScheme = () => {
  // Vim 风格的快捷键配置
  const vimBindings = {
    'nav-code': 'G+C',
    'nav-todo': 'G+T',
    'nav-markdown': 'G+M',
    'search-focus': '/'
  }
  
  shortcuts.value.forEach(shortcut => {
    if (vimBindings[shortcut.id]) {
      shortcut.binding = vimBindings[shortcut.id]
    }
  })
  
  saveShortcuts()
}

const applyMinimalScheme = () => {
  // 极简方案 - 只保留最基本的快捷键
  const essentialShortcuts = ['save', 'command-palette', 'new-snippet']
  
  shortcuts.value.forEach(shortcut => {
    if (!essentialShortcuts.includes(shortcut.id)) {
      shortcut.binding = ''
    }
  })
  
  saveShortcuts()
}

const resetToDefaults = () => {
  shortcuts.value = shortcuts.value.map(shortcut => ({
    ...shortcut,
    binding: shortcut.default || shortcut.binding
  })).filter(shortcut => !shortcut.custom)
  
  currentScheme.value = 'default'
  saveShortcuts()
  success('快捷键已重置为默认配置')
}

const resolveConflict = (binding, shortcutId) => {
  startEditing(shortcutId)
}

const resolveAllConflicts = () => {
  conflicts.value.forEach(conflict => {
    // 自动为冲突的快捷键生成新的绑定
    conflict.shortcuts.slice(1).forEach((shortcut, index) => {
      const newBinding = generateAlternativeBinding(conflict.binding, index + 1)
      const shortcutRef = shortcuts.value.find(s => s.id === shortcut.id)
      if (shortcutRef) {
        shortcutRef.binding = newBinding
      }
    })
  })
  
  saveShortcuts()
  success('所有冲突已自动解决')
}

const generateAlternativeBinding = (originalBinding, index) => {
  // 简单的冲突解决策略：添加数字后缀
  const keys = originalBinding.split('+')
  const lastKey = keys[keys.length - 1]
  
  if (lastKey.match(/^\d+$/)) {
    keys[keys.length - 1] = String(parseInt(lastKey) + index)
  } else {
    keys[keys.length - 1] = lastKey + index
  }
  
  return keys.join('+')
}

const exportShortcuts = () => {
  try {
    const exportData = {
      version: '1.0.0',
      scheme: currentScheme.value,
      shortcuts: shortcuts.value,
      exportedAt: new Date().toISOString()
    }
    
    const filename = `shortcuts-${currentScheme.value}-${new Date().toISOString().split('T')[0]}.json`
    fileUtils.downloadFile(JSON.stringify(exportData, null, 2), filename, 'application/json')
    success('快捷键配置已导出')
  } catch (err) {
    error('导出失败: ' + err.message)
  }
}

const importShortcuts = (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const importData = JSON.parse(e.target.result)
      
      if (importData.shortcuts && Array.isArray(importData.shortcuts)) {
        shortcuts.value = importData.shortcuts
        currentScheme.value = importData.scheme || 'custom'
        saveShortcuts()
        success('快捷键配置已导入')
      } else {
        error('无效的配置文件格式')
      }
    } catch (err) {
      error('导入失败: ' + err.message)
    }
  }
  
  reader.readAsText(file)
  event.target.value = '' // 清空文件输入
}

const saveShortcuts = () => {
  localStorage.setItem('keyboard-shortcuts', JSON.stringify({
    scheme: currentScheme.value,
    shortcuts: shortcuts.value
  }))
}

const loadShortcuts = () => {
  try {
    const saved = localStorage.getItem('keyboard-shortcuts')
    if (saved) {
      const data = JSON.parse(saved)
      if (data.shortcuts) {
        shortcuts.value = data.shortcuts
        currentScheme.value = data.scheme || 'default'
      }
    }
  } catch (err) {
    console.warn('Failed to load shortcuts:', err)
  }
}

onMounted(() => {
  loadShortcuts()
})
</script>

<style scoped>
.shortcut-manager {
  background: var(--color-background);
  border-radius: 8px;
  overflow: hidden;
}

.manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: var(--color-background-secondary);
  border-bottom: 1px solid var(--color-border);
}

.manager-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.header-actions {
  display: flex;
  gap: 8px;
}

.help-btn,
.reset-btn,
.export-btn,
.import-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-text-secondary);
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.help-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.reset-btn:hover {
  border-color: var(--color-warning);
  color: var(--color-warning);
}

.export-btn:hover,
.import-btn:hover {
  border-color: var(--color-success);
  color: var(--color-success);
}

.help-panel {
  padding: 16px 20px;
  background: var(--color-background-tertiary);
  border-bottom: 1px solid var(--color-border);
}

.help-content h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.help-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.help-section h5 {
  margin: 0 0 8px 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.help-section ul {
  margin: 0;
  padding-left: 16px;
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.help-section li {
  margin-bottom: 4px;
}

.preset-schemes {
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border);
}

.scheme-label {
  display: block;
  margin-bottom: 12px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.scheme-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.scheme-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  background: var(--color-background-secondary);
  color: var(--color-text-secondary);
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.scheme-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-text-primary);
}

.scheme-btn.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.shortcut-categories {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.category-tabs {
  display: flex;
  background: var(--color-background-secondary);
  border-bottom: 1px solid var(--color-border);
}

.category-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 16px;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 2px solid transparent;
}

.category-tab:hover {
  background: var(--color-background-tertiary);
  color: var(--color-text-primary);
}

.category-tab.active {
  background: var(--color-background);
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

.category-count {
  background: var(--color-background-tertiary);
  color: var(--color-text-tertiary);
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 500;
}

.category-tab.active .category-count {
  background: var(--color-primary);
  color: white;
}

.shortcuts-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
}

.shortcut-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid var(--color-border);
  transition: all 0.2s;
}

.shortcut-item:last-child {
  border-bottom: none;
}

.shortcut-item.editing {
  background: var(--color-background-secondary);
  margin: 0 -20px;
  padding: 12px 20px;
  border-radius: 6px;
}

.shortcut-item.conflict {
  background: rgba(var(--color-error-rgb), 0.05);
  border-color: var(--color-error);
}

.shortcut-info {
  flex: 1;
}

.shortcut-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: 2px;
}

.shortcut-description {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.conflict-warning {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  font-size: 11px;
  color: var(--color-error);
}

.shortcut-binding {
  min-width: 150px;
}

.current-binding {
  display: flex;
  align-items: center;
  gap: 8px;
}

.key-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 8px;
  background: var(--color-background-secondary);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-primary);
  font-family: monospace;
}

.key-badge.conflict {
  background: var(--color-error);
  border-color: var(--color-error);
  color: white;
}

.edit-binding-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: var(--color-text-tertiary);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.edit-binding-btn:hover {
  background: var(--color-background-tertiary);
  color: var(--color-text-primary);
}

.binding-editor {
  display: flex;
  align-items: center;
  gap: 8px;
}

.binding-input {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-text-primary);
  border-radius: 4px;
  font-size: 12px;
  outline: none;
  font-family: monospace;
}

.binding-input:focus {
  border-color: var(--color-primary);
}

.editor-actions {
  display: flex;
  gap: 4px;
}

.save-btn,
.cancel-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.save-btn {
  background: var(--color-success);
  color: white;
}

.save-btn:disabled {
  background: var(--color-border);
  color: var(--color-text-tertiary);
  cursor: not-allowed;
}

.cancel-btn {
  background: var(--color-error);
  color: white;
}

.shortcut-actions {
  display: flex;
  gap: 4px;
}

.test-btn,
.reset-shortcut-btn,
.remove-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--color-text-tertiary);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.test-btn:hover {
  background: var(--color-primary);
  color: white;
}

.reset-shortcut-btn:hover {
  background: var(--color-warning);
  color: white;
}

.remove-btn:hover {
  background: var(--color-error);
  color: white;
}

.add-shortcut {
  padding: 16px 20px;
  border-top: 1px solid var(--color-border);
  background: var(--color-background-secondary);
}

.add-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: 1px dashed var(--color-border);
  background: transparent;
  color: var(--color-text-secondary);
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
  justify-content: center;
}

.add-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: rgba(var(--color-primary-rgb), 0.05);
}

.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--color-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.add-dialog {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  width: 500px;
  max-width: 90vw;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-background-secondary);
}

.dialog-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.close-dialog {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.close-dialog:hover {
  background: var(--color-background-tertiary);
  color: var(--color-text-primary);
}

.dialog-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  background: var(--color-background-secondary);
  color: var(--color-text-primary);
  border-radius: 6px;
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  border-color: var(--color-primary);
}

.form-textarea {
  min-height: 80px;
  resize: vertical;
  font-family: monospace;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid var(--color-border);
  background: var(--color-background-secondary);
}

.cancel-dialog-btn,
.confirm-dialog-btn {
  padding: 8px 16px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-dialog-btn {
  background: var(--color-background);
  color: var(--color-text-secondary);
}

.cancel-dialog-btn:hover {
  border-color: var(--color-error);
  color: var(--color-error);
}

.confirm-dialog-btn {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.confirm-dialog-btn:hover:not(:disabled) {
  background: var(--color-primary-hover);
  border-color: var(--color-primary-hover);
}

.confirm-dialog-btn:disabled {
  background: var(--color-border);
  border-color: var(--color-border);
  color: var(--color-text-tertiary);
  cursor: not-allowed;
}

.conflicts-panel {
  background: rgba(var(--color-error-rgb), 0.05);
  border: 1px solid var(--color-error);
  border-radius: 6px;
  margin: 16px 20px;
}

.conflicts-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-error);
  background: rgba(var(--color-error-rgb), 0.1);
  font-size: 12px;
  font-weight: 500;
  color: var(--color-error);
}

.resolve-all-btn {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border: 1px solid var(--color-error);
  background: var(--color-error);
  color: white;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}

.resolve-all-btn:hover {
  background: var(--color-error);
  filter: brightness(1.1);
}

.conflicts-list {
  padding: 12px 16px;
}

.conflict-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.conflict-item:last-child {
  margin-bottom: 0;
}

.conflict-binding {
  min-width: 80px;
}

.conflict-shortcuts {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.conflict-shortcut {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  background: var(--color-background);
  border-radius: 4px;
  font-size: 11px;
}

.resolve-btn {
  padding: 2px 6px;
  border: 1px solid var(--color-primary);
  background: var(--color-primary);
  color: white;
  border-radius: 3px;
  font-size: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.resolve-btn:hover {
  background: var(--color-primary-hover);
  border-color: var(--color-primary-hover);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .help-grid {
    grid-template-columns: 1fr;
  }
  
  .scheme-buttons {
    flex-direction: column;
  }
  
  .category-tabs {
    flex-wrap: wrap;
  }
  
  .shortcut-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .shortcut-binding {
    min-width: auto;
    width: 100%;
  }
  
  .add-dialog {
    width: 95vw;
  }
}
</style>