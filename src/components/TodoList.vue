/**
 * SnippetsHub - 专业代码片段管理工具
 * 
 * @file TodoList.vue - TODO任务管理组件
 * @author Noah
 * @description 专业级任务管理组件，支持子任务、批量操作、智能排序、时间跟踪等高级功能
 * @created 2026-01-28
 * @modified 2026-02-01
 * @version 2.0.0
 * 
 * 功能特性:
 * - SQLite数据库存储
 * - 子任务和依赖关系
 * - 批量操作支持
 * - 智能排序和分组
 * - 时间跟踪功能
 * - 生产力分析
 * - 高级搜索和过滤
 * - 数据导入导出
 * - 响应式设计
 */

<template>
  <div class="todo-list">
    <div class="list-header">
      <h2>TODO List</h2>
      <div class="header-actions">
        <div class="view-toggle">
          <button 
            @click="viewMode = 'list'" 
            class="toggle-btn" 
            :class="{ active: viewMode === 'list' }"
            title="列表视图"
          >
            <ListIcon :size="16" />
          </button>
          <button 
            @click="viewMode = 'calendar'" 
            class="toggle-btn" 
            :class="{ active: viewMode === 'calendar' }"
            title="日历视图"
          >
            <Calendar :size="16" />
          </button>
          <button 
            @click="viewMode = 'kanban'" 
            class="toggle-btn" 
            :class="{ active: viewMode === 'kanban' }"
            title="看板视图"
          >
            <Columns :size="16" />
          </button>
        </div>
        <div class="sort-toggle">
          <button 
            @click="sortMode = 'default'" 
            class="toggle-btn" 
            :class="{ active: sortMode === 'default' }"
            title="默认排序"
          >
            <ArrowUpDown :size="16" />
          </button>
          <button 
            @click="sortMode = 'smart'" 
            class="toggle-btn" 
            :class="{ active: sortMode === 'smart' }"
            title="智能排序"
          >
            <Zap :size="16" />
          </button>
          <button 
            @click="sortMode = 'grouped'" 
            class="toggle-btn" 
            :class="{ active: sortMode === 'grouped' }"
            title="分组显示"
          >
            <Layers :size="16" />
          </button>
        </div>
        <button @click="showAddTodo = true" class="btn-create" :disabled="isLoading">
          <Plus :size="16" />
          新建任务
        </button>
      </div>
    </div>

    <!-- Calendar View -->
    <div v-if="viewMode === 'calendar'" class="calendar-container">
      <TodoCalendar 
        :todos="displayTodos" 
        @edit-todo="editTodo"
        @add-todo="handleAddTodoDate"
        @update-date="handleUpdateTodoDate"
      />
    </div>

    <!-- Kanban View -->
    <div v-else-if="viewMode === 'kanban'" class="kanban-container">
      <div class="kanban-board">
        <div class="kanban-column" v-for="status in kanbanColumns" :key="status.key">
          <div class="column-header">
            <component :is="status.icon" :size="16" />
            <span>{{ status.title }}</span>
            <span class="count">{{ getTasksByStatus(status.key).length }}</span>
          </div>
          <div class="column-content">
            <div
              v-for="todo in getTasksByStatus(status.key)"
              :key="todo.id"
              class="kanban-card"
              :class="{ completed: todo.completed }"
              @click="editTodo(todo)"
            >
              <div class="card-header">
                <h4 class="card-title">{{ todo.title }}</h4>
                <div class="card-actions">
                  <button @click.stop="toggleTodo(todo.id)" class="btn-icon">
                    <CheckCircle v-if="todo.completed" :size="14" />
                    <Circle v-else :size="14" />
                  </button>
                </div>
              </div>
              <p v-if="todo.description" class="card-description">{{ todo.description }}</p>
              <div v-if="todo.tags && todo.tags.length > 0" class="card-tags">
                <div 
                  v-for="tagId in todo.tags.slice(0, 3)" 
                  :key="tagId"
                  class="card-tag"
                  :style="getTagStyle(tagId)"
                >
                  {{ getTagName(tagId) }}
                </div>
                <span v-if="todo.tags.length > 3" class="more-tags">+{{ todo.tags.length - 3 }}</span>
              </div>
              <div class="card-meta">
                <span v-if="todo.priority" class="priority" :class="todo.priority">
                  <AlertCircle :size="12" />
                </span>
                <span v-if="todo.due_date" class="due-date" :class="{ overdue: isOverdue(todo.due_date) }">
                  <Calendar :size="12" />
                  {{ formatDate(todo.due_date) }}
                </span>
                <span v-if="todo.subtasks && todo.subtasks.length > 0" class="subtasks">
                  <Users :size="12" />
                  {{ todo.subtasks.filter(s => s.completed).length }}/{{ todo.subtasks.length }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- List View -->
    <div v-else class="list-content">
      <!-- Enhanced Stats -->
      <div class="todo-stats">
        <div class="stat-item">
          <CheckCircle :size="16" />
          <span>已完成: {{ todoStore.completedCount }}</span>
        </div>
        <div class="stat-item">
          <Circle :size="16" />
          <span>待完成: {{ todoStore.pendingCount }}</span>
        </div>
        <div class="stat-item">
          <Clock :size="16" />
          <span>总计: {{ todoStore.totalCount }}</span>
        </div>
        <div class="stat-item" v-if="todoStore.stats.overdue > 0">
          <AlertTriangle :size="16" />
          <span class="overdue">逾期: {{ todoStore.stats.overdue }}</span>
        </div>
        <div class="stat-item" v-if="todoStore.stats.due_today > 0">
          <Calendar :size="16" />
          <span class="due-today">今日: {{ todoStore.stats.due_today }}</span>
        </div>
      </div>

      <!-- Enhanced Controls -->
      <div class="todo-controls">
        <div class="todo-filters">
          <button 
            v-for="filterOption in filterOptions"
            :key="filterOption.value"
            :class="{ active: filter === filterOption.value }" 
            @click="filter = filterOption.value"
            class="filter-btn"
          >
            {{ filterOption.label }}
          </button>
          
          <!-- 标签过滤器 -->
          <div class="tag-filters" v-if="todoStore.allTags.length > 0">
            <button 
              v-for="tag in todoStore.allTags.filter(t => t.count > 0)"
              :key="tag.id"
              :class="{ active: filter === `tag:${tag.id}` }"
              @click="filter = filter === `tag:${tag.id}` ? 'all' : `tag:${tag.id}`"
              class="tag-filter-btn"
              :style="{ backgroundColor: tag.bg_color, color: tag.color }"
            >
              <div class="tag-color" :style="{ backgroundColor: tag.color }"></div>
              {{ tag.name }}
              <span class="tag-count">{{ tag.count }}</span>
            </button>
          </div>
        </div>
        
        <div class="todo-actions">
          <!-- Batch Operations -->
          <div v-if="selectedTodos.length > 0" class="batch-actions">
            <span class="selected-count">已选择 {{ selectedTodos.length }} 项</span>
            <button @click="batchComplete" class="btn-batch" title="批量完成">
              <CheckCircle :size="14" />
            </button>
            <button @click="batchDelete" class="btn-batch" title="批量删除">
              <Trash2 :size="14" />
            </button>
            <button @click="clearSelection" class="btn-batch" title="取消选择">
              <X :size="14" />
            </button>
          </div>
          
          <button @click="showTagManager = true" class="btn-action" title="管理标签">
            <Tag :size="14" />
            标签管理
          </button>
          <button @click="showProductivityPanel = true" class="btn-action" title="生产力分析">
            <BarChart3 :size="14" />
            分析
          </button>
          <button @click="clearCompleted" class="btn-action" :disabled="todoStore.completedCount === 0">
            <Trash2 :size="14" />
            清除已完成
          </button>
        </div>
      </div>

      <!-- 加载状态 -->
      <LoadingSpinner v-if="isLoading" text="加载中..." />

      <!-- 空状态 -->
      <EmptyState
        v-else-if="displayTodos.length === 0 && todoStore.totalCount === 0"
        type="todo"
        title="还没有任务"
        description="创建你的第一个任务来开始管理你的待办事项"
      >
        <template #action>
          <button @click="showAddTodo = true" class="btn btn-primary">
            <Plus :size="16" />
            创建任务
          </button>
        </template>
      </EmptyState>

      <!-- 搜索无结果 -->
      <EmptyState
        v-else-if="displayTodos.length === 0"
        type="search"
        title="没有找到匹配的任务"
        description="尝试调整筛选条件或创建新任务"
      />

      <!-- 任务列表 -->
      <div v-else class="todos">
        <!-- Grouped Display -->
        <div v-if="sortMode === 'grouped'" class="grouped-todos">
          <div v-for="(group, groupKey) in groupedTodos" :key="groupKey" class="todo-group">
            <div v-if="group.length > 0" class="group-header">
              <h3 class="group-title">{{ getGroupTitle(groupKey) }}</h3>
              <span class="group-count">{{ group.length }}</span>
            </div>
            <div class="group-content">
              <TodoItem
                v-for="todo in group"
                :key="todo.id"
                :todo="todo"
                :selected="selectedTodos.includes(todo.id)"
                @toggle="toggleTodo"
                @edit="editTodo"
                @delete="deleteTodo"
                @select="toggleSelection"
                @create-subtask="createSubtask"
                @start-tracking="startTimeTracking"
                @stop-tracking="stopTimeTracking"
                :get-tag-style="getTagStyle"
                :get-tag-name="getTagName"
                :get-tag-color="getTagColor"
              />
            </div>
          </div>
        </div>

        <!-- Regular List Display -->
        <div v-else class="regular-todos">
          <TodoItem
            v-for="todo in displayTodos"
            :key="todo.id"
            :todo="todo"
            :selected="selectedTodos.includes(todo.id)"
            @toggle="toggleTodo"
            @edit="editTodo"
            @delete="deleteTodo"
            @select="toggleSelection"
            @create-subtask="createSubtask"
            @start-tracking="startTimeTracking"
            @stop-tracking="stopTimeTracking"
            :get-tag-style="getTagStyle"
            :get-tag-name="getTagName"
            :get-tag-color="getTagColor"
          />
        </div>
      </div>
    </div>

    <!-- 添加/编辑 TODO 模态框 -->
    <div v-if="showAddTodo || editingTodo" class="modal-overlay" @click="closeModal">
      <div class="modal enhanced-modal" @click.stop>
        <div class="modal-header">
          <h3>{{ editingTodo ? '编辑任务' : '新建任务' }}</h3>
          <button @click="closeModal" class="btn-icon">
            <X :size="20" />
          </button>
        </div>
        
        <form @submit.prevent="saveTodo" class="modal-body">
          <div class="form-group">
            <label for="todo-title">任务标题 *</label>
            <input
              id="todo-title"
              v-model="todoForm.title"
              type="text"
              placeholder="输入任务标题"
              class="form-input"
              :class="{ error: titleError }"
              required
              maxlength="100"
            />
            <div v-if="titleError" class="error-message">{{ titleError }}</div>
          </div>
          
          <div class="form-group">
            <label for="todo-description">任务描述</label>
            <textarea
              id="todo-description"
              v-model="todoForm.description"
              placeholder="输入任务描述（可选）"
              class="form-textarea"
              rows="3"
              maxlength="500"
            ></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="todo-status">状态</label>
              <select id="todo-status" v-model="todoForm.status" class="form-select">
                <option value="todo">待办</option>
                <option value="in_progress">进行中</option>
                <option value="blocked">阻塞</option>
                <option value="completed">已完成</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="todo-priority">优先级</label>
              <select id="todo-priority" v-model="todoForm.priority" class="form-select">
                <option value="">选择优先级</option>
                <option value="high">高优先级</option>
                <option value="medium">中优先级</option>
                <option value="low">低优先级</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="todo-date">截止日期</label>
              <input
                id="todo-date"
                v-model="todoForm.due_date"
                type="date"
                class="form-input"
              />
            </div>
            
            <div class="form-group">
              <label for="todo-estimated">预估时间（小时）</label>
              <input
                id="todo-estimated"
                v-model.number="todoForm.estimated_hours"
                type="number"
                min="0"
                step="0.5"
                placeholder="0"
                class="form-input"
              />
            </div>
          </div>
          
          <div class="form-group">
            <label for="todo-tags">标签</label>
            <TodoTagSelector 
              v-model="todoForm.tags"
              @create-tag="showTagManager = true"
            />
          </div>

          <!-- Parent Task Selection for Subtasks -->
          <div v-if="!editingTodo" class="form-group">
            <label for="todo-parent">父任务（创建子任务）</label>
            <select id="todo-parent" v-model="todoForm.parent_id" class="form-select">
              <option value="">选择父任务</option>
              <option 
                v-for="todo in todoStore.todos.filter(t => !t.completed && !t.parent_id)" 
                :key="todo.id" 
                :value="todo.id"
              >
                {{ todo.title }}
              </option>
            </select>
          </div>
        </form>
        
        <div class="modal-footer">
          <button type="submit" @click="saveTodo" class="btn btn-primary" :disabled="!todoForm.title.trim() || isLoading">
            <Save :size="16" />
            {{ isLoading ? '保存中...' : '保存' }}
          </button>
          <button @click="closeModal" class="btn btn-secondary" :disabled="isLoading">
            取消
          </button>
        </div>
      </div>
    </div>

    <!-- 标签管理模态框 -->
    <div v-if="showTagManager" class="modal-overlay" @click="showTagManager = false">
      <div class="modal tag-manager-modal" @click.stop>
        <div class="modal-header">
          <h3>标签管理</h3>
          <button @click="showTagManager = false" class="btn-icon">
            <X :size="20" />
          </button>
        </div>
        <div class="modal-body">
          <TodoTagManager />
        </div>
      </div>
    </div>

    <!-- 生产力分析面板 -->
    <div v-if="showProductivityPanel" class="modal-overlay" @click="showProductivityPanel = false">
      <div class="modal productivity-modal" @click.stop>
        <div class="modal-header">
          <h3>生产力分析</h3>
          <button @click="showProductivityPanel = false" class="btn-icon">
            <X :size="20" />
          </button>
        </div>
        <div class="modal-body">
          <ProductivityDashboard :stats="productivityStats" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { 
  Plus, CheckCircle, Circle, Clock, Calendar, AlertCircle, AlertTriangle,
  Pencil, Trash2, X, Save, List as ListIcon, Tag, BarChart3, Zap,
  ArrowUpDown, Layers, Columns, Users
} from 'lucide-vue-next'
import { useTodoStore } from '../stores/todoStore'
import { PRIORITY_LABELS } from '../constants'
import { formatRelativeTime, validateInput } from '../utils'
import LoadingSpinner from './LoadingSpinner.vue'
import EmptyState from './EmptyState.vue'
import TodoCalendar from './TodoCalendar.vue'
import TodoTagSelector from './TodoTagSelector.vue'
import TodoTagManager from './TodoTagManager.vue'
import TodoItem from './TodoItem.vue'
import ProductivityDashboard from './ProductivityDashboard.vue'
import dayjs from 'dayjs'

const todoStore = useTodoStore()

// 响应式状态
const filter = ref('all')
const viewMode = ref('list') // 'list' | 'calendar' | 'kanban'
const sortMode = ref('default') // 'default' | 'smart' | 'grouped'
const showAddTodo = ref(false)
const showTagManager = ref(false)
const showProductivityPanel = ref(false)
const editingTodo = ref(null)
const isLoading = ref(false)
const selectedTodos = ref([])

const todoForm = ref({
  title: '',
  description: '',
  status: 'todo',
  priority: '',
  due_date: '',
  estimated_hours: null,
  tags: [],
  parent_id: ''
})

// 看板列配置
const kanbanColumns = [
  { key: 'todo', title: '待办', icon: Circle },
  { key: 'in_progress', title: '进行中', icon: Clock },
  { key: 'blocked', title: '阻塞', icon: AlertTriangle },
  { key: 'completed', title: '已完成', icon: CheckCircle }
]

const filterOptions = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待完成' },
  { value: 'completed', label: '已完成' },
  { value: 'high', label: '高优先级' },
  { value: 'medium', label: '中优先级' },
  { value: 'low', label: '低优先级' }
]

