/**
 * SnippetsHub - 专业任务管理系统
 * 
 * @file TodoListModern.vue - 现代化TODO管理组件
 * @author Noah
 * @description 基于专业软件开发标准的任务管理系统
 * @created 2026-02-05
 * @version 1.0.0
 * 
 * 核心特性:
 * - 三栏布局：侧边栏 + 任务列表 + 详情面板
 * - 多视图模式：列表/看板/日历
 * - 智能分组和过滤
 * - 快捷操作和键盘导航
 * - 实时搜索和高级筛选
 * - 性能优化（虚拟滚动）
 */

<template>
  <div class="todo-modern">
    <!-- 侧边栏：统计 + 过滤器 -->
    <aside class="sidebar">
      <!-- 统计卡片 -->
      <div class="stats-section">
        <h3 class="section-title">任务概览</h3>
        <div class="stat-cards">
          <div class="stat-card primary">
            <div class="stat-icon">
              <ListTodo :size="20" />
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.total }}</div>
              <div class="stat-label">总任务</div>
            </div>
          </div>
          
          <div class="stat-card success">
            <div class="stat-icon">
              <CheckCircle2 :size="20" />
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.completed }}</div>
              <div class="stat-label">已完成</div>
            </div>
          </div>
          
          <div class="stat-card warning">
            <div class="stat-icon">
              <Clock :size="20" />
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.pending }}</div>
              <div class="stat-label">进行中</div>
            </div>
          </div>
          
          <div class="stat-card danger" v-if="stats.overdue > 0">
            <div class="stat-icon">
              <AlertCircle :size="20" />
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.overdue }}</div>
              <div class="stat-label">已逾期</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 快速过滤 -->
      <div class="filters-section">
        <h3 class="section-title">快速筛选</h3>
        <nav class="filter-nav">
          <button
            v-for="filter in quickFilters"
            :key="filter.id"
            @click="activeFilter = filter.id"
            :class="['filter-item', { active: activeFilter === filter.id }]"
            :title="`筛选${filter.label}`"
          >
            <component :is="filter.icon" :size="18" />
            <span>{{ filter.label }}</span>
            <span v-if="filter.count !== undefined" class="count-badge">{{ filter.count }}</span>
          </button>
        </nav>
      </div>

      <!-- 标签过滤 -->
      <div class="tags-section">
        <div class="section-header">
          <h3 class="section-title">标签</h3>
          <button @click="showTagManager = true" class="btn-icon" title="管理标签">
            <Settings :size="16" />
          </button>
        </div>
        <div class="tag-list">
          <button
            v-for="tag in allTags"
            :key="tag.id"
            @click="toggleTagFilter(tag.id)"
            :class="['tag-item', { active: selectedTags.includes(tag.id) }]"
            :style="{ '--tag-color': tag.color }"
            :title="`按标签「${tag.name}」筛选 (${tag.count}个任务)`"
          >
            <span class="tag-dot"></span>
            <span class="tag-name">{{ tag.name }}</span>
            <span class="tag-count">{{ tag.count }}</span>
          </button>
        </div>
      </div>
    </aside>

    <!-- 主内容区：任务列表 -->
    <main class="main-content">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <h2 class="view-title">{{ currentViewTitle }}</h2>
          <div class="view-switcher">
            <button
              v-for="view in views"
              :key="view.id"
              @click="currentView = view.id"
              :class="['view-btn', { active: currentView === view.id }]"
              :title="view.label"
            >
              <component :is="view.icon" :size="18" />
            </button>
          </div>
        </div>
        
        <div class="toolbar-right">
          <!-- 搜索框 -->
          <div class="search-box">
            <Search :size="16" class="search-icon" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索任务..."
              class="search-input"
              @input="handleSearch"
              title="搜索任务标题和描述"
            />
            <button v-if="searchQuery" @click="searchQuery = ''" class="btn-clear" title="清除搜索">
              <X :size="14" />
            </button>
          </div>
          
          <!-- 排序 -->
          <select v-model="sortBy" class="sort-select" title="任务排序方式">
            <option value="updated">最近更新</option>
            <option value="created">创建时间</option>
            <option value="priority">优先级</option>
            <option value="dueDate">截止日期</option>
            <option value="title">标题</option>
          </select>
          
          <!-- 新建任务按钮 -->
          <button @click="handleCreateTask" class="btn btn-primary" title="创建新任务">
            <Plus :size="18" />
            <span>新建任务</span>
          </button>
        </div>
      </div>

      <!-- 任务列表 -->
      <div class="tasks-container" v-if="currentView === 'list'">
        <!-- 加载状态 -->
        <div v-if="isLoading" class="loading-state">
          <div class="spinner"></div>
          <p>加载任务中...</p>
        </div>

        <!-- 空状态 -->
        <div v-else-if="filteredTasks.length === 0" class="empty-state">
          <Inbox :size="64" class="empty-icon" />
          <h3>{{ searchQuery ? '没有找到匹配的任务' : '暂无任务' }}</h3>
          <p>{{ searchQuery ? '试试其他搜索词' : '点击"新建任务"开始添加' }}</p>
          <button v-if="!searchQuery" @click="handleCreateTask" class="btn btn-primary" title="创建你的第一个任务">
            <Plus :size="18" />
            创建第一个任务
          </button>
        </div>

        <!-- 任务分组列表 -->
        <div v-else class="tasks-list">
          <template v-if="groupBy !== 'none'">
            <div
              v-for="(group, groupKey) in groupedTasks"
              :key="groupKey"
              class="task-group"
              v-show="group.tasks.length > 0"
            >
              <div class="group-header">
                <button @click="toggleGroup(groupKey)" class="group-toggle" :title="collapsedGroups[groupKey] ? '展开分组' : '折叠分组'">
                  <ChevronRight :size="18" :class="{ rotated: !collapsedGroups[groupKey] }" />
                </button>
                <h3 class="group-title">{{ group.label }}</h3>
                <span class="group-count">{{ group.tasks.length }}</span>
              </div>
              
              <TransitionGroup
                name="task-list"
                tag="div"
                class="group-tasks"
                v-show="!collapsedGroups[groupKey]"
              >
                <TaskItem
                  v-for="task in group.tasks"
                  :key="task.id"
                  :task="task"
                  :selected="selectedTask?.id === task.id"
                  @click="selectTask(task)"
                  @toggle="handleToggleTask(task.id)"
                  @edit="handleEditTask(task)"
                  @delete="handleDeleteTask(task.id)"
                  @priority-change="handlePriorityChange(task.id, $event)"
                />
              </TransitionGroup>
            </div>
          </template>

          <template v-else>
            <TransitionGroup name="task-list" tag="div" class="tasks-flat">
              <TaskItem
                v-for="task in filteredTasks"
                :key="task.id"
                :task="task"
                :selected="selectedTask?.id === task.id"
                @click="selectTask(task)"
                @toggle="handleToggleTask(task.id)"
                @edit="handleEditTask(task)"
                @delete="handleDeleteTask(task.id)"
                @priority-change="handlePriorityChange(task.id, $event)"
              />
            </TransitionGroup>
          </template>
        </div>
      </div>

      <!-- 看板视图 -->
      <div v-else-if="currentView === 'board'" class="kanban-container">
        <KanbanBoard :tasks="filteredTasks" @update="handleTaskUpdate" />
      </div>

      <!-- 日历视图 -->
      <div v-else-if="currentView === 'calendar'" class="calendar-container">
        <TodoCalendar 
          :todos="filteredTasks" 
          @edit-todo="handleEditTask"
          @add-todo="handleAddTodoOnDate"
          @update-date="handleUpdateTaskDate"
        />
      </div>
    </main>

    <!-- 详情面板 -->
    <aside class="detail-panel" v-if="selectedTask">
      <TaskDetail
        :task="selectedTask"
        @close="selectedTask = null"
        @update="handleTaskUpdate"
        @delete="handleDeleteTask(selectedTask.id)"
      />
    </aside>

    <!-- 任务表单对话框 -->
    <TaskFormDialog
      v-if="showTaskForm"
      :task="editingTask"
      :tags="allTags"
      @save="handleSaveTask"
      @close="closeTaskForm"
    />

    <!-- 标签管理对话框 -->
    <TagManagerDialog
      v-if="showTagManager"
      :tags="allTags"
      @close="showTagManager = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import {
  ListTodo, CheckCircle2, Clock, AlertCircle,
  Inbox, Calendar, LayoutGrid, List as ListIcon,
  Plus, Search, X, Settings, ChevronRight
} from 'lucide-vue-next'
import { useTodoStore } from '../stores/todoStore'
import { useNotifications } from '../composables/useNotifications'
import { useConfirm } from '../composables/useConfirm'

