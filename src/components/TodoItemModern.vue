/**
 * 现代化任务项组件
 */
<template>
  <div 
    :class="['task-item', { 
      completed: task.completed,
      selected: selected,
      overdue: isOverdue,
      'high-priority': task.priority === 'high'
    }]"
    @click="$emit('click')"
  >
    <!-- 左侧：勾选框 -->
    <button 
      @click.stop="$emit('toggle')"
      class="task-checkbox"
      :class="{ checked: task.completed }"
    >
      <Check v-if="task.completed" :size="14" />
    </button>

    <!-- 中间：内容区 -->
    <div class="task-content">
      <div class="task-header">
        <h3 class="task-title">{{ task.title }}</h3>
        <div class="task-meta">
          <!-- 优先级标签 -->
          <span 
            v-if="task.priority" 
            :class="['priority-badge', task.priority]"
          >
            <AlertCircle v-if="task.priority === 'high'" :size="12" />
            <Circle v-else-if="task.priority === 'medium'" :size="12" />
            <Minus v-else :size="12" />
            {{ priorityLabels[task.priority] }}
          </span>

          <!-- 截止日期 -->
          <span v-if="task.due_date" :class="['due-date', { overdue: isOverdue }]">
            <Calendar :size="12" />
            {{ formatDate(task.due_date) }}
          </span>
        </div>
      </div>

      <!-- 描述 -->
      <p v-if="task.description" class="task-description">
        {{ task.description }}
      </p>

      <!-- 标签 -->
      <div v-if="task.tags && task.tags.length > 0" class="task-tags">
        <span 
          v-for="tag in taskTags" 
          :key="tag.id"
          class="tag"
          :style="{ '--tag-color': tag.color }"
        >
          {{ tag.name }}
        </span>
      </div>
    </div>

    <!-- 右侧：操作按钮 -->
    <div class="task-actions">
      <button 
        @click.stop="$emit('edit')" 
        class="action-btn"
        title="编辑"
      >
        <Edit2 :size="16" />
      </button>
      <button 
        @click.stop="$emit('delete')" 
        class="action-btn danger"
        title="删除"
      >
        <Trash2 :size="16" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Check, Calendar, Edit2, Trash2, AlertCircle, Circle, Minus } from 'lucide-vue-next'
import { useTodoStore } from '../stores/todoStore'

const props = defineProps({
  task: {
    type: Object,
    required: true
  },
  selected: {
    type: Boolean,
    default: false
  }
})

defineEmits(['click', 'toggle', 'edit', 'delete', 'priority-change'])

const todoStore = useTodoStore()

const priorityLabels = {
  high: '高',
  medium: '中',
  low: '低'
}

const taskTags = computed(() => {
  if (!props.task.tags) return []
  return todoStore.tags.filter(tag => props.task.tags.includes(tag.id))
})

const isOverdue = computed(() => {
  if (!props.task.due_date || props.task.completed) return false
  return new Date(props.task.due_date) < new Date()
})

const formatDate = (date) => {
  const d = new Date(date)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  if (d.toDateString() === today.toDateString()) return '今天'
  if (d.toDateString() === tomorrow.toDateString()) return '明天'
  
  return d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
}
</script>

<style scoped>
.task-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.task-item:hover {
  border-color: var(--color-border-secondary);
  box-shadow: 0 2px 8px var(--color-shadow);
  transform: translateY(-1px);
}

.task-item.selected {
  border-color: var(--color-primary);
  background: var(--color-background-secondary);
}

.task-item.completed {
  opacity: 0.6;
}

.task-item.overdue {
  border-left: 3px solid var(--color-error);
}

.task-item.high-priority {
  border-left: 3px solid var(--color-error);
}

.task-checkbox {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  border: 2px solid var(--color-border-secondary);
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  transition: all 0.2s;
  margin-top: 2px;
}

.task-checkbox:hover {
  border-color: var(--color-primary);
  background: var(--color-primary);
}

.task-checkbox.checked {
  border-color: var(--color-success);
  background: var(--color-success);
}

.task-content {
  flex: 1;
  min-width: 0;
}

.task-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.task-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
  margin: 0;
  line-height: 1.4;
  word-break: break-word;
}

.task-item.completed .task-title {
  text-decoration: line-through;
  color: var(--color-text-tertiary);
}

.task-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.priority-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}

.priority-badge.high {
  background: #ef444420;
  color: #ef4444;
}

.priority-badge.medium {
  background: #f59e0b20;
  color: #f59e0b;
}

.priority-badge.low {
  background: #3b82f620;
  color: #3b82f6;
}

.due-date {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--color-text-secondary);
  padding: 2px 8px;
  background: var(--color-background-secondary);
  border-radius: 12px;
}

.due-date.overdue {
  background: #ef444420;
  color: #ef4444;
}

.task-description {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin: 0 0 8px 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.task-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  background: var(--color-background-secondary);
  border-left: 2px solid var(--tag-color);
  border-radius: 4px;
  font-size: 11px;
  color: var(--color-text-secondary);
}

.task-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.task-item:hover .task-actions {
  opacity: 1;
}

.action-btn {
  padding: 6px;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: var(--color-background-secondary);
  color: var(--color-text-primary);
}

.action-btn.danger:hover {
  background: #ef444420;
  color: #ef4444;
}
</style>
