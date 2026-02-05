/**
 * 任务详情面板
 */
<template>
  <div class="detail-panel">
    <!-- 头部 -->
    <div class="panel-header">
      <h2>任务详情</h2>
      <button @click="$emit('close')" class="btn-close">
        <X :size="20" />
      </button>
    </div>

    <!-- 内容 -->
    <div class="panel-content">
      <!-- 状态和优先级 -->
      <div class="detail-section">
        <div class="field-group">
          <label>状态</label>
          <select v-model="localTask.status" @change="handleUpdate" class="field-select">
            <option value="todo">待办</option>
            <option value="in_progress">进行中</option>
            <option value="completed">已完成</option>
          </select>
        </div>

        <div class="field-group">
          <label>优先级</label>
          <select v-model="localTask.priority" @change="handleUpdate" class="field-select">
            <option :value="null">无</option>
            <option value="high">高</option>
            <option value="medium">中</option>
            <option value="low">低</option>
          </select>
        </div>
      </div>

      <!-- 标题 -->
      <div class="detail-section">
        <label>标题</label>
        <input 
          v-model="localTask.title" 
          @blur="handleUpdate"
          class="field-input"
          type="text"
        />
      </div>

      <!-- 描述 -->
      <div class="detail-section">
        <label>描述</label>
        <textarea 
          v-model="localTask.description"
          @blur="handleUpdate"
          class="field-textarea"
          rows="4"
        ></textarea>
      </div>

      <!-- 截止日期 -->
      <div class="detail-section">
        <label>截止日期</label>
        <input 
          v-model="localTask.due_date"
          @change="handleUpdate"
          class="field-input"
          type="date"
        />
      </div>

      <!-- 标签 -->
      <div class="detail-section">
        <label>标签</label>
        <div class="tags-editor">
          <div v-if="localTask.tags && localTask.tags.length > 0" class="selected-tags">
            <span 
              v-for="tagId in localTask.tags" 
              :key="tagId"
              class="tag-chip"
              :style="{ '--tag-color': getTagColor(tagId) }"
            >
              {{ getTagName(tagId) }}
              <button @click="removeTag(tagId)" class="tag-remove">
                <X :size="12" />
              </button>
            </span>
          </div>
          <select @change="addTag" class="field-select">
            <option value="">添加标签...</option>
            <option 
              v-for="tag in availableTags" 
              :key="tag.id"
              :value="tag.id"
            >
              {{ tag.name }}
            </option>
          </select>
        </div>
      </div>

      <!-- 时间信息 -->
      <div class="detail-section meta-info">
        <div class="meta-item">
          <Clock :size="14" />
          <span>创建于 {{ formatDateTime(task.created_at) }}</span>
        </div>
        <div class="meta-item">
          <Edit3 :size="14" />
          <span>更新于 {{ formatDateTime(task.updated_at) }}</span>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="detail-actions">
        <button @click="handleToggleComplete" class="btn btn-primary">
          <Check :size="16" />
          {{ task.completed ? '标记为未完成' : '标记为完成' }}
        </button>
        <button @click="handleDelete" class="btn btn-danger">
          <Trash2 :size="16" />
          删除任务
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { X, Clock, Edit3, Check, Trash2 } from 'lucide-vue-next'
import { useTodoStore } from '../stores/todoStore'
import { useConfirm } from '../composables/useConfirm'

const props = defineProps({
  task: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'update', 'delete'])

const todoStore = useTodoStore()
const { showConfirm } = useConfirm()
const localTask = ref({ ...props.task })

const availableTags = computed(() => {
  return todoStore.tags.filter(tag => 
    !localTask.value.tags || !localTask.value.tags.includes(tag.id)
  )
})

const getTagName = (tagId) => {
  const tag = todoStore.tags.find(t => t.id === tagId)
  return tag ? tag.name : ''
}

const getTagColor = (tagId) => {
  const tag = todoStore.tags.find(t => t.id === tagId)
  return tag ? tag.color : '#999'
}

const addTag = (e) => {
  const tagId = e.target.value
  if (!tagId) return
  
  if (!localTask.value.tags) {
    localTask.value.tags = []
  }
  localTask.value.tags.push(tagId)
  e.target.value = ''
  handleUpdate()
}

const removeTag = (tagId) => {
  localTask.value.tags = localTask.value.tags.filter(id => id !== tagId)
  handleUpdate()
}

const handleUpdate = () => {
  emit('update', { ...localTask.value })
}

const handleToggleComplete = () => {
  localTask.value.completed = !localTask.value.completed
  localTask.value.status = localTask.value.completed ? 'completed' : 'todo'
  handleUpdate()
}

const handleDelete = async () => {
  const confirmed = await showConfirm('确定要删除这个任务吗？', {
    title: '删除确认',
    confirmText: '删除'
  })
  
  if (confirmed) {
    emit('delete')
    emit('close')
  }
}

const formatDateTime = (timestamp) => {
  return new Date(timestamp).toLocaleString('zh-CN')
}

watch(() => props.task, (newTask) => {
  localTask.value = { ...newTask }
}, { deep: true })
</script>

<style scoped>
.detail-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-background-secondary);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-border);
}

.panel-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
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

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-input,
.field-select,
.field-textarea {
  width: 100%;
  padding: 10px 12px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 14px;
  color: var(--color-text-primary);
  outline: none;
  transition: all 0.2s;
  font-family: inherit;
}

.field-input:focus,
.field-select:focus,
.field-textarea:focus {
  border-color: var(--color-primary);
}

.field-textarea {
  resize: vertical;
  min-height: 80px;
}

.tags-editor {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: var(--color-background);
  border-left: 3px solid var(--tag-color);
  border-radius: 6px;
  font-size: 13px;
  color: var(--color-text-primary);
}

.tag-remove {
  padding: 2px;
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  border-radius: 2px;
  transition: all 0.2s;
}

.tag-remove:hover {
  background: var(--color-background-secondary);
  color: var(--color-text-primary);
}

.meta-info {
  padding: 16px;
  background: var(--color-background);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.detail-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 24px;
  border-top: 1px solid var(--color-border);
}

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
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

.btn-primary:hover {
  background: var(--color-primary-hover);
}

.btn-danger {
  background: transparent;
  color: var(--color-error);
  border: 1px solid var(--color-error);
}

.btn-danger:hover {
  background: var(--color-error);
  color: white;
}
</style>