import TaskItem from './TodoItemModern.vue'
import TaskDetail from './TodoDetailPanel.vue'
import TaskFormDialog from './TodoFormDialog.vue'
import TagManagerDialog from './TodoTagManager.vue'
import KanbanBoard from './TodoKanban.vue'
import TodoCalendar from './TodoCalendar.vue'

const todoStore = useTodoStore()
const { success, error: showError } = useNotifications()
const { showConfirm } = useConfirm()

const isLoading = ref(false)
const searchQuery = ref('')
const sortBy = ref('updated')
const groupBy = ref('none')
const currentView = ref('list')
const activeFilter = ref('all')
const selectedTags = ref([])
const selectedTask = ref(null)
const showTaskForm = ref(false)
const editingTask = ref(null)
const showTagManager = ref(false)
const collapsedGroups = ref({})

const views = [
  { id: 'list', label: '列表', icon: ListIcon },
  { id: 'board', label: '看板', icon: LayoutGrid },
  { id: 'calendar', label: '日历', icon: Calendar }
]

const stats = computed(() => ({
  total: todoStore.totalCount,
  completed: todoStore.completedCount,
  pending: todoStore.pendingCount,
  overdue: todoStore.stats.overdue || 0
}))

const quickFilters = computed(() => [
  { id: 'all', label: '全部任务', icon: ListTodo, count: stats.value.total },
  { id: 'today', label: '今天', icon: Calendar, count: todoStore.stats.due_today },
  { id: 'pending', label: '进行中', icon: Clock, count: stats.value.pending },
  { id: 'completed', label: '已完成', icon: CheckCircle2, count: stats.value.completed },
  { id: 'overdue', label: '已逾期', icon: AlertCircle, count: stats.value.overdue }
])