// 计算属性
const displayTodos = computed(() => {
  let todos = todoStore.filterTodos(filter.value)
  
  if (sortMode.value === 'smart') {
    todos = todoStore.smartSortedTodos
  }
  
  return todos
})

const groupedTodos = computed(() => {
  if (sortMode.value !== 'grouped') return {}
  return todoStore.groupedTodos
})

const productivityStats = computed(() => {
  return todoStore.getProductivityStats()
})

const titleError = computed(() => {
  const validation = validateInput(todoForm.value.title, {
    required: true,
    minLength: 1,
    maxLength: 100
  })
  return validation.errors[0] || null
})

// 方法
onMounted(async () => {
  await todoStore.initialize()
})

// 监听错误状态
watch(() => todoStore.error, (error) => {
  if (error) {
    console.error('Todo store error:', error)
    // 这里可以添加用户友好的错误提示
  }
})

const toggleTodo = async (id) => {
  try {
    isLoading.value = true
    await todoStore.toggleTodo(id)
  } catch (error) {
    console.error('Toggle todo failed:', error)
  } finally {
    isLoading.value = false
  }
}

const editTodo = (todo) => {
  editingTodo.value = todo
  todoForm.value = {
    title: todo.title,
    description: todo.description || '',
    status: todo.status || 'todo',
    priority: todo.priority || '',
    due_date: todo.due_date ? dayjs(todo.due_date).format('YYYY-MM-DD') : '',
    estimated_hours: todo.estimated_hours || null,
    tags: todo.tags || [],
    parent_id: todo.parent_id || ''
  }
  showAddTodo.value = true
}

