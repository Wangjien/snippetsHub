/**
 * Markdown目录大纲
 * 显示文档结构，支持点击跳转
 */
<template>
  <div class="markdown-outline">
    <div class="outline-header">
      <h3 class="outline-title">
        <List :size="16" />
        目录大纲
      </h3>
      <button @click="$emit('close')" class="btn-close" title="关闭">
        <X :size="16" />
      </button>
    </div>

    <div class="outline-content">
      <div v-if="headings.length === 0" class="empty-state">
        <FileText :size="32" class="empty-icon" />
        <p>暂无标题</p>
      </div>

      <nav v-else class="outline-nav">
        <a
          v-for="(heading, index) in headings"
          :key="index"
          :class="['outline-item', `level-${heading.level}`, { active: activeHeading === index }]"
          :style="{ paddingLeft: `${(heading.level - 1) * 16 + 12}px` }"
          @click="scrollToHeading(heading, index)"
        >
          <span class="heading-marker">{{ getMarker(heading.level) }}</span>
          <span class="heading-text">{{ heading.text }}</span>
        </a>
      </nav>
    </div>

    <div class="outline-footer">
      <div class="stats">
        <span class="stat-item">
          <Hash :size="12" />
          {{ headings.length }} 个标题
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { List, X, FileText, Hash } from 'lucide-vue-next'

const props = defineProps({
  content: {
    type: String,
    required: true
  },
  scrollContainer: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'scroll-to'])

const activeHeading = ref(0)

// 解析标题
const headings = computed(() => {
  const lines = props.content.split('\n')
  const result = []
  
  lines.forEach((line, lineIndex) => {
    const match = line.match(/^(#{1,6})\s+(.+)$/)
    if (match) {
      result.push({
        level: match[1].length,
        text: match[2].trim(),
        lineIndex
      })
    }
  })
  
  return result
})

const getMarker = (level) => {
  const markers = {
    1: '📌',
    2: '📍',
    3: '•',
    4: '◦',
    5: '▪',
    6: '▫'
  }
  return markers[level] || '•'
}

const scrollToHeading = (heading, index) => {
  activeHeading.value = index
  emit('scroll-to', heading)
}

// 监听滚动，高亮当前标题
const handleScroll = () => {
  if (!props.scrollContainer) return
  
  // TODO: 实现滚动监听逻辑
}

onMounted(() => {
  if (props.scrollContainer) {
    props.scrollContainer.addEventListener('scroll', handleScroll)
  }
})

onUnmounted(() => {
  if (props.scrollContainer) {
    props.scrollContainer.removeEventListener('scroll', handleScroll)
  }
})
</script>

<style scoped>
.markdown-outline {
  display: flex;
  flex-direction: column;
  width: 280px;
  height: 100%;
  background: var(--color-background-secondary);
  border-left: 1px solid var(--color-border);
}

.outline-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid var(--color-border);
}

.outline-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.btn-close {
  padding: 6px;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.btn-close:hover {
  background: var(--color-background);
  color: var(--color-text-primary);
}

.outline-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
}

.empty-icon {
  color: var(--color-text-tertiary);
  opacity: 0.5;
  margin-bottom: 12px;
}

.empty-state p {
  margin: 0;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.outline-nav {
  display: flex;
  flex-direction: column;
}

.outline-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  text-decoration: none;
  color: var(--color-text-secondary);
  font-size: 13px;
  line-height: 1.5;
  cursor: pointer;
  transition: all 0.2s;
  border-left: 2px solid transparent;
  margin: 2px 0;
}

.outline-item:hover {
  background: var(--color-background);
  color: var(--color-text-primary);
  border-left-color: var(--color-border-secondary);
}

.outline-item.active {
  background: var(--color-background);
  color: var(--color-primary);
  border-left-color: var(--color-primary);
  font-weight: 500;
}

.heading-marker {
  flex-shrink: 0;
  font-size: 12px;
}

.heading-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.outline-item.level-1 .heading-text {
  font-weight: 600;
  font-size: 14px;
}

.outline-item.level-2 .heading-text {
  font-weight: 500;
}

.outline-footer {
  padding: 12px 16px;
  border-top: 1px solid var(--color-border);
}

.stats {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--color-text-secondary);
}

/* 滚动条样式 */
.outline-content::-webkit-scrollbar {
  width: 6px;
}

.outline-content::-webkit-scrollbar-track {
  background: transparent;
}

.outline-content::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 3px;
}

.outline-content::-webkit-scrollbar-thumb:hover {
  background: var(--color-border-secondary);
}
</style>
