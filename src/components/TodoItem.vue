/**
 * SnippetsHub - 专业代码片段管理工具
 * 
 * @file TodoItem.vue - 单个TODO任务项组件
 * @author Noah
 * @description 可重用的任务项组件，支持选择、编辑、子任务等功能
 * @created 2026-02-01
 * @version 1.0.0
 */

<template>
  <div class="todo-item" :class="{ completed: todo.completed, selected: selected }">
    <!-- Selection Checkbox -->
    <div class="todo-selection">
      <input 
        type="checkbox" 
        :checked="selected" 
        @change="$emit('select', todo.id)"
        class="selection-checkbox"
      />
    </div>

    <!-- Completion Toggle -->
    <button 
      @click="$emit('toggle', todo.id)" 
      class="todo-checkbox"
      :disabled="isLoading"
    >
      <CheckCircle v-if="todo.completed" :size="20" />
      <Circle v-else :size="20" />
    </button>
    
    <div class="todo-content">
      <div class="todo-header">
        <h3 class="todo-title">{{ todo.title }}</h3>
        <div class="todo-badges">
          <span v-if="todo.status && todo.status !== 'todo'" class="status-badge" :class="todo.status">
            {{ getStatusText(todo.status) }}
          </span>
          <span v-if="todo.priority" class="priority-badge" :class="todo.priority">
            <AlertCircle :size="12" />
            {{ getPriorityText(todo.priority) }}
          </span>
          <span v-if="todo.subtasks && todo.subtasks.length > 0" class="subtask-badge">
            <Users :size="12" />
            {{ todo.subtasks.filter(s => s.completed).length }}/{{ todo.subtasks.length }}
          </span>
        </div>
      </div>

      <p v-if="todo.description" class="todo-description">{{ todo.description }}</p>
      
      <!-- 标签显示 -->
      <div v-if="todo.tags && todo.tags.length > 0" class="todo-tags">
        <div 
          v-for="tagId in todo.tags" 
          :key="tagId"
          class="todo-tag"
          :style="getTagStyle(tagId)"
        >
          <div class="tag-color" :style="{ backgroundColor: getTagColor(tagId) }"></div>
          {{ getTagName(tagId) }}
        </div>
      </div>

      <!-- Progress Bar for Tasks with Estimated Hours -->
      <div v-if="todo.estimated_hours || todo.actual_hours" class="todo-progress">
        <div class="progress-info">
          <span class="progress-text">
            <Clock :size="12" />
            {{ todo.actual_hours || 0 }}h / {{ todo.estimated_hours || 0 }}h
          </span>
          <span v-if="todo.estimated_hours" class="progress-percentage">
            {{ Math.round(((todo.actual_hours || 0) / todo.estimated_hours) * 100) }}%
          </span>
        </div>
        <div v-if="todo.estimated_hours" class="progress-bar">
          <div 
            class="progress-fill" 
            :style="{ width: Math.min(((todo.actual_hours || 0) / todo.estimated_hours) * 100, 100) + '%' }"
          ></div>
        </div>
      </div>
      
      <div class="todo-meta">
        <span class="todo-date">
          <Calendar :size="12" />
          {{ formatRelativeTime(todo.created_at) }}
        </span>
        <span v-if="todo.due_date" class="todo-due-date" :class="{ overdue: isOverdue(todo.due_date) }">
          <Clock :size="12" />
          截止: {{ formatDate(todo.due_date) }}
        </span>
        <span v-if="todo.dependencies && todo.dependencies.length > 0" class="todo-dependencies">
          <Link :size="12" />
          依赖: {{ todo.dependencies.length }}
        </span>
      </div>

      <!-- Subtasks Display -->
      <div v-if="todo.subtasks && todo.subtasks.length > 0" class="subtasks">
        <div class="subtasks-header">
          <button @click="showSubtasks = !showSubtasks" class="subtasks-toggle">
            <ChevronDown v-if="showSubtasks" :size="14" />
            <ChevronRight v-else :size="14" />
            子任务 ({{ todo.subtasks.length }})
          </button>
        </div>
        <div v-if="showSubtasks" class="subtasks-list">
          <div 
            v-for="subtask in todo.subtasks" 
            :key="subtask.id"
            class="subtask-item"
            :class="{ completed: subtask.completed }"
          >
            <button @click="$emit('toggle', subtask.id)" class="subtask-checkbox">
              <CheckCircle v-if="subtask.completed" :size="16" />
              <Circle v-else :size="16" />
            </button>
            <span class="subtask-title">{{ subtask.title }}</span>
            <button @click="$emit('edit', subtask)" class="btn-icon-small">
              <Pencil :size="12" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="todo-actions">
      <!-- Time Tracking -->
      <div v-if="todo.status === 'in_progress'" class="time-tracking">
        <button @click="$emit('stop-tracking', todo.id)" class="btn-time" title="停止计时">
          <Square :size="14" />
        </button>
      </div>
      <div v-else-if="!todo.completed" class="time-tracking">
        <button @click="$emit('start-tracking', todo.id)" class="btn-time" title="开始计时">
          <Play :size="14" />
        </button>
      </div>

      <!-- Action Buttons -->
      <button @click="$emit('create-subtask', todo.id)" class="btn-icon" title="添加子任务" v-if="!todo.parent_id">
        <Plus :size="16" />
      </button>
      <button @click="$emit('edit', todo)" class="btn-icon" title="编辑" :disabled="isLoading">
        <Pencil :size="16" />
      </button>
      <button @click="$emit('delete', todo.id)" class="btn-icon" title="删除" :disabled="isLoading">
        <Trash2 :size="16" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { 
  CheckCircle, Circle, AlertCircle, Calendar, Clock, Users, Link,
  Pencil, Trash2, Plus, Play, Square, ChevronDown, ChevronRight
} from 'lucide-vue-next'
import { formatRelativeTime } from '../utils'
import { PRIORITY_LABELS } from '../constants'
import dayjs from 'dayjs'