const handleAddTodoDate = (dateStr) => {
  todoForm.value.due_date = dateStr
  showAddTodo.value = true
}

const handleUpdateTodoDate = async ({ id, date }) => {
  try {
    isLoading.value = true
    await todoStore.updateTodo(id, { due_date: date })
  } catch (error) {
    console.error('Update todo date failed:', error)
  } finally {
    isLoading.value = false
  }
}

const deleteTodo = async (id) => {
  if (!confirm('确定要删除这个任务吗？')) return
  
  try {
    isLoading.value = true
    await todoStore.deleteTodo(id)
  } catch (error) {
    console.error('Delete todo failed:', error)
  } finally {
    isLoading.value = false
  }
}

const saveTodo = async () => {
  if (titleError.value) return
  
  try {
    isLoading.value = true
    
    if (editingTodo.value) {
      await todoStore.updateTodo(editingTodo.value.id, todoForm.value)
    } else {
      await todoStore.createTodo(todoForm.value)
    }
    
    closeModal()
  } catch (error) {
    console.error('Save todo failed:', error)
  } finally {
    isLoading.value = false
  }
}

const clearCompleted = async () => {
  if (!confirm('确定要清除所有已完成的任务吗？')) return
  
  try {
    isLoading.value = true
    await todoStore.clearCompleted()
  } catch (error) {
    console.error('Clear completed failed:', error)
  } finally {
    isLoading.value = false
  }
}

