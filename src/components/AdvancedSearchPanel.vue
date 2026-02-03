/**
 * SnippetsHub - 专业代码片段管理工具
 * 
 * @file AdvancedSearchPanel.vue - 高级搜索面板组件
 * @author Noah
 * @description 提供强大的搜索和过滤功能界面
 * @created 2026-01-31
 * @modified 2026-01-31
 * @version 1.0.0
 * 
 * 功能特性:
 * - 智能搜索建议
 * - 多维度过滤器
 * - 搜索历史管理
 * - 保存的搜索查询
 * - 搜索统计分析
 * - 快捷搜索模板
 */

<template>
  <div class="advanced-search-panel" :class="{ expanded: isExpanded }">
    <!-- 搜索头部 -->
    <div class="search-header">
      <div class="search-input-container">
        <Search :size="20" class="search-icon" />
        <input
          ref="searchInputRef"
          v-model="searchQuery"
          type="text"
          class="search-input"
          placeholder="搜索代码片段... (支持模糊搜索、正则表达式)"
          @keydown="handleKeydown"
          @focus="showSuggestions = true"
          @blur="handleBlur"
        />
        <div class="search-actions">
          <button
            v-if="searchQuery"
            @click="clearSearch"
            class="clear-btn"
            title="清除搜索"
          >
            <X :size="16" />
          </button>
          <button
            @click="toggleExpanded"
            class="expand-btn"
            :class="{ active: isExpanded }"
            title="高级搜索"
          >
            <SlidersHorizontal :size="16" />
          </button>
        </div>
      </div>

      <!-- 搜索建议 -->
      <div v-if="showSuggestions && searchSuggestions.length > 0" class="suggestions-dropdown">
        <div class="suggestions-header">
          <span>搜索建议</span>
          <button @click="showSuggestions = false" class="close-suggestions">
            <X :size="14" />
          </button>
        </div>
        <div class="suggestions-list">
          <button
            v-for="(suggestion, index) in searchSuggestions"
            :key="index"
            @click="selectSuggestion(suggestion)"
            class="suggestion-item"
            :class="{ active: selectedSuggestionIndex === index }"
          >
            <Search :size="14" />
            <span>{{ suggestion }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 快速过滤器 -->
    <div class="quick-filters">
      <button
        v-for="filter in quickFilters"
        :key="filter.key"
        @click="applyQuickFilter(filter)"
        class="quick-filter-btn"
        :class="{ active: activeQuickFilter === filter.key }"
      >
        <component :is="filter.icon" :size="14" />
        <span>{{ filter.label }}</span>
        <span v-if="filter.count" class="filter-count">{{ filter.count }}</span>
      </button>
    </div>

    <!-- 高级过滤器面板 -->
    <div v-if="isExpanded" class="advanced-filters">
      <div class="filters-grid">
        <!-- 语言过滤器 -->
        <div class="filter-group">
          <label class="filter-label">编程语言</label>
          <select v-model="filters.language" class="filter-select">
            <option value="">所有语言</option>
            <option v-for="lang in availableLanguages" :key="lang" :value="lang">
              {{ lang }}
            </option>
          </select>
        </div>

        <!-- 标签过滤器 -->
        <div class="filter-group">
          <label class="filter-label">标签</label>
          <div class="tags-input">
            <div class="selected-tags">
              <span
                v-for="tag in filters.tags"
                :key="tag"
                class="selected-tag"
              >
                {{ tag }}
                <button @click="removeTag(tag)" class="remove-tag">
                  <X :size="12" />
                </button>
              </span>
            </div>
            <input
              v-model="tagInput"
              @keydown="handleTagInput"
              placeholder="添加标签..."
              class="tag-input"
            />
          </div>
        </div>

        <!-- 日期范围过滤器 -->
        <div class="filter-group">
          <label class="filter-label">创建时间</label>
          <div class="date-range">
            <input
              v-model="filters.dateRange.start"
              type="date"
              class="date-input"
            />
            <span class="date-separator">至</span>
            <input
              v-model="filters.dateRange.end"
              type="date"
              class="date-input"
            />
          </div>
        </div>

        <!-- 代码长度过滤器 -->
        <div class="filter-group">
          <label class="filter-label">代码长度</label>
          <div class="range-inputs">
            <input
              v-model.number="filters.minLength"
              type="number"
              placeholder="最小"
              class="range-input"
            />
            <span class="range-separator">-</span>
            <input
              v-model.number="filters.maxLength"
              type="number"
              placeholder="最大"
              class="range-input"
            />
          </div>
        </div>

        <!-- 其他过滤器 -->
        <div class="filter-group">
          <label class="filter-label">其他条件</label>
          <div class="checkbox-filters">
            <label class="checkbox-label">
              <input
                v-model="filters.isFavorite"
                type="checkbox"
                :indeterminate="filters.isFavorite === null"
              />
              <span>仅收藏</span>
            </label>
            <label class="checkbox-label">
              <input v-model="filters.hasComments" type="checkbox" />
              <span>包含注释</span>
            </label>
          </div>
        </div>

        <!-- 排序选项 -->
        <div class="filter-group">
          <label class="filter-label">排序方式</label>
          <div class="sort-controls">
            <select v-model="sortBy" class="sort-select">
              <option value="relevance">相关性</option>
              <option value="date">创建时间</option>
              <option value="title">标题</option>
              <option value="usage">使用频率</option>
            </select>
            <button
              @click="toggleSortOrder"
              class="sort-order-btn"
              :title="sortOrder === 'desc' ? '降序' : '升序'"
            >
              <component :is="sortOrder === 'desc' ? ArrowDown : ArrowUp" :size="16" />
            </button>
          </div>
        </div>
      </div>

      <!-- 过滤器操作 -->
      <div class="filter-actions">
        <button @click="resetFilters" class="reset-btn">
          <RotateCcw :size="14" />
          <span>重置过滤器</span>
        </button>
        <button @click="saveCurrentSearch" class="save-search-btn">
          <Bookmark :size="14" />
          <span>保存搜索</span>
        </button>
      </div>
    </div>

    <!-- 搜索结果统计 -->
    <div v-if="searchQuery || hasActiveFilters" class="search-stats">
      <div class="stats-info">
        <span class="result-count">找到 {{ searchResults.length }} 个结果</span>
        <span v-if="searchTime" class="search-time">({{ searchTime }}ms)</span>
      </div>
      <div class="stats-actions">
        <button @click="exportResults" class="export-btn" title="导出搜索结果">
          <Download :size="14" />
        </button>
      </div>
    </div>

    <!-- 保存的搜索 -->
    <div v-if="savedSearches.length > 0" class="saved-searches">
      <div class="saved-searches-header">
        <span>保存的搜索</span>
        <button @click="showSavedSearches = !showSavedSearches" class="toggle-saved">
          <component :is="showSavedSearches ? ChevronUp : ChevronDown" :size="14" />
        </button>
      </div>
      <div v-if="showSavedSearches" class="saved-searches-list">
        <div
          v-for="saved in savedSearches"
          :key="saved.id"
          class="saved-search-item"
        >
          <button @click="applySavedSearch(saved)" class="saved-search-btn">
            <Search :size="14" />
            <span>{{ saved.name }}</span>
          </button>
          <button @click="deleteSavedSearch(saved.id)" class="delete-saved">
            <Trash2 :size="12" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import {
  Search, X, SlidersHorizontal, ArrowDown, ArrowUp, RotateCcw,
  Bookmark, Download, ChevronUp, ChevronDown, Trash2,
  Star, Clock, Code, Tag, Calendar, Hash
} from 'lucide-vue-next'
import { useAdvancedSearch } from '../composables/useAdvancedSearch'
import { useSnippetStore } from '../stores/snippetStore'
import { useNotifications } from '../composables/useNotifications'
import { fileUtils } from '../utils'

const props = defineProps({
  snippets: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['search-results', 'filter-change'])

const snippetStore = useSnippetStore()
const { success, error } = useNotifications()

// 搜索相关状态
const searchInputRef = ref(null)
const isExpanded = ref(false)
const showSuggestions = ref(false)
const showSavedSearches = ref(false)
const selectedSuggestionIndex = ref(-1)
const tagInput = ref('')
const searchTime = ref(0)
const activeQuickFilter = ref('')

// 使用高级搜索组合式函数
const {
  searchQuery,
  searchResults,
  searchSuggestions,
  filters,
  sortBy,
  sortOrder,
  resetFilters: resetSearchFilters
} = useAdvancedSearch(computed(() => props.snippets))

// 保存的搜索
const savedSearches = ref(JSON.parse(localStorage.getItem('saved-searches') || '[]'))

// 可用语言列表
const availableLanguages = computed(() => {
  const languages = new Set()
  props.snippets.forEach(snippet => {
    if (snippet.language) {
      languages.add(snippet.language)
    }
  })
  return Array.from(languages).sort()
})

// 快速过滤器
const quickFilters = computed(() => [
  {
    key: 'favorites',
    label: '收藏',
    icon: Star,
    count: props.snippets.filter(s => s.isFavorite).length
  },
  {
    key: 'recent',
    label: '最近',
    icon: Clock,
    count: props.snippets.filter(s => {
      const dayAgo = Date.now() - 24 * 60 * 60 * 1000
      return s.updated_at * 1000 > dayAgo
    }).length
  },
  {
    key: 'javascript',
    label: 'JavaScript',
    icon: Code,
    count: props.snippets.filter(s => s.language === 'javascript').length
  },
  {
    key: 'python',
    label: 'Python',
    icon: Code,
    count: props.snippets.filter(s => s.language === 'python').length
  }
])

// 是否有活动过滤器
const hasActiveFilters = computed(() => {
  return filters.value.language ||
         filters.value.tags.length > 0 ||
         filters.value.dateRange?.start ||
         filters.value.dateRange?.end ||
         filters.value.minLength ||
         filters.value.maxLength ||
         filters.value.isFavorite !== null ||
         filters.value.hasComments !== null
})

// 方法
const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}

const clearSearch = () => {
  searchQuery.value = ''
  activeQuickFilter.value = ''
}

const handleKeydown = (event) => {
  if (event.key === 'Enter') {
    if (selectedSuggestionIndex.value >= 0 && searchSuggestions.value.length > 0) {
      selectSuggestion(searchSuggestions.value[selectedSuggestionIndex.value])
    }
    showSuggestions.value = false
  } else if (event.key === 'ArrowDown') {
    event.preventDefault()
    selectedSuggestionIndex.value = Math.min(
      selectedSuggestionIndex.value + 1,
      searchSuggestions.value.length - 1
    )
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    selectedSuggestionIndex.value = Math.max(selectedSuggestionIndex.value - 1, -1)
  } else if (event.key === 'Escape') {
    showSuggestions.value = false
    selectedSuggestionIndex.value = -1
  }
}

const handleBlur = () => {
  // 延迟隐藏建议，允许点击建议项
  setTimeout(() => {
    showSuggestions.value = false
  }, 200)
}

const selectSuggestion = (suggestion) => {
  searchQuery.value = suggestion
  showSuggestions.value = false
  selectedSuggestionIndex.value = -1
}

const applyQuickFilter = (filter) => {
  resetSearchFilters()
  activeQuickFilter.value = filter.key
  
  switch (filter.key) {
    case 'favorites':
      filters.value.isFavorite = true
      break
    case 'recent':
      const dayAgo = new Date()
      dayAgo.setDate(dayAgo.getDate() - 1)
      filters.value.dateRange = {
        start: dayAgo.toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
      }
      break
    case 'javascript':
      filters.value.language = 'javascript'
      break
    case 'python':
      filters.value.language = 'python'
      break
  }
}

const handleTagInput = (event) => {
  if (event.key === 'Enter' && tagInput.value.trim()) {
    const tag = tagInput.value.trim()
    if (!filters.value.tags.includes(tag)) {
      filters.value.tags.push(tag)
    }
    tagInput.value = ''
  }
}

const removeTag = (tag) => {
  const index = filters.value.tags.indexOf(tag)
  if (index > -1) {
    filters.value.tags.splice(index, 1)
  }
}

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'desc' ? 'asc' : 'desc'
}

