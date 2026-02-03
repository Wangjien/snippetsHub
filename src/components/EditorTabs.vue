<template>
  <div class="editor-tabs">
    <!-- Home Tab -->
    <div 
      class="tab-item home-tab"
      :class="{ active: !editorStore.activeTabId }"
      @click="editorStore.activeTabId = null"
      title="首页 (Cmd+1)"
    >
      <div class="tab-icon">
        <Home :size="14" />
      </div>
      <span class="tab-title">首页</span>
    </div>

    <!-- Snippet Tabs -->
    <div 
      v-for="tab in editorStore.tabs" 
      :key="tab.id"
      class="tab-item"
      :class="{ active: tab.id === editorStore.activeTabId, dirty: tab.isDirty }"
      @click="editorStore.activeTabId = tab.id"
    >
      <div class="tab-icon">
        <FileCode v-if="!tab.isNew" :size="14" />
        <Plus v-else :size="14" />
      </div>
      <span class="tab-title">{{ tab.title || '无标题' }}</span>
      <button 
        class="tab-close" 
        @click.stop="handleClose(tab)"
        :title="tab.isDirty ? '有未保存的更改' : '关闭'"
      >
        <div v-if="tab.isDirty" class="dirty-dot"></div>
        <X v-else :size="12" />
      </button>
    </div>
  </div>
</template>

<script setup>
/**
 * @file EditorTabs.vue
 * @description 编辑器多标签页管理组件
 * @author Noah
 * 
 * 负责显示当前打开的代码文件标签，支持：
 * - 切换活动标签
 * - 关闭标签（带未保存提示）
 * - 首页标签固定显示
 */
import { useEditorStore } from '../stores/editorStore'
import { FileCode, Plus, X, Home } from 'lucide-vue-next'
import { useGlobalNotifications } from '../composables/useNotifications'

const editorStore = useEditorStore()
const { confirm } = useGlobalNotifications()

const handleClose = async (tab) => {
  if (tab.isDirty) {
    const shouldClose = await confirm('该文件有未保存的更改，确定要关闭吗？', {
      confirmText: '强制关闭',
      cancelText: '取消'
    })
    if (!shouldClose) return
  }
  editorStore.closeTab(tab.id)
}
</script>

<style scoped>
.editor-tabs {
  display: flex;
  background: var(--color-background-secondary);
  border-bottom: 1px solid var(--color-border);
  overflow-x: auto;
  scrollbar-width: none; /* Firefox */
}

.editor-tabs::-webkit-scrollbar {
  display: none;
}

.tab-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  min-width: 140px;
  max-width: 200px;
  background: var(--color-background-secondary);
  border-right: 1px solid var(--color-border);
  cursor: pointer;
  user-select: none;
  transition: background 0.2s;
  color: var(--color-text-secondary);
  font-size: 13px;
}

.tab-item:hover {
  background: var(--color-background-tertiary);
}

.home-tab {
  min-width: 90px;
  flex: 0 0 auto;
}

.tab-item.active {
  background: var(--color-background);
  color: var(--color-text-primary);
  border-top: 2px solid var(--color-primary);
}

.tab-title {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tab-icon {
  display: flex;
  opacity: 0.7;
}

.tab-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: none;
  background: transparent;
  color: var(--color-text-tertiary);
  cursor: pointer;
  opacity: 0; 
  transition: all 0.2s;
}

.tab-item:hover .tab-close,
.tab-item.active .tab-close,
.tab-item.dirty .tab-close {
  opacity: 1;
}

.tab-close:hover {
  background: var(--color-background-tertiary);
  color: var(--color-text-primary);
}

.dirty-dot {
  width: 8px;
  height: 8px;
  background: var(--color-warning);
  border-radius: 50%;
}
</style>
