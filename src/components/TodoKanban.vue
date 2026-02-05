/**
 * 看板视图组件
 */
<template>
  <div class="kanban-board">
    <div
      v-for="column in columns"
      :key="column.id"
      class="kanban-column"
    >
      <div class="column-header">
        <h3 class="column-title">{{ column.title }}</h3>
        <span class="column-count">{{ column.tasks.length }}</span>
      </div>
      
      <div class="column-content">
        <TransitionGroup name="card-list" tag="div" class="card-list">
          <div
            v-for="task in column.tasks"
            :key="task.id"
            class="kanban-card"
            @click="$emit('select', task)"
          >
            <div class="card-header">
              <h4 class="card-title">{{ task.title }}</h4>
              <button
                @click.stop="toggleComplete(task)"
                :class="['card-checkbox', { checked: task.completed }]"
              >
                <Check v-if="task.completed" :size="14" />
              </button>
            </div>
            
            <p v-if="task.description" class="card-description">
              {{ task.description }}
            </p>
            
            <div class="card-footer">
              <div class="card-meta">
                <span v-if="task.priority" :class="['priority-dot', task.priority]"></span>
                <span v-if="task.due_date" class="due-date">
                  <Calendar :size="12" />
                  {{ formatDate(task.due_date) }}
                </span>
              </div>
              
              <div v-if="task.tags && task.tags.length > 0" class="card-tags">
                <span
                  v-for="(tagId, index) in task.tags.slice(0, 2)"
                  :key="tagId"
                  class="tag-dot"
                  :style="{ '--tag-color': getTagColor(tagId) }"
                  :title="getTagName(tagId)"
                ></span>
                <span v-if="task.tags.length > 2" class="tag-more">
                  +{{ task.tags.length - 2 }}
                </span>
              </div>
            </div>
          </div>
        </TransitionGroup>
        
        <div v-if="column.tasks.length === 0" class="column-empty">
          <Inbox :size="32" />
          <p>暂无任务</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Check, Calendar, Inbox } from 'lucide-vue-next'
import { useTodoStore } from '../stores/todoStore'

const props = defineProps({
  tasks: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update', 'select'])

const todoStore = useTodoStore()

const columns = computed(() => [
  {
    id: 'todo',
    title: '待办',
    tasks: props.tasks.filter(t => t.status === 'todo' && !t.completed)
  },
  {
    id: 'in_progress',
    title: '进行中',
    tasks: props.tasks.filter(t => t.status === 'in_progress' && !t.completed)
  },
  {
    id: 'completed',
    title: '已完成',
    tasks: props.tasks.filter(t => t.status === 'completed' || t.completed)
  }
])

const getTagName = (tagId) => {
  const tag = todoStore.tags.find(t => t.id === tagId)
  return tag ? tag.name : ''
}

const getTagColor = (tagId) => {
  const tag = todoStore.tags.find(t => t.id === tagId)
  return tag ? tag.color : '#999'
}

const formatDate = (date) => {
  const d = new Date(date)
  return d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
}

const toggleComplete = async (task) => {
  try {
    await todoStore.toggleTodo(task.id)
  } catch (err) {
    console.error('Toggle task failed:', err)
  }
}
</script>

<style scoped>
.kanban-board {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  height: 100%;
  padding: 24px;
  overflow-x: auto;
}

.kanban-column {
  display: flex;
  flex-direction: column;
  min-width: 300px;
  background: var(--color-background-secondary);
  border-radius: 12px;
  overflow: hidden;
}

.column-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: var(--color-background);
  border-bottom: 1px solid var(--color-border);
}

.column-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.column-count {
  padding: 4px 10px;
  background: var(--color-background-secondary);
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.column-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.card-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.kanban-card {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.kanban-card:hover {
  border-color: var(--color-primary);
  box-shadow: 0 4px 12px var(--color-shadow);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.card-title {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
  margin: 0;
  line-height: 1.4;
}

.card-checkbox {
  width: 18px;
  height: 18px;
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
}

.card-checkbox:hover {
  border-color: var(--color-primary);
}

.card-checkbox.checked {
  border-color: var(--color-success);
  background: var(--color-success);
}

.card-description {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin: 0 0 12px 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.priority-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.priority-dot.high {
  background: #ef4444;
}

.priority-dot.medium {
  background: #f59e0b;
}

.priority-dot.low {
  background: #3b82f6;
}

.due-date {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--color-text-secondary);
}

.card-tags {
  display: flex;
  align-items: center;
  gap: 4px;
}

.tag-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--tag-color);
}

.tag-more {
  font-size: 10px;
  color: var(--color-text-tertiary);
}

.column-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  color: var(--color-text-tertiary);
  text-align: center;
}

.column-empty p {
  margin: 8px 0 0 0;
  font-size: 13px;
}

.card-list-move,
.card-list-enter-active,
.card-list-leave-active {
  transition: all 0.3s ease;
}

.card-list-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.card-list-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

@media (max-width: 1024px) {
  .kanban-board {
    grid-template-columns: 1fr;
  }
  
  .kanban-column {
    min-width: auto;
  }
}
</style>