const resetFilters = () => {
  resetSearchFilters()
  activeQuickFilter.value = ''
  searchQuery.value = ''
}

const saveCurrentSearch = () => {
  const name = prompt('请输入搜索名称:')
  if (!name) return
  
  const searchConfig = {
    id: Date.now(),
    name,
    query: searchQuery.value,
    filters: { ...filters.value },
    sortBy: sortBy.value,
    sortOrder: sortOrder.value,
    createdAt: new Date().toISOString()
  }
  
  savedSearches.value.push(searchConfig)
  localStorage.setItem('saved-searches', JSON.stringify(savedSearches.value))
  success('搜索已保存')
}

const applySavedSearch = (saved) => {
  searchQuery.value = saved.query
  Object.assign(filters.value, saved.filters)
  sortBy.value = saved.sortBy
  sortOrder.value = saved.sortOrder
  success(`已应用搜索: ${saved.name}`)
}

const deleteSavedSearch = (id) => {
  const index = savedSearches.value.findIndex(s => s.id === id)
  if (index > -1) {
    savedSearches.value.splice(index, 1)
    localStorage.setItem('saved-searches', JSON.stringify(savedSearches.value))
    success('搜索已删除')
  }
}

const exportResults = () => {
  try {
    const data = {
      query: searchQuery.value,
      filters: filters.value,
      results: searchResults.value,
      exportedAt: new Date().toISOString(),
      totalResults: searchResults.value.length
    }
    
    const filename = `search-results-${new Date().toISOString().split('T')[0]}.json`
    fileUtils.downloadFile(JSON.stringify(data, null, 2), filename, 'application/json')
    success('搜索结果已导出')
  } catch (err) {
    error('导出失败: ' + err.message)
  }
}