const closeModal = () => {
  showAddTodo.value = false
  editingTodo.value = null
  todoForm.value = {
    title: '',
    description: '',
    status: 'todo',
    priority: '',
    due_date: '',
    estimated_hours: null,
    tags: [],
    parent_id: ''
  }
}

// 批量操作
const toggleSelection = (todoId) => {
  const index = selectedTodos.value.indexOf(todoId)
  if (index > -1) {
    selectedTodos.value.splice(index, 1)
  } else {
    selectedTodos.value.push(todoId)
  }
}

const clearSelection = () => {
  selectedTodos.value = []
}

const batchComplete = async () => {
  if (selectedTodos.value.length === 0) return
  
  try {
    isLoading.value = true
    await todoStore.batchCompleteTodos(selectedTodos.value)
    clearSelection()
  } catch (error) {
    console.error('Batch complete failed:', error)
  } finally {
    isLoading.value = false
  }
}

const batchDelete = async () => {
  if (selectedTodos.value.length === 0) return
  if (!confirm(`确定要删除选中的 ${selectedTodos.value.length} 个任务吗？`)) return
  
  try {
    isLoading.value = true
    await todoStore.batchDeleteTodos(selectedTodos.value)
    clearSelection()
  } catch (error) {
    console.error('Batch delete failed:', error)
  } finally {
    isLoading.value = false
  }
}