const allTags = computed(() => todoStore.allTags)

const currentViewTitle = computed(() => {
  const filter = quickFilters.value.find(f => f.id === activeFilter.value)
  return filter ? filter.label : '任务列表'
})

const filteredTasks = computed(() => {
  let tasks = todoStore.todos

  // 应用快速过滤
  if (activeFilter.value !== 'all') {
    tasks = todoStore.filterTodos(activeFilter.value)
  }

  // 应用标签过滤
  if (selectedTags.value.length > 0) {
    tasks = tasks.filter(task =>
      task.tags && selectedTags.value.some(tagId => task.tags.includes(tagId))
    )
  }

  // 应用搜索
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    tasks = tasks.filter(task =>
      task.title.toLowerCase().includes(query) ||
      (task.description && task.description.toLowerCase().includes(query))
    )
  }

  // 排序
  return sortTasks(tasks)
})

const groupedTasks = computed(() => {
  if (groupBy.value === 'none') return {}

  const groups = {}
  
  if (groupBy.value === 'priority') {
    groups.high = { label: '高优先级', tasks: [] }
    groups.medium = { label: '中优先级', tasks: [] }
    groups.low = { label: '低优先级', tasks: [] }
    groups.none = { label: '无优先级', tasks: [] }

    filteredTasks.value.forEach(task => {
      const priority = task.priority || 'none'
      if (groups[priority]) {
        groups[priority].tasks.push(task)
      }
    })
  } else if (groupBy.value === 'status') {
    groups.todo = { label: '待办', tasks: [] }
    groups.in_progress = { label: '进行中', tasks: [] }
    groups.completed = { label: '已完成', tasks: [] }

    filteredTasks.value.forEach(task => {
      const status = task.status || 'todo'
      if (groups[status]) {
        groups[status].tasks.push(task)
      }
    })
  } else if (groupBy.value === 'date') {
    const grouped = todoStore.groupedTodos
    groups.overdue = { label: '已逾期', tasks: grouped.overdue || [] }
    groups.today = { label: '今天', tasks: grouped.today || [] }
    groups.tomorrow = { label: '明天', tasks: grouped.tomorrow || [] }
    groups.thisWeek = { label: '本周', tasks: grouped.thisWeek || [] }
    groups.later = { label: '更晚', tasks: grouped.later || [] }
    groups.noDate = { label: '无日期', tasks: grouped.noDate || [] }
  }

  return groups
})