// 监听搜索结果变化
watch(searchResults, (results) => {
  const startTime = performance.now()
  emit('search-results', results)
  searchTime.value = Math.round(performance.now() - startTime)
}, { immediate: true })

// 监听过滤器变化
watch(filters, () => {
  emit('filter-change', filters.value)
}, { deep: true })

onMounted(() => {
  // 初始化日期范围
  if (!filters.value.dateRange) {
    filters.value.dateRange = {
      start: '',
      end: ''
    }
  }
})
</script>

<style scoped>
.advanced-search-panel {
  background: var(--color-background);
  border-bottom: 1px solid var(--color-border);
  transition: all 0.3s ease;
}

.search-header {
  position: relative;
  padding: 16px;
}

.search-input-container {
  position: relative;
  display: flex;
  align-items: center;
  background: var(--color-background-secondary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  transition: border-color 0.2s;
}

.search-input-container:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(var(--color-primary-rgb), 0.1);
}

.search-icon {
  margin-left: 12px;
  color: var(--color-text-tertiary);
}

.search-input {
  flex: 1;
  padding: 12px 16px;
  border: none;
  background: transparent;
  color: var(--color-text-primary);
  font-size: 14px;
  outline: none;
}

.search-input::placeholder {
  color: var(--color-text-tertiary);
}

