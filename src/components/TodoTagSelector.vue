/**
 * SnippetsHub - 专业代码片段管理工具
 * 
 * @file TodoTagSelector.vue - TODO标签选择器组件
 * @author Noah
 * @description 用于选择和管理任务标签的组件
 * @created 2026-01-30
 * @version 1.0.0
 * 
 * 功能特性:
 * - 多标签选择
 * - 实时搜索过滤
 * - 快速创建新标签
 * - 标签预览和移除
 */

<template>
  <div class="tag-selector">
    <label v-if="label" class="selector-label">{{ label }}</label>
    
    <!-- 已选标签显示 -->
    <div v-if="selectedTags.length > 0" class="selected-tags">
      <div 
        v-for="tag in selectedTags" 
        :key="tag.id"
        class="selected-tag"
        :style="{ backgroundColor: tag.bgColor, color: tag.color }"
      >
        <div class="tag-color" :style="{ backgroundColor: tag.color }"></div>
        <span class="tag-name">{{ tag.name }}</span>
        <button @click="removeTag(tag.id)" class="tag-remove">
          <X :size="10" />
        </button>
      </div>
    </div>

    <!-- 标签选择下拉框 -->
    <div class="tag-dropdown" :class="{ open: isOpen }">
      <div class="dropdown-trigger" @click="toggleDropdown">
        <Tag :size="14" />
        <span>{{ selectedTags.length > 0 ? `已选择 ${selectedTags.length} 个标签` : '选择标签' }}</span>
        <ChevronDown :size="14" :class="{ rotated: isOpen }" />
      </div>

      <div v-if="isOpen" class="dropdown-content">
        <!-- 搜索框 -->
        <div class="search-box">
          <Search :size="14" />
          <input 
            v-model="searchQuery"
            type="text"
            placeholder="搜索或创建标签..."
            class="search-input"
            @keydown.enter="createTagFromSearch"
          />
        </div>

        <!-- 标签列表 -->
        <div class="tags-list">
          <div 
            v-for="tag in filteredTags" 
            :key="tag.id"
            class="tag-option"
            :class="{ selected: isTagSelected(tag.id) }"
            @click="toggleTag(tag)"
          >
            <div class="tag-preview" :style="{ backgroundColor: tag.bgColor, color: tag.color }">
              <div class="tag-color" :style="{ backgroundColor: tag.color }"></div>
              <span class="tag-name">{{ tag.name }}</span>
              <span class="tag-count">{{ tag.count }}</span>
            </div>
            <div class="tag-check">
              <Check v-if="isTagSelected(tag.id)" :size="12" />
            </div>
          </div>

          <!-- 创建新标签选项 -->
          <div 
            v-if="searchQuery && !hasExactMatch"
            class="tag-option create-new"
            @click="createTagFromSearch"
          >
            <div class="create-tag-preview">
              <Plus :size="12" />
              <span>创建标签 "{{ searchQuery }}"</span>
            </div>
          </div>

          <!-- 空状态 -->
          <div v-if="filteredTags.length === 0 && !searchQuery" class="empty-state">
            <Tag :size="20" class="empty-icon" />
            <p>还没有标签</p>
            <button @click="$emit('create-tag')" class="btn-create">
              创建第一个标签
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Tag, ChevronDown, X, Search, Check, Plus } from 'lucide-vue-next'
import { useTodoStore } from '../stores/todoStore'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  label: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'create-tag'])

const todoStore = useTodoStore()
const isOpen = ref(false)
const searchQuery = ref('')

const selectedTags = computed(() => {
  return todoStore.allTags.filter(tag => props.modelValue.includes(tag.id))
})

const filteredTags = computed(() => {
  if (!searchQuery.value) {
    return todoStore.allTags
  }
  
  const query = searchQuery.value.toLowerCase()
  return todoStore.allTags.filter(tag => 
    tag.name.toLowerCase().includes(query)
  )
})