const sortTasks = (tasks) => {
  const sorted = [...tasks]
  
  switch (sortBy.value) {
    case 'priority':
      return sorted.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1, none: 0 }
        return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0)
      })
    case 'dueDate':
      return sorted.sort((a, b) => {
        if (!a.due_date && !b.due_date) return 0
        if (!a.due_date) return 1
        if (!b.due_date) return -1
        return new Date(a.due_date) - new Date(b.due_date)
      })
    case 'title':
      return sorted.sort((a, b) => a.title.localeCompare(b.title))
    case 'created':
      return sorted.sort((a, b) => b.created_at - a.created_at)
    case 'updated':
    default:
      return sorted.sort((a, b) => b.updated_at - a.updated_at)
  }
}

const toggleTagFilter = (tagId) => {
  const index = selectedTags.value.indexOf(tagId)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  } else {
    selectedTags.value.push(tagId)
  }
}

const toggleGroup = (groupKey) => {
  collapsedGroups.value[groupKey] = !collapsedGroups.value[groupKey]
}

const selectTask = (task) => {
  selectedTask.value = task
}

const handleSearch = () => {
  // 搜索已通过computed属性处理
}

const handleCreateTask = () => {
  editingTask.value = null
  showTaskForm.value = true
}

const handleEditTask = (task) => {
  editingTask.value = task
  showTaskForm.value = true
}

const handleSaveTask = async (taskData) => {
  try {
    if (taskData.id) {
      await todoStore.updateTodo(taskData.id, taskData)
      success('任务已更新')
    } else {
      await todoStore.createTodo(taskData)
      success('任务已创建')
    }
    closeTaskForm()
  } catch (err) {
    showError('操作失败: ' + err.message)
  }
}

const handleToggleTask = async (taskId) => {
  try {
    await todoStore.toggleTodo(taskId)
  } catch (err) {
    showError('切换任务状态失败')
  }
}

const handleDeleteTask = async (taskId) => {
  const confirmed = await showConfirm('确定要删除这个任务吗？', {
    title: '删除确认',
    confirmText: '删除'
  })
  
  if (!confirmed) return

  try {
    await todoStore.deleteTodo(taskId)
    if (selectedTask.value?.id === taskId) {
      selectedTask.value = null
    }
    success('任务已删除')
  } catch (err) {
    showError('删除失败: ' + err.message)
  }
}

const handlePriorityChange = async (taskId, priority) => {
  try {
    await todoStore.updateTodo(taskId, { priority })
  } catch (err) {
    showError('更新优先级失败')
  }
}