.search-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-right: 8px;
}

.clear-btn,
.expand-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-btn:hover,
.expand-btn:hover {
  background: var(--color-background-tertiary);
  color: var(--color-text-primary);
}

.expand-btn.active {
  background: var(--color-primary);
  color: white;
}

.suggestions-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  margin-top: 4px;
}

.suggestions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid var(--color-border);
  font-size: 12px;
  color: var(--color-text-secondary);
  font-weight: 500;
}

.close-suggestions {
  border: none;
  background: transparent;
  color: var(--color-text-tertiary);
  cursor: pointer;
  padding: 2px;
  border-radius: 4px;
}

.close-suggestions:hover {
  background: var(--color-background-secondary);
}

.suggestions-list {
  max-height: 200px;
  overflow-y: auto;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  border: none;
  background: transparent;
  color: var(--color-text-primary);
  text-align: left;
  cursor: pointer;
  transition: background 0.2s;
}

.suggestion-item:hover,
.suggestion-item.active {
  background: var(--color-background-secondary);
}

.quick-filters {
  display: flex;
  gap: 8px;
  padding: 0 16px 16px;
  flex-wrap: wrap;
}

.quick-filter-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid var(--color-border);
  background: var(--color-background-secondary);
  color: var(--color-text-secondary);
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.quick-filter-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-text-primary);
}

