/**
 * SnippetsHub - 专业代码片段管理工具
 * 
 * @file CommandPalette.vue - 命令面板组件
 * @author Noah
 * @description 快速搜索和执行命令的面板，提供智能搜索和快捷操作
 * @created 2026-01-27
 * @modified 2026-01-29
 * @version 1.0.0
 * 
 * 功能特性:
 * - 模糊搜索算法
 * - 智能命令建议
 * - 快捷键支持
 * - 历史记录管理
 * - 上下文感知搜索
 * - 实时预览功能
 * - 键盘导航支持
 * - 性能优化和缓存
 */

<template>
  <Transition name="fade">
    <div v-if="isOpen" class="command-palette-overlay" @click.self="close">
      <div class="command-palette">
        <!-- Search Input -->
        <div class="palette-header">
          <Search :size="20" class="search-icon" />
          <input 
            ref="inputRef"
            v-model="query" 
            placeholder="搜索代码片段或执行命令..." 
            class="palette-input"
            @keydown.down.prevent="navigate('down')"
            @keydown.up.prevent="navigate('up')"
            @keydown.enter.exact.prevent="execute"
            @keydown.enter.shift.prevent="copySelected"
            @keydown.esc="close"
          />
        </div>

        <!-- Results List -->
        <div class="palette-body" ref="bodyRef">
          <div v-if="filteredItems.length === 0" class="empty-results">
            <span>未找到相关结果</span>
          </div>
          
          <div v-else class="results-list">
             <div 
               v-for="(item, index) in filteredItems" 
               :key="item.id"
               class="result-item"
               :class="{ active: index === selectedIndex }"
               @click="executeItem(item)"
               @mouseenter="selectedIndex = index"
               ref="itemRefs"
             >
               <div class="item-icon">
                 <component :is="item.icon" :size="16" />
               </div>
               <div class="item-content">
                 <div class="item-title">
                   {{ item.title }}
                   <span v-if="item.tag" class="item-tag">{{ item.tag }}</span>
                 </div>
                 <div class="item-desc" v-if="item.description">{{ item.description }}</div>
               </div>
               <div class="item-meta" v-if="item.shortcut">
                 <kbd>{{ item.shortcut }}</kbd>
               </div>
             </div>
          </div>
        </div>
        
        <div class="palette-footer">
          <div class="footer-tips">
            <span><kbd>↑</kbd> <kbd>↓</kbd> 选择</span>
            <span><kbd>↵</kbd> 打开</span>
            <span><kbd>⇧</kbd>+<kbd>↵</kbd> 复制</span>
            <span><kbd>esc</kbd> 关闭</span>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { 
  Search, Code2, Plus, Moon, Sun, Monitor, Settings, 
  Terminal, FileText, Calendar 
} from 'lucide-vue-next'
import { useAppStore } from '../stores/appStore'

const appStore = useAppStore()
import { useThemeStore } from '../stores/themeStore'
import { useSnippetStore } from '../stores/snippetStore'
import { useAdvancedSearch } from '../composables/useAdvancedSearch'
import { performanceMonitor } from '../utils/performanceOptimized'

const props = defineProps({
  isOpen: Boolean,
  snippets: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'open-snippet', 'create-snippet'])

const themeStore = useThemeStore()
const snippetStore = useSnippetStore()
const inputRef = ref(null)
const query = ref('')
const selectedIndex = ref(0)

// Standard Actions
const actions = [
  { 
    id: 'create-snippet', 
    title: '新建代码片段', 
    description: '创建一个新的代码片段', 
    icon: Plus, 
    shortcut: 'Cmd+N',
    handler: () => emit('create-snippet') 
  },
  { 
    id: 'toggle-theme', 
    title: '切换主题', 
    description: `切换到 ${themeStore.isDark ? '亮色' : '暗色'} 模式`, 
    icon: themeStore.isDark ? Sun : Moon, 
    handler: () => themeStore.toggleTheme() 
  },
  {
    id: 'nav-code',
    title: '转到代码视图',
    description: '查看和管理代码片段',
    icon: FileText,
    handler: () => appStore.setCurrentView('code')
  },
  {
    id: 'nav-todo',
    title: '转到待办事项',
    description: '查看任务列表',
    icon: Calendar,
    handler: () => appStore.setCurrentView('todo')
  },
  {
    id: 'nav-settings',
    title: '打开设置',
    description: '调整应用偏好设置',
    icon: Settings,
    handler: () => appStore.setCurrentView('settings')
  }
]

// Computed Results
// Search items setup
const searchItems = computed(() => {
  // Combine actions and snippets into a unified searchable list
  const actionItems = actions.map(a => ({
    ...a,
    type: 'action',
    content: '' // for search compat
  }))
  
  const snippetItems = props.snippets.map(s => ({
    ...s,
    description: s.language, // Map for search relevance
    type: 'snippet',
    icon: Code2,
    tag: s.language,
    data: s
  }))
  
  return [...actionItems, ...snippetItems]
})