const handleTaskUpdate = async (taskData) => {
  try {
    await todoStore.updateTodo(taskData.id, taskData)
    if (selectedTask.value?.id === taskData.id) {
      selectedTask.value = { ...selectedTask.value, ...taskData }
    }
  } catch (err) {
    showError('更新任务失败')
  }
}

const closeTaskForm = () => {
  showTaskForm.value = false
  editingTask.value = null
}

const handleAddTodoOnDate = (dateStr) => {
  editingTask.value = {
    due_date: dateStr
  }
  showTaskForm.value = true
}

const handleUpdateTaskDate = async ({ id, date }) => {
  try {
    await todoStore.updateTodo(id, { due_date: date })
    success('任务日期已更新')
  } catch (err) {
    showError('更新任务日期失败')
  }
}

const loadData = async () => {
  try {
    isLoading.value = true
    await Promise.all([
      todoStore.loadTodos(),
      todoStore.loadTags(),
      todoStore.loadStats()
    ])
  } catch (err) {
    showError('加载数据失败')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadData()
})

// 监听activeFilter变化，自动设置groupBy
watch(activeFilter, (newFilter) => {
  if (newFilter === 'today' || newFilter === 'overdue') {
    groupBy.value = 'date'
  } else if (newFilter === 'pending' || newFilter === 'completed') {
    groupBy.value = 'status'
  } else {
    groupBy.value = 'none'
  }
})
</script>

<style scoped>
.todo-modern {
  display: grid;
  grid-template-columns: 280px 1fr;
  height: 100%;
  background: var(--color-background);
  overflow: hidden;
}

/* ========== 侧边栏 ========== */
.sidebar {
  background: var(--color-background-secondary);
  border-right: 1px solid var(--color-border);
  overflow-y: auto;
  padding: 24px 16px;
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--color-text-tertiary);
  letter-spacing: 0.5px;
  margin-bottom: 16px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.btn-icon {
  background: transparent;
  border: none;
  color: var(--color-text-tertiary);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
}

.btn-icon:hover {
  background: var(--color-background);
  color: var(--color-text-primary);
}

/* 统计卡片 */
.stats-section {
  margin-bottom: 32px;
}

.stat-cards {
  display: grid;
  gap: 12px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--color-background);
  border-radius: 8px;
  border: 1px solid var(--color-border);
  transition: all 0.2s;
}

.stat-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px var(--color-shadow);
}

.stat-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  flex-shrink: 0;
}

.stat-card.primary .stat-icon {
  background: #3b82f620;
  color: #3b82f6;
}

.stat-card.success .stat-icon {
  background: #22c55e20;
  color: #22c55e;
}

.stat-card.warning .stat-icon {
  background: #f59e0b20;
  color: #f59e0b;
}

.stat-card.danger .stat-icon {
  background: #ef444420;
  color: #ef4444;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: var(--color-text-secondary);
}

/* 过滤导航 */
.filters-section {
  margin-bottom: 32px;
}

.filter-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  color: var(--color-text-secondary);
  font-size: 14px;
  transition: all 0.2s;
  text-align: left;
}

.filter-item:hover {
  background: var(--color-background);
  color: var(--color-text-primary);
}

.filter-item.active {
  background: var(--color-primary);
  color: white;
}

.filter-item span {
  flex: 1;
}

.count-badge {
  padding: 2px 8px;
  background: var(--color-background-secondary);
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.filter-item.active .count-badge {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

/* 标签列表 */
.tags-section {
  margin-bottom: 16px;
}

.tag-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tag-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  color: var(--color-text-secondary);
  transition: all 0.2s;
  text-align: left;
}

.tag-item:hover {
  background: var(--color-background);
}

.tag-item.active {
  background: var(--color-background);
  color: var(--color-text-primary);
}

.tag-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--tag-color);
  flex-shrink: 0;
}