// 子任务管理
const createSubtask = async (parentId) => {
  todoForm.value.parent_id = parentId
  showAddTodo.value = true
}

// 时间跟踪
const startTimeTracking = async (todoId) => {
  try {
    await todoStore.startTimeTracking(todoId)
  } catch (error) {
    console.error('Start time tracking failed:', error)
  }
}

const stopTimeTracking = async (todoId) => {
  const hours = prompt('请输入实际工作时间（小时）:')
  if (hours && !isNaN(parseFloat(hours))) {
    try {
      await todoStore.stopTimeTracking(todoId, parseFloat(hours))
    } catch (error) {
      console.error('Stop time tracking failed:', error)
    }
  }
}

// 看板视图方法
const getTasksByStatus = (status) => {
  return displayTodos.value.filter(todo => {
    if (status === 'todo') return todo.status === 'todo' || !todo.status
    return todo.status === status
  })
}

// 分组标题
const getGroupTitle = (groupKey) => {
  const titles = {
    overdue: '逾期任务',
    today: '今日任务',
    tomorrow: '明日任务',
    thisWeek: '本周任务',
    later: '稍后任务',
    noDate: '无日期任务'
  }
  return titles[groupKey] || groupKey
}

// 工具方法
const getPriorityText = (priority) => {
  return PRIORITY_LABELS[priority] || ''
}

