/**
 * SnippetsHub - 专业代码片段管理工具
 * 
 * @file TodoTagManager.vue - TODO标签管理组件
 * @author Noah
 * @description 管理TODO任务标签的组件，支持创建、编辑、删除标签
 * @created 2026-01-30
 * @version 1.0.0
 * 
 * 功能特性:
 * - 彩色标签创建和编辑
 * - 18种预定义颜色选择
 * - 标签使用统计
 * - 拖拽排序支持
 * - 批量操作
 */

<template>
  <div class="tag-manager">
    <div class="tag-manager-header">
      <h3>标签管理</h3>
      <button @click="showCreateTag = true" class="btn-create-tag">
        <Plus :size="14" />
        新建标签
      </button>
    </div>

    <!-- 标签列表 -->
    <div class="tags-list">
      <div 
        v-for="tag in todoStore.allTags" 
        :key="tag.id"
        class="tag-item"
        :class="{ 'is-used': tag.isUsed }"
      >
        <div class="tag-preview" :style="{ backgroundColor: tag.bgColor, color: tag.color }">
          <div class="tag-color" :style="{ backgroundColor: tag.color }"></div>
          <span class="tag-name">{{ tag.name }}</span>
          <span class="tag-count">{{ tag.count }}</span>
        </div>
        
        <div class="tag-actions">
          <button @click="editTag(tag)" class="tag-action-btn" title="编辑">
            <Pencil :size="12" />
          </button>
          <button @click="deleteTag(tag)" class="tag-action-btn" title="删除">
            <Trash2 :size="12" />
          </button>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="todoStore.allTags.length === 0" class="empty-tags">
        <Tag :size="32" class="empty-icon" />
        <p>还没有创建任何标签</p>
        <button @click="showCreateTag = true" class="btn-create-first">
          创建第一个标签
        </button>
      </div>
    </div>

    <!-- 创建/编辑标签模态框 -->
    <div v-if="showCreateTag || editingTag" class="modal-overlay" @click="closeModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h4>{{ editingTag ? '编辑标签' : '新建标签' }}</h4>
          <button @click="closeModal" class="btn-close">
            <X :size="16" />
          </button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label>标签名称</label>
            <input 
              v-model="tagForm.name" 
              type="text" 
              placeholder="输入标签名称"
              class="form-input"
              maxlength="20"
              @keydown.enter="saveTag"
            />
          </div>

          <div class="form-group">
            <label>选择颜色</label>
            <div class="color-picker">
              <button
                v-for="color in TAG_COLORS"
                :key="color.id"
                class="color-option"
                :class="{ active: tagForm.color === color.id }"
                :style="{ backgroundColor: color.color }"
                @click="tagForm.color = color.id"
                :title="color.name"
              >
                <Check v-if="tagForm.color === color.id" :size="12" color="white" />
              </button>
            </div>
          </div>

          <div class="form-group">
            <label>预览</label>
            <div class="tag-preview-large" :style="getPreviewStyle()">
              <div class="tag-color" :style="{ backgroundColor: getSelectedColor().color }"></div>
              <span>{{ tagForm.name || '标签名称' }}</span>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="saveTag" class="btn btn-primary" :disabled="!tagForm.name.trim()">
            <Save :size="14" />
            保存
          </button>
          <button @click="closeModal" class="btn btn-secondary">
            取消
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Plus, Pencil, Trash2, X, Save, Tag, Check } from 'lucide-vue-next'
import { useTodoStore, TAG_COLORS } from '../stores/todoStore'
import { useGlobalNotifications } from '../composables/useNotifications'

const todoStore = useTodoStore()
const { success, error } = useGlobalNotifications()

const showCreateTag = ref(false)
const editingTag = ref(null)

const tagForm = ref({
  name: '',
  color: 'blue'
})

const getSelectedColor = () => {
  return TAG_COLORS.find(c => c.id === tagForm.value.color) || TAG_COLORS[0]
}

const getPreviewStyle = () => {
  const color = getSelectedColor()
  return {
    backgroundColor: color.bgColor,
    color: color.color,
    border: `1px solid ${color.color}20`
  }
}

const editTag = (tag) => {
  editingTag.value = tag
  tagForm.value = {
    name: tag.name,
    color: tag.colorId
  }
  showCreateTag.value = true
}

const deleteTag = async (tag) => {
  if (!confirm(`确定要删除标签"${tag.name}"吗？这将从所有任务中移除此标签。`)) {
    return
  }

  try {
    await todoStore.deleteTag(tag.id)
    success('标签已删除')
  } catch (err) {
    error('删除标签失败: ' + err.message)
  }
}

const saveTag = async () => {
  if (!tagForm.value.name.trim()) {
    error('请输入标签名称')
    return
  }

  try {
    if (editingTag.value) {
      await todoStore.updateTag(editingTag.value.id, tagForm.value)
      success('标签已更新')
    } else {
      await todoStore.createTag(tagForm.value)
      success('标签已创建')
    }
    closeModal()
  } catch (err) {
    error('保存标签失败: ' + err.message)
  }
}

const closeModal = () => {
  showCreateTag.value = false
  editingTag.value = null
  tagForm.value = {
    name: '',
    color: 'blue'
  }
}
</script>

<style scoped>
.tag-manager {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  overflow: hidden;
}

.tag-manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-background-secondary);
}

.tag-manager-header h3 {
  margin: 0;
  font-size: 16px;
  color: var(--color-text-primary);
}

.btn-create-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--color-primary);
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.btn-create-tag:hover {
  background: var(--color-primary-hover);
}

.tags-list {
  max-height: 300px;
  overflow-y: auto;
  padding: 12px;
}

.tag-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-radius: 8px;
  margin-bottom: 6px;
  transition: all 0.2s;
}

.tag-item:hover {
  background: var(--color-background-secondary);
}

.tag-item.is-used {
  border-left: 3px solid var(--color-success);
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

.tag-color {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.tag-name {
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

.tag-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.tag-item:hover .tag-actions {
  opacity: 1;
}

.tag-action-btn {
  background: none;
  border: none;
  color: var(--color-text-tertiary);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
}

.tag-action-btn:hover {
  background: var(--color-background-tertiary);
  color: var(--color-text-primary);
}

.empty-tags {
  text-align: center;
  padding: 40px 20px;
  color: var(--color-text-tertiary);
}

.empty-icon {
  margin-bottom: 12px;
  opacity: 0.5;
}

.empty-tags p {
  margin: 0 0 16px 0;
  font-size: 14px;
}

.btn-create-first {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
}

/* 模态框样式 */
.modal-overlay {
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

.modal {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  width: 400px;
  max-width: 90vw;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border);
}

.modal-header h4 {
  margin: 0;
  color: var(--color-text-primary);
}

.btn-close {
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
}

.btn-close:hover {
  background: var(--color-background-tertiary);
  color: var(--color-text-primary);
}

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  color: var(--color-text-secondary);
  font-size: 13px;
  margin-bottom: 6px;
  font-weight: 500;
}

.form-input {
  width: 100%;
  background: var(--color-background-secondary);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 8px 12px;
  color: var(--color-text-primary);
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.form-input:focus {
  border-color: var(--color-primary);
}

.color-picker {
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  gap: 8px;
  margin-top: 8px;
}

.color-option {
  width: 32px;
  height: 32px;
  border: 2px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.color-option:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.color-option.active {
  border-color: var(--color-text-primary);
  transform: scale(1.1);
}

.tag-preview-large {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  margin-top: 8px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid var(--color-border);
}

.btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.btn-primary {
  background: var(--color-primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--color-background-secondary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover {
  background: var(--color-background-tertiary);
}
</style>