const hasExactMatch = computed(() => {
  if (!searchQuery.value) return false
  return todoStore.allTags.some(tag => 
    tag.name.toLowerCase() === searchQuery.value.toLowerCase()
  )
})

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    searchQuery.value = ''
  }
}

const isTagSelected = (tagId) => {
  return props.modelValue.includes(tagId)
}

const toggleTag = (tag) => {
  const newValue = [...props.modelValue]
  const index = newValue.indexOf(tag.id)
  
  if (index > -1) {
    newValue.splice(index, 1)
  } else {
    newValue.push(tag.id)
  }
  
  emit('update:modelValue', newValue)
}

const removeTag = (tagId) => {
  const newValue = props.modelValue.filter(id => id !== tagId)
  emit('update:modelValue', newValue)
}

const createTagFromSearch = async () => {
  if (!searchQuery.value.trim() || hasExactMatch.value) return
  
  try {
    const newTag = await todoStore.createTag({
      name: searchQuery.value.trim(),
      color: 'blue'
    })
    
    // 自动选择新创建的标签
    const newValue = [...props.modelValue, newTag.id]
    emit('update:modelValue', newValue)
    
    searchQuery.value = ''
  } catch (error) {
    console.error('Failed to create tag:', error)
  }
}

// 点击外部关闭下拉框
const handleClickOutside = (event) => {
  if (!event.target.closest('.tag-dropdown')) {
    isOpen.value = false
  }
}

watch(isOpen, (newValue) => {
  if (newValue) {
    document.addEventListener('click', handleClickOutside)
  } else {
    document.removeEventListener('click', handleClickOutside)
  }
})
</script>

<style scoped>
.tag-selector {
  position: relative;
}

.selector-label {
  display: block;
  color: var(--color-text-secondary);
  font-size: 14px;
  margin-bottom: 6px;
  font-weight: 500;
}

.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.selected-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.tag-color {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.tag-name {
  flex: 1;
}

.tag-remove {
  background: none;
  border: none;
  color: currentColor;
  cursor: pointer;
  padding: 2px;
  border-radius: 2px;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.tag-remove:hover {
  opacity: 1;
}

.tag-dropdown {
  position: relative;
}

.dropdown-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--color-background-secondary);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--color-text-primary);
}

.dropdown-trigger:hover {
  border-color: var(--color-border-secondary);
}

.tag-dropdown.open .dropdown-trigger {
  border-color: var(--color-primary);
}

.rotated {
  transform: rotate(180deg);
}

.dropdown-content {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: 0 4px 12px var(--color-shadow);
  z-index: 1000;
  margin-top: 4px;
  max-height: 300px;
  overflow: hidden;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border-bottom: 1px solid var(--color-border);
}

.search-input {
  flex: 1;
  background: none;
  border: none;
  color: var(--color-text-primary);
  font-size: 14px;
  outline: none;
}

.search-input::placeholder {
  color: var(--color-text-tertiary);
}

.tags-list {
  max-height: 200px;
  overflow-y: auto;
  padding: 8px;
}

.tag-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.tag-option:hover {
  background: var(--color-background-secondary);
}

.tag-option.selected {
  background: var(--color-primary);
  color: white;
}

.tag-option.selected .tag-preview {
  background: rgba(255, 255, 255, 0.2) !important;
  color: white !important;
}

.tag-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  flex: 1;
}

.tag-count {
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 10px;
  min-width: 16px;
  text-align: center;
}

.tag-check {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-success);
}

.create-new {
  border: 1px dashed var(--color-border);
  margin-top: 8px;
}

.create-tag-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-primary);
  font-size: 13px;
  font-weight: 500;
}

.empty-state {
  text-align: center;
  padding: 20px;
  color: var(--color-text-tertiary);
}

.empty-icon {
  margin-bottom: 8px;
  opacity: 0.5;
}

.empty-state p {
  margin: 0 0 12px 0;
  font-size: 13px;
}

.btn-create {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
}
</style>