const getTagStyle = (tagId) => {
  const tag = todoStore.allTags.find(t => t.id === tagId)
  if (!tag) return {}
  return {
    backgroundColor: tag.bg_color,
    color: tag.color
  }
}

const getTagColor = (tagId) => {
  const tag = todoStore.allTags.find(t => t.id === tagId)
  return tag ? tag.color : '#6b7280'
}

const getTagName = (tagId) => {
  const tag = todoStore.allTags.find(t => t.id === tagId)
  return tag ? tag.name : '未知标签'
}

const formatDate = (dateStr) => {
  return dayjs(dateStr).format('MM/DD')
}

const isOverdue = (dateStr) => {
  return dayjs(dateStr).isBefore(dayjs(), 'day')
}
</script>

<style scoped>
.todo-list {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-background-secondary);
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--color-border);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.view-toggle {
  display: flex;
  background: var(--color-border);
  padding: 2px;
  border-radius: 8px;
}

.toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 6px;
  color: var(--color-text-secondary);
  transition: all 0.2s;
}

.toggle-btn:hover {
  color: var(--color-text-primary);
}

.toggle-btn.active {
  background: var(--color-background);
  color: var(--color-primary);
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.list-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

.calendar-container {
  flex: 1;
  overflow: hidden;
  /* padding: 20px; Calendar has its own padding/layout */
}

.list-header h2 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 24px;
}