const props = defineProps({
  todo: {
    type: Object,
    required: true
  },
  selected: {
    type: Boolean,
    default: false
  },
  isLoading: {
    type: Boolean,
    default: false
  },
  getTagStyle: {
    type: Function,
    required: true
  },
  getTagName: {
    type: Function,
    required: true
  },
  getTagColor: {
    type: Function,
    required: true
  }
})

const emit = defineEmits([
  'toggle', 'edit', 'delete', 'select', 'create-subtask', 
  'start-tracking', 'stop-tracking'
])

const showSubtasks = ref(false)

const getPriorityText = (priority) => {
  return PRIORITY_LABELS[priority] || ''
}

const getStatusText = (status) => {
  const statusMap = {
    'in_progress': '进行中',
    'blocked': '阻塞',
    'completed': '已完成'
  }
  return statusMap[status] || status
}

const formatDate = (dateStr) => {
  return dayjs(dateStr).format('MM/DD')
}

const isOverdue = (dateStr) => {
  return dayjs(dateStr).isBefore(dayjs(), 'day')
}
</script>

<style scoped>
.todo-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  transition: all 0.2s ease;
}

.todo-item:hover {
  border-color: var(--color-border-secondary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.todo-item.completed {
  opacity: 0.7;
}

.todo-item.selected {
  border-color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary), transparent 95%);
}

.todo-selection {
  margin-top: 2px;
}

.selection-checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.todo-checkbox {
  background: none;
  border: none;
  color: var(--color-primary);
  cursor: pointer;
  padding: 0;
  margin-top: 2px;
}

.todo-checkbox:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.todo-content {
  flex: 1;
}

.todo-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.todo-title {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 16px;
  font-weight: 600;
  flex: 1;
}

.todo-item.completed .todo-title {
  text-decoration: line-through;
  color: var(--color-text-tertiary);
}

.todo-badges {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.status-badge,
.priority-badge,
.subtask-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.status-badge.in_progress {
  color: var(--color-warning);
  background: color-mix(in srgb, var(--color-warning), transparent 90%);
}

.status-badge.blocked {
  color: var(--color-error);
  background: color-mix(in srgb, var(--color-error), transparent 90%);
}

.priority-badge.high {
  color: var(--color-error);
  background: color-mix(in srgb, var(--color-error), transparent 90%);
}

.priority-badge.medium {
  color: var(--color-warning);
  background: color-mix(in srgb, var(--color-warning), transparent 90%);
}

.priority-badge.low {
  color: var(--color-success);
  background: color-mix(in srgb, var(--color-success), transparent 90%);
}

.subtask-badge {
  color: var(--color-text-secondary);
  background: var(--color-border);
}

.todo-description {
  margin: 0 0 8px 0;
  color: var(--color-text-secondary);
  font-size: 14px;
  line-height: 1.4;
}

.todo-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.todo-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 500;
}

.todo-tag .tag-color {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.todo-progress {
  margin-bottom: 8px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.progress-text {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--color-text-secondary);
  font-size: 12px;
}

.progress-percentage {
  color: var(--color-text-tertiary);
  font-size: 12px;
}

.progress-bar {
  height: 4px;
  background: var(--color-border);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--color-primary);
  transition: width 0.3s ease;
}

.todo-meta {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.todo-date,
.todo-due-date,
.todo-dependencies {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--color-text-tertiary);
  font-size: 12px;
}

.todo-due-date.overdue {
  color: var(--color-error);
}

.subtasks {
  margin-top: 12px;
  border-top: 1px solid var(--color-border);
  padding-top: 12px;
}

.subtasks-header {
  margin-bottom: 8px;
}

.subtasks-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  padding: 0;
}

.subtasks-toggle:hover {
  color: var(--color-text-primary);
}

.subtasks-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.subtask-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
}

.subtask-item.completed .subtask-title {
  text-decoration: line-through;
  color: var(--color-text-tertiary);
}

.subtask-checkbox {
  background: none;
  border: none;
  color: var(--color-primary);
  cursor: pointer;
  padding: 0;
}

.subtask-title {
  flex: 1;
  color: var(--color-text-primary);
  font-size: 14px;
}

.btn-icon-small {
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px;
  opacity: 0.7;
  transition: opacity 0.2s;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-icon-small:hover {
  opacity: 1;
}

.todo-actions {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.time-tracking {
  display: flex;
  align-items: center;
}

.btn-time {
  background: none;
  border: 1px solid var(--color-primary);
  color: var(--color-primary);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-time:hover {
  background: var(--color-primary);
  color: var(--color-background);
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  opacity: 0.7;
  transition: opacity 0.2s;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-icon:hover:not(:disabled) {
  opacity: 1;
}

.btn-icon:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
</style>