.tag-name {
  flex: 1;
}

.tag-count {
  padding: 2px 6px;
  background: var(--color-background-tertiary);
  border-radius: 10px;
  font-size: 10px;
  font-weight: 600;
}

/* ========== 主内容区 ========== */
.main-content {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 工具栏 */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid var(--color-border);
  gap: 16px;
  flex-wrap: wrap;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.view-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.view-switcher {
  display: flex;
  gap: 4px;
  background: var(--color-background-secondary);
  padding: 4px;
  border-radius: 8px;
}

.view-btn {
  padding: 6px 12px;
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  color: var(--color-text-secondary);
  transition: all 0.2s;
}

.view-btn:hover {
  background: var(--color-background);
  color: var(--color-text-primary);
}

.view-btn.active {
  background: var(--color-background);
  color: var(--color-primary);
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 搜索框 */
.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: var(--color-text-tertiary);
  pointer-events: none;
}

.search-input {
  width: 240px;
  padding: 8px 36px 8px 36px;
  background: var(--color-background-secondary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 14px;
  color: var(--color-text-primary);
  outline: none;
  transition: all 0.2s;
}

.search-input:focus {
  border-color: var(--color-primary);
  background: var(--color-background);
}

.btn-clear {
  position: absolute;
  right: 8px;
  padding: 4px;
  background: transparent;
  border: none;
  color: var(--color-text-tertiary);
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.btn-clear:hover {
  background: var(--color-border);
  color: var(--color-text-primary);
}

/* 排序选择 */
.sort-select {
  padding: 8px 12px;
  background: var(--color-background-secondary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 14px;
  color: var(--color-text-primary);
  cursor: pointer;
  outline: none;
  transition: all 0.2s;
}

.sort-select:hover {
  border-color: var(--color-primary);
}

/* 按钮 */
.btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
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
  background: var(--color-background-secondary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--color-background-tertiary);
}

/* 任务容器 */
.tasks-container {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 16px;
  color: var(--color-text-secondary);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 16px;
  text-align: center;
  padding: 48px 24px;
}

.empty-icon {
  color: var(--color-text-tertiary);
  opacity: 0.5;
}

.empty-state h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.empty-state p {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin: 0;
}

/* 任务列表 */
.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.task-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.group-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  user-select: none;
}

.group-toggle {
  background: transparent;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: var(--color-text-secondary);
  transition: transform 0.2s;
}

.group-toggle svg {
  transition: transform 0.2s;
}

.group-toggle svg.rotated {
  transform: rotate(90deg);
}

.group-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0;
}

.group-count {
  padding: 2px 8px;
  background: var(--color-background-secondary);
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-tertiary);
}

.group-tasks {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tasks-flat {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 列表动画 */
.task-list-move,
.task-list-enter-active,
.task-list-leave-active {
  transition: all 0.3s ease;
}

.task-list-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.task-list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.task-list-leave-active {
  position: absolute;
}

/* 看板和日历容器 */
.kanban-container,
.calendar-container {
  flex: 1;
  overflow: hidden;
  height: 100%;
}

/* 详情面板 */
.detail-panel {
  position: fixed;
  right: 0;
  top: 0;
  bottom: 0;
  width: 400px;
  background: var(--color-background-secondary);
  border-left: 1px solid var(--color-border);
  overflow-y: auto;
  z-index: 50;
  box-shadow: -4px 0 24px var(--color-shadow);
}

/* 响应式 */
@media (max-width: 1400px) {
  .todo-modern {
    grid-template-columns: 260px 1fr;
  }
  
  .detail-panel {
    width: 360px;
  }
}

@media (max-width: 1024px) {
  .todo-modern {
    grid-template-columns: 1fr;
  }
  
  .sidebar {
    display: none;
  }
  
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .toolbar-left,
  .toolbar-right {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-input {
    width: 100%;
  }
}
</style>