// Advanced Search Integration
const { 
  searchQuery, 
  searchResults 
} = useAdvancedSearch(searchItems, {
  searchFields: ['title', 'description', 'content', 'tags'],
  fuzzyThreshold: 0.4,
  debounceDelay: 50 // faster for UI feel
})

// Update search query when input changes
watch(query, (val) => {
  searchQuery.value = val
  selectedIndex.value = 0
})

// Computed Results (limit to 10)
const filteredItems = computed(() => {
  if (!query.value) return searchItems.value.filter(i => i.type === 'action').slice(0, 10) // default show actions
  return searchResults.value.slice(0, 10)
})

const navigate = (direction) => {
  if (direction === 'down') {
    selectedIndex.value = (selectedIndex.value + 1) % filteredItems.value.length
  } else {
    selectedIndex.value = (selectedIndex.value - 1 + filteredItems.value.length) % filteredItems.value.length
  }
  ensureVisible()
}

const bodyRef = ref(null)
const itemRefs = ref([])

// Ensure itemsRef is always an array and updated
watch(filteredItems, () => {
  itemRefs.value = []
}, { flush: 'post' })

const ensureVisible = () => {
  if (!bodyRef.value || !itemRefs.value[selectedIndex.value]) return
  
  const container = bodyRef.value
  const item = itemRefs.value[selectedIndex.value]
  
  if (!item) return
  
  const containerRect = container.getBoundingClientRect()
  const itemRect = item.getBoundingClientRect()
  
  if (itemRect.bottom > containerRect.bottom) {
    container.scrollTop += itemRect.bottom - containerRect.bottom
  } else if (itemRect.top < containerRect.top) {
    container.scrollTop -= containerRect.top - itemRect.top
  }
}

const execute = () => {
  if (filteredItems.value.length === 0) return
  executeItem(filteredItems.value[selectedIndex.value])
}

const copySelected = async () => {
  if (filteredItems.value.length === 0) return
  const item = filteredItems.value[selectedIndex.value]
  
  if (item.type === 'snippet' && item.data.code) {
    try {
      await navigator.clipboard.writeText(item.data.code)
      if (window.showNotification) {
        window.showNotification('代码已复制到剪贴板', 'success')
      }
      
      performanceMonitor.recordInteraction('copy-snippet', {
         snippetId: item.data.id,
         source: 'command-palette'
      })
      
      close()
    } catch (e) {
      console.error('Copy failed', e)
    }
  } else {
    // If it's an action, just execute it
    executeItem(item)
  }
}

const executeItem = (item) => {
  if (item.type === 'action') {
    item.handler()
  } else if (item.type === 'snippet') {
    emit('open-snippet', item.data)
  }
  close()
}

const close = () => {
  query.value = ''
  selectedIndex.value = 0
  emit('close')
}

// Auto focus on open
watch(() => props.isOpen, (val) => {
  if (val) {
    nextTick(() => inputRef.value?.focus())
  }
})

</script>

<style scoped>
.command-palette-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  z-index: 99999;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 15vh;
}

.command-palette {
  width: 640px;
  max-width: 90vw;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  box-shadow: 0 24px 72px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.1);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideDown 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-10px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.palette-header {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--color-border);
  gap: 12px;
}

.search-icon {
  color: var(--color-text-tertiary);
}

.palette-input {
  flex: 1;
  border: none;
  background: none;
  font-size: 16px;
  padding: 0 8px;
  color: var(--color-text-primary);
  outline: none;
  font-weight: 500;
}

.palette-body {
  max-height: 400px;
  overflow-y: auto;
  padding: 8px;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.1s;
}

.result-item.active {
  background: var(--color-primary);
  color: white;
}

.result-item.active .item-desc,
.result-item.active .item-meta kbd {
  color: rgba(255, 255, 255, 0.8);
}

.result-item.active .item-tag {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.item-icon {
  display: flex;
  color: inherit;
  opacity: 0.8;
}

.item-content {
  flex: 1;
}

.item-title {
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.item-desc {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-top: 2px;
}

.item-tag {
  font-size: 10px;
  padding: 2px 6px;
  background: var(--color-border);
  border-radius: 4px;
  color: var(--color-text-secondary);
}

.item-meta kbd {
  font-family: inherit;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 6px;
  background: var(--color-background-tertiary);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  color: var(--color-text-secondary);
  min-width: 20px;
  text-align: center;
}

.palette-footer {
  padding: 8px 16px;
  background: var(--color-background-secondary);
  border-top: 1px solid var(--color-border);
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.footer-tips {
  display: flex;
  gap: 16px;
}

.footer-tips kbd {
  background: var(--color-border);
  padding: 1px 4px;
  border-radius: 3px;
  margin-right: 4px;
}

/* Fade Tranisition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
