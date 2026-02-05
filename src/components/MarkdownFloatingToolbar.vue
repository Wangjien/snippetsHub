/**
 * Markdown浮动工具栏
 * 选中文本时显示格式化工具
 */
<template>
  <Teleport to="body">
    <Transition name="fade-scale">
      <div
        v-if="show && selection"
        ref="toolbarRef"
        class="floating-toolbar"
        :style="toolbarStyle"
        @mousedown.prevent
      >
        <button @click="applyFormat('bold')" class="toolbar-btn" title="粗体 (Ctrl+B)">
          <Bold :size="16" />
        </button>
        
        <button @click="applyFormat('italic')" class="toolbar-btn" title="斜体 (Ctrl+I)">
          <Italic :size="16" />
        </button>
        
        <button @click="applyFormat('strikethrough')" class="toolbar-btn" title="删除线">
          <Strikethrough :size="16" />
        </button>
        
        <div class="toolbar-divider"></div>
        
        <button @click="applyFormat('code')" class="toolbar-btn" title="行内代码">
          <Code :size="16" />
        </button>
        
        <button @click="applyFormat('link')" class="toolbar-btn" title="链接 (Ctrl+K)">
          <Link :size="16" />
        </button>
        
        <div class="toolbar-divider"></div>
        
        <button @click="applyFormat('heading1')" class="toolbar-btn" title="一级标题">
          H1
        </button>
        
        <button @click="applyFormat('heading2')" class="toolbar-btn" title="二级标题">
          H2
        </button>
        
        <button @click="applyFormat('heading3')" class="toolbar-btn" title="三级标题">
          H3
        </button>
        
        <div class="toolbar-divider"></div>
        
        <button @click="copySelection" class="toolbar-btn" title="复制">
          <Copy :size="16" />
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { Bold, Italic, Strikethrough, Code, Link, Copy } from 'lucide-vue-next'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  selection: {
    type: Object,
    default: null
  },
  textareaRef: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['format', 'copy'])

const toolbarRef = ref(null)

const toolbarStyle = computed(() => {
  if (!props.selection || !props.textareaRef) return {}

  const textarea = props.textareaRef
  const rect = textarea.getBoundingClientRect()
  
  // 计算选中文本的位置
  const { start, end } = props.selection
  
  // 创建临时元素来测量位置
  const lines = textarea.value.substring(0, start).split('\n')
  const lineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 24
  const lineNumber = lines.length - 1
  
  // 工具栏位置（选中文本上方）
  const top = rect.top + (lineNumber * lineHeight) - 50
  const left = rect.left + 100 // 大致位置
  
  return {
    position: 'fixed',
    top: `${Math.max(10, top)}px`,
    left: `${left}px`,
    zIndex: 1000
  }
})

const applyFormat = (format) => {
  if (!props.textareaRef || !props.selection) return
  
  const { start, end } = props.selection
  const selectedText = props.textareaRef.value.substring(start, end)
  
  let formattedText = ''
  let prefix = ''
  let suffix = ''
  
  switch (format) {
    case 'bold':
      prefix = '**'
      suffix = '**'
      break
    case 'italic':
      prefix = '*'
      suffix = '*'
      break
    case 'strikethrough':
      prefix = '~~'
      suffix = '~~'
      break
    case 'code':
      prefix = '`'
      suffix = '`'
      break
    case 'link':
      prefix = '['
      suffix = '](url)'
      break
    case 'heading1':
      prefix = '# '
      break
    case 'heading2':
      prefix = '## '
      break
    case 'heading3':
      prefix = '### '
      break
  }
  
  formattedText = prefix + selectedText + suffix
  
  emit('format', {
    start,
    end,
    text: formattedText,
    cursorOffset: prefix.length
  })
}

const copySelection = () => {
  if (!props.textareaRef || !props.selection) return
  
  const { start, end } = props.selection
  const selectedText = props.textareaRef.value.substring(start, end)
  
  navigator.clipboard.writeText(selectedText)
  emit('copy', selectedText)
}
</script>

<style scoped>
.floating-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(8px);
}

.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: var(--color-text-primary);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 12px;
  font-weight: 600;
}

.toolbar-btn:hover {
  background: var(--color-background-secondary);
  color: var(--color-primary);
}

.toolbar-btn:active {
  transform: scale(0.95);
}

.toolbar-divider {
  width: 1px;
  height: 20px;
  background: var(--color-border);
  margin: 0 4px;
}

.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.2s ease;
}

.fade-scale-enter-from {
  opacity: 0;
  transform: translateY(10px) scale(0.9);
}

.fade-scale-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.9);
}
</style>
