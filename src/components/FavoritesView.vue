/**
 * SnippetsHub - 专业代码片段管理工具
 * 
 * @file FavoritesView.vue - 收藏页面视图
 * @author Noah
 * @description 收藏代码片段的专门页面，支持分组管理
 * @created 2026-02-02
 * @version 1.0.0
 */

<template>
  <div class="favorites-view">
    <!-- 极简收藏头部 -->
    <div class="favorites-header">
      <h2>
        <Star :size="18" class="title-icon" />
        我的收藏
        <span v-if="favoriteSnippets.length > 0" class="count">{{ favoriteSnippets.length }}</span>
      </h2>
    </div>

    <!-- 主要内容区域 -->
    <div class="favorites-content">
      <!-- 直接显示收藏的代码片段 -->
      <div class="list-view">
        <div class="list-content">
          <SnippetList
            v-if="favoriteSnippets.length > 0"
            :snippets="favoriteSnippets"
            :languages="allLanguages"
            @create="$emit('create')"
            @select="$emit('select', $event)"
            @edit="$emit('edit', $event)"
            @delete="$emit('delete', $event)"
            @favorite="handleFavorite"
          />
          <div v-else class="empty-favorites">
            <div class="empty-icon">
              <Star :size="48" />
            </div>
            <div class="empty-title">还没有收藏的代码片段</div>
            <div class="empty-description">
              在代码片段列表中点击星星图标来收藏你喜欢的代码片段
            </div>
            <div class="empty-actions">
              <button @click="$emit('create')" class="btn-create">
                <Plus :size="16" />
                创建代码片段
              </button>
              <button @click="goToAllSnippets" class="btn-browse">
                <Search :size="16" />
                浏览所有片段
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { 
  Star, Plus, Search
} from 'lucide-vue-next'
import SnippetList from './SnippetList.vue'

const props = defineProps({
  snippets: {
    type: Array,
    default: () => []
  },
  languages: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['create', 'select', 'edit', 'delete', 'favorite', 'navigate'])

// 响应式状态
// (移除了复杂的分组管理状态)

// 计算属性
const favoriteSnippets = computed(() => {
  return props.snippets.filter(snippet => snippet.isFavorite)
})

const allSnippets = computed(() => props.snippets)
const allLanguages = computed(() => props.languages)

// 方法
const goToAllSnippets = () => {
  emit('navigate', 'code')
}

const handleFavorite = (snippetId, isFavorite) => {
  emit('favorite', snippetId, isFavorite)
}
</script>

<style scoped>
.favorites-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-background-secondary);
}

.favorites-header {
  padding: 16px 24px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-background);
}

.favorites-header h2 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: var(--color-text-primary);
  font-size: 18px;
  font-weight: 600;
}

.title-icon {
  color: var(--color-warning);
}

.count {
  background: var(--color-primary);
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
  margin-left: 4px;
}

.favorites-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.list-view {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.list-content {
  flex: 1;
  overflow: hidden;
}

.empty-favorites {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  height: 100%;
}

.empty-icon {
  color: var(--color-text-tertiary);
  margin-bottom: 16px;
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 8px;
}

.empty-description {
  color: var(--color-text-secondary);
  margin-bottom: 24px;
  max-width: 400px;
  line-height: 1.5;
}

.empty-actions {
  display: flex;
  gap: 12px;
}

.btn-create,
.btn-browse {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-create {
  background: var(--color-primary);
  color: white;
  border: none;
}

.btn-create:hover {
  background: var(--color-primary-hover);
}

.btn-browse {
  background: var(--color-background-secondary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.btn-browse:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .favorites-header {
    padding: 12px 16px;
  }
  
  .favorites-header h2 {
    font-size: 16px;
  }
  
  .empty-actions {
    flex-direction: column;
    width: 100%;
    max-width: 300px;
  }
}
</style>