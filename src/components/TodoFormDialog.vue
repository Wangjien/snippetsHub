/**
 * 任务表单对话框
 */
<template>
  <div class="dialog-overlay" @click.self="$emit('close')">
    <div class="dialog-container">
      <div class="dialog-header">
        <h2>{{ task ? '编辑任务' : '新建任务' }}</h2>
        <button @click="$emit('close')" class="btn-close">
          <X :size="20" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="dialog-content">
        <div class="form-group">
          <label class="required">任务标题</label>
          <input
            v-model="formData.title"
            type="text"
            class="form-input"
            placeholder="输入任务标题..."
            required
            autofocus
          />
        </div>

        <div class="form-group">
          <label>任务描述</label>
          <textarea
            v-model="formData.description"
            class="form-textarea"
            placeholder="添加任务描述..."
            rows="4"
          ></textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>优先级</label>
            <select v-model="formData.priority" class="form-select">
              <option :value="null">无</option>
              <option value="high">高</option>
              <option value="medium">中</option>
              <option value="low">低</option>
            </select>
          </div>

          <div class="form-group">
            <label>状态</label>
            <select v-model="formData.status" class="form-select">
              <option value="todo">待办</option>
              <option value="in_progress">进行中</option>
              <option value="completed">已完成</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label>截止日期</label>
          <input
            v-model="formData.due_date"
            type="date"
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label>标签</label>
          <div class="tags-selector">
            <button
              v-for="tag in tags"
              :key="tag.id"
              type="button"
              @click="toggleTag(tag.id)"
              :class="['tag-btn', { selected: isTagSelected(tag.id) }]"
              :style="{ '--tag-color': tag.color }"
            >
              <Check v-if="isTagSelected(tag.id)" :size="14" />
              {{ tag.name }}
            </button>
          </div>
        </div>

        <div class="dialog-actions">
          <button type="button" @click="$emit('close')" class="btn btn-secondary">
            取消
          </button>
          <button type="submit" class="btn btn-primary" :disabled="!formData.title.trim()">
            {{ task ? '保存' : '创建' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { X, Check } from 'lucide-vue-next'

const props = defineProps({
  task: {
    type: Object,
    default: null
  },
  tags: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['save', 'close'])

const formData = ref({
  title: '',
  description: '',
  priority: null,
  status: 'todo',
  due_date: null,
  tags: []
})

const initForm = () => {
  if (props.task) {
    formData.value = {
      id: props.task.id,
      title: props.task.title || '',
      description: props.task.description || '',
      priority: props.task.priority || null,
      status: props.task.status || 'todo',
      due_date: props.task.due_date || null,
      tags: props.task.tags ? [...props.task.tags] : []
    }
  } else {
    formData.value = {
      title: '',
      description: '',
      priority: null,
      status: 'todo',
      due_date: null,
      tags: []
    }
  }
}

const toggleTag = (tagId) => {
  const index = formData.value.tags.indexOf(tagId)
  if (index > -1) {
    formData.value.tags.splice(index, 1)
  } else {
    formData.value.tags.push(tagId)
  }
}

const isTagSelected = (tagId) => {
  return formData.value.tags.includes(tagId)
}

const handleSubmit = () => {
  if (!formData.value.title.trim()) return
  emit('save', { ...formData.value })
}

watch(() => props.task, initForm, { immediate: true })
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: var(--color-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  backdrop-filter: blur(4px);
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.dialog-container {
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  background: var(--color-background);
  border-radius: 12px;
  box-shadow: 0 20px 60px var(--color-shadow);
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  border-bottom: 1px solid var(--color-border);
}

.dialog-header h2 {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.btn-close {
  padding: 6px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.btn-close:hover {
  background: var(--color-background-secondary);
  color: var(--color-text-primary);
}

.dialog-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 8px;
}

.form-group label.required::after {
  content: ' *';
  color: var(--color-error);
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 12px 14px;
  background: var(--color-background-secondary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 14px;
  color: var(--color-text-primary);
  outline: none;
  transition: all 0.2s;
  font-family: inherit;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  border-color: var(--color-primary);
  background: var(--color-background);
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.tags-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: var(--color-background-secondary);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 13px;
  color: var(--color-text-primary);
  cursor: pointer;
  transition: all 0.2s;
  border-left-width: 3px;
  border-left-color: var(--tag-color);
}

.tag-btn:hover {
  background: var(--color-background);
  border-color: var(--tag-color);
}

.tag-btn.selected {
  background: var(--color-background);
  border-color: var(--tag-color);
  color: var(--color-text-primary);
}

.dialog-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 20px 24px;
  border-top: 1px solid var(--color-border);
}

.btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: var(--color-primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: transparent;
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover {
  background: var(--color-background-secondary);
}

@media (max-width: 640px) {
  .dialog-container {
    max-height: 100vh;
    border-radius: 0;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