.quick-filter-btn.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.filter-count {
  background: var(--color-background-tertiary);
  color: var(--color-text-tertiary);
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 500;
}

.quick-filter-btn.active .filter-count {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.advanced-filters {
  padding: 16px;
  border-top: 1px solid var(--color-border);
  background: var(--color-background-secondary);
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.filter-select,
.date-input,
.range-input {
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-text-primary);
  border-radius: 6px;
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s;
}

.filter-select:focus,
.date-input:focus,
.range-input:focus {
  border-color: var(--color-primary);
}

.tags-input {
  border: 1px solid var(--color-border);
  background: var(--color-background);
  border-radius: 6px;
  padding: 8px;
  min-height: 40px;
}

.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 4px;
}

.selected-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--color-primary);
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
}

.remove-tag {
  border: none;
  background: transparent;
  color: white;
  cursor: pointer;
  padding: 0;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-tag:hover {
  background: rgba(255, 255, 255, 0.2);
}

.tag-input {
  border: none;
  background: transparent;
  color: var(--color-text-primary);
  outline: none;
  font-size: 13px;
  width: 100%;
}

.date-range,
.range-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
}

.date-separator,
.range-separator {
  color: var(--color-text-tertiary);
  font-size: 12px;
}

.checkbox-filters {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--color-text-primary);
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: var(--color-primary);
}

.sort-controls {
  display: flex;
  gap: 8px;
}

.sort-select {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-text-primary);
  border-radius: 6px;
  font-size: 13px;
  outline: none;
}

.sort-order-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-text-secondary);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.sort-order-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.filter-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.reset-btn,
.save-search-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-text-secondary);
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.reset-btn:hover {
  border-color: var(--color-error);
  color: var(--color-error);
}

.save-search-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.search-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: var(--color-background-tertiary);
  border-top: 1px solid var(--color-border);
  font-size: 12px;
}

.stats-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.result-count {
  color: var(--color-text-primary);
  font-weight: 500;
}

.search-time {
  color: var(--color-text-tertiary);
}

.export-btn {
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

.export-btn:hover {
  background: var(--color-background-secondary);
  color: var(--color-text-primary);
}

.saved-searches {
  border-top: 1px solid var(--color-border);
  background: var(--color-background-secondary);
}

.saved-searches-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.toggle-saved {
  border: none;
  background: transparent;
  color: var(--color-text-tertiary);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
}

.toggle-saved:hover {
  background: var(--color-background-tertiary);
}

.saved-searches-list {
  padding: 0 16px 12px;
}

.saved-search-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.saved-search-btn {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border: none;
  background: var(--color-background);
  color: var(--color-text-primary);
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.2s;
  text-align: left;
}

.saved-search-btn:hover {
  background: var(--color-background-tertiary);
}

.delete-saved {
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

.delete-saved:hover {
  background: var(--color-error);
  color: white;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .filters-grid {
    grid-template-columns: 1fr;
  }
  
  .quick-filters {
    flex-direction: column;
  }
  
  .filter-actions {
    flex-direction: column;
  }
}
</style>