.btn-create {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--color-primary);
  color: var(--color-background);
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: background 0.2s;
}

.btn-create:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.btn-create:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.todo-stats {
  display: flex;
  gap: 20px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--color-text-secondary);
  font-size: 14px;
}

.todo-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border);
}

.todo-filters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

.tag-filters {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-left: 12px;
  padding-left: 12px;
  border-left: 1px solid var(--color-border);
}

.tag-filter-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: transparent;
  border: 1px solid currentColor;
  padding: 4px 8px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s;
  opacity: 0.8;
}

.tag-filter-btn:hover {
  opacity: 1;
  transform: translateY(-1px);
}

.tag-filter-btn.active {
  opacity: 1;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.tag-filter-btn .tag-color {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.tag-filter-btn .tag-count {
  background: rgba(255, 255, 255, 0.2);
  padding: 1px 4px;
  border-radius: 6px;
  font-size: 10px;
  min-width: 14px;
  text-align: center;
}

.filter-btn {
  background: var(--color-border);
  color: var(--color-text-primary);
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.filter-btn:hover {
  background: var(--color-border-secondary);
}

.filter-btn.active {
  background: var(--color-primary);
  color: var(--color-background);
}

.btn-action {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--color-border);
  color: var(--color-text-primary);
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.btn-action:hover:not(:disabled) {
  background: var(--color-border-secondary);
}

.btn-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.todos {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.todo-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.todo-item:hover {
  border-color: var(--color-border-secondary);
}

.todo-item.completed {
  opacity: 0.7;
}

.todo-item.completed .todo-title {
  text-decoration: line-through;
  color: var(--color-text-tertiary);
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

.todo-title {
  margin: 0 0 6px 0;
  color: var(--color-text-primary);
  font-size: 16px;
  font-weight: 600;
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

.todo-meta {
  display: flex;
  gap: 12px;
  align-items: center;
}

.todo-date {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--color-text-tertiary);
  font-size: 12px;
}

.todo-priority {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
}

.todo-priority.high {
  color: var(--color-error);
  background: color-mix(in srgb, var(--color-error), transparent 90%);
}

.todo-priority.medium {
  color: var(--color-warning);
  background: color-mix(in srgb, var(--color-warning), transparent 90%);
}

.todo-priority.low {
  color: var(--color-success);
  background: color-mix(in srgb, var(--color-success), transparent 90%);
}

.todo-actions {
  display: flex;
  gap: 8px;
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

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--color-overlay);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: var(--color-background);
  border: 1px solid var(--color-border-secondary);
  border-radius: 12px;
  width: 500px;
  max-width: 90vw;
}

.tag-manager-modal {
  width: 600px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.tag-manager-modal .modal-body {
  flex: 1;
  overflow: hidden;
  padding: 0;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--color-border);
}

.modal-header h3 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 18px;
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
  font-size: 14px;
  margin-bottom: 6px;
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  background: var(--color-border);
  border: 1px solid var(--color-border-secondary);
  border-radius: 6px;
  padding: 10px 12px;
  color: var(--color-text-primary);
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  border-color: var(--color-primary);
}

.form-input.error {
  border-color: var(--color-error);
}

.form-input::placeholder,
.form-textarea::placeholder {
  color: var(--color-text-tertiary);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.error-message {
  color: var(--color-error);
  font-size: 12px;
  margin-top: 4px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 20px;
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
  font-size: 14px;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.btn-primary {
  background: var(--color-primary);
  color: var(--color-background);
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--color-border);
  color: var(--color-text-primary);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--color-border-secondary);
}

.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>