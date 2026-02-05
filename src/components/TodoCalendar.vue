/**
 * SnippetsHub - 专业代码片段管理工具
 * 
 * @file TodoCalendar.vue - 任务日历视图组件
 * @author Noah
 * @description 以日历形式展示任务，支持拖拽调整日期和月份切换
 * @created 2026-02-02
 * @version 1.0.0
 * 
 * 功能特性:
 * - 月视图日历展示
 * - 支持拖拽调整任务日期
 * - 快速添加任务入口
 * - 任务状态可视化
 */
<template>
  <div class="calendar-view">
    <div class="calendar-header">
      <div class="month-navigation">
        <button @click="prevMonth" class="nav-btn">
          <ChevronLeft :size="20" />
        </button>
        <h3>{{ currentMonthFormatted }}</h3>
        <button @click="nextMonth" class="nav-btn">
          <ChevronRight :size="20" />
        </button>
      </div>
      <button @click="goToToday" class="btn-today">
        今天
      </button>
    </div>

    <div class="calendar-grid">
      <!-- Week days header -->
      <div v-for="day in weekDays" :key="day" class="week-day">
        {{ day }}
      </div>

      <!-- Calendar days -->
      <div 
        v-for="(day, index) in calendarDays" 
        :key="index"
        class="calendar-day"
        :class="{
          'other-month': !day.isCurrentMonth,
          'today': day.isToday,
          'weekend': day.isWeekend,
          'selected': isSelectedDate(day.date)
        }"
        @click="handleDayClick(day.date)"
        @dragover.prevent="handleDragOver"
        @drop="handleDrop($event, day.date)"
        @dragenter.prevent="handleDragEnter"
        @dragleave.prevent="handleDragLeave"
      >
        <div class="day-header">
          <span class="day-number">{{ day.dayNumber }}</span>
          <button v-if="day.isCurrentMonth" @click.stop="addTodoOnDate(day.date)" class="btn-add-mini">
            <Plus :size="12" />
          </button>
        </div>
        
        <div class="day-content">
          <div 
            v-for="todo in getTodosForDate(day.date)" 
            :key="todo.id"
            class="calendar-todo"
            :class="{ 
              'completed': todo.completed, 
              [todo.priority]: true, 
              'dragging': isDragging === todo.id,
              'no-due-date': !todo.due_date
            }"
            @click.stop="editTodo(todo)"
            draggable="true"
            @dragstart="handleDragStart($event, todo)"
            @dragend="handleDragEnd"
            :title="todo.due_date ? `${todo.title} (截止: ${todo.due_date})` : `${todo.title} (无截止日期)`"
          >
            <span class="todo-dot"></span>
            <span class="todo-text">{{ todo.title }}</span>
            <span v-if="!todo.due_date" class="no-date-indicator" title="无截止日期">○</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import dayjs from 'dayjs'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-vue-next'
import { useTodoStore } from '../stores/todoStore'

const props = defineProps({
  todos: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['edit-todo', 'add-todo', 'update-date'])
const todoStore = useTodoStore()

const isDragging = ref(null)

const currentDate = ref(dayjs())
const today = dayjs()
const selectedDate = ref(null)

const weekDays = ['日', '一', '二', '三', '四', '五', '六']

const currentMonthFormatted = computed(() => {
  return currentDate.value.format('YYYY年 MM月')
})

const calendarDays = computed(() => {
  const startOfMonth = currentDate.value.startOf('month')
  const endOfMonth = currentDate.value.endOf('month')
  const startDayOfWeek = startOfMonth.day()
  const daysInMonth = currentDate.value.daysInMonth()
  
  // Calculate days from previous month to fill the first row
  const days = []
  const prevMonth = currentDate.value.subtract(1, 'month')
  const daysInPrevMonth = prevMonth.daysInMonth()
  const todayStr = today.format('YYYY-MM-DD')
  
  for (let i = 0; i < startDayOfWeek; i++) {
    const day = daysInPrevMonth - startDayOfWeek + i + 1
    const date = prevMonth.date(day)
    const dateStr = date.format('YYYY-MM-DD')
    days.push({
      date: dateStr,
      dayNumber: day,
      isCurrentMonth: false,
      isToday: date.isSame(today, 'day'),
      isWeekend: date.day() === 0 || date.day() === 6
    })
  }
  
  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    const date = currentDate.value.date(i)
    const dateStr = date.format('YYYY-MM-DD')
    days.push({
      date: dateStr,
      dayNumber: i,
      isCurrentMonth: true,
      isToday: date.isSame(today, 'day'),
      isWeekend: date.day() === 0 || date.day() === 6
    })
  }
  
  // Next month days to fill the grid (assuming 6 rows max -> 42 cells)
  const remainingCells = 42 - days.length
  const nextMonth = currentDate.value.add(1, 'month')
  
  for (let i = 1; i <= remainingCells; i++) {
    const date = nextMonth.date(i)
    const dateStr = date.format('YYYY-MM-DD')
    days.push({
      date: dateStr,
      dayNumber: i,
      isCurrentMonth: false,
      isToday: date.isSame(today, 'day'),
      isWeekend: date.day() === 0 || date.day() === 6
    })
  }
  
  return days
})

const prevMonth = () => {
  currentDate.value = currentDate.value.subtract(1, 'month')
}

const nextMonth = () => {
  currentDate.value = currentDate.value.add(1, 'month')
}

const goToToday = () => {
  currentDate.value = dayjs()
}

const isSelectedDate = (dateStr) => {
  return selectedDate.value === dateStr
}

const getTodosForDate = (dateStr) => {
  const todosWithDueDate = props.todos.filter(todo => {
    if (!todo.due_date) return false
    return dayjs(todo.due_date).format('YYYY-MM-DD') === dateStr
  })
  
  // 如果是今天，也显示没有due_date的未完成任务
  const isToday = dayjs(dateStr).isSame(dayjs(), 'day')
  if (isToday) {
    const todosWithoutDueDate = props.todos.filter(todo => {
      return !todo.due_date && !todo.completed
    })
    return [...todosWithDueDate, ...todosWithoutDueDate]
  }
  
  return todosWithDueDate
}

const handleDayClick = (dateStr) => {
  selectedDate.value = dateStr
}

const editTodo = (todo) => {
  emit('edit-todo', todo)
}

const addTodoOnDate = (dateStr) => {
  emit('add-todo', dateStr)
}

// Drag and Drop
const handleDragStart = (e, todo) => {
  isDragging.value = todo.id
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', todo.id)
  e.dataTransfer.setData('application/json', JSON.stringify(todo))
  // Add a ghost styling or custom drag image if needed
}

const handleDragEnd = () => {
  isDragging.value = null
  // Remove any drop target highlighting
  document.querySelectorAll('.calendar-day.drag-over').forEach(el => {
    el.classList.remove('drag-over')
  })
}

const handleDragOver = (e) => {
  e.dataTransfer.dropEffect = 'move'
}

const handleDragEnter = (e) => {
  const target = e.target.closest('.calendar-day')
  if (target) {
    target.classList.add('drag-over')
  }
}

const handleDragLeave = (e) => {
  const target = e.target.closest('.calendar-day')
  // Simply removing might flicker if hovering children, check relation
  if (target && !target.contains(e.relatedTarget)) {
    target.classList.remove('drag-over')
  }
}

const handleDrop = (e, dateStr) => {
  const target = e.target.closest('.calendar-day')
  if (target) {
    target.classList.remove('drag-over')
  }

  const todoId = e.dataTransfer.getData('text/plain')
  if (todoId) {
    emit('update-date', { id: todoId, date: dateStr })
  }
}

</script>

<style scoped>
.calendar-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-background);
  color: var(--color-text-primary);
  overflow: hidden;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--color-border);
}

.month-navigation {
  display: flex;
  align-items: center;
  gap: 16px;
}

.month-navigation h3 {
  margin: 0;
  font-size: 18px;
  min-width: 120px;
  text-align: center;
}

.nav-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.nav-btn:hover {
  background-color: var(--color-border);
}

.btn-today {
  background: var(--color-border);
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  color: var(--color-text-primary);
  transition: background-color 0.2s;
}

.btn-today:hover {
  background-color: var(--color-border-secondary);
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-template-rows: auto repeat(6, 1fr);
  flex: 1;
  overflow-y: auto;
  height: 100%;
}

.week-day {
  padding: 12px 8px;
  text-align: center;
  font-weight: 600;
  font-size: 13px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-background-secondary);
  position: sticky;
  top: 0;
  color: var(--color-text-secondary);
  z-index: 10;
}

.calendar-day {
  height: 100%;
  min-height: 120px;
  border-right: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
  padding: 8px;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: background-color 0.15s;
  overflow: hidden;
}

.calendar-day:nth-child(7n) {
  border-right: none;
}

.calendar-day:hover {
  background-color: var(--color-background-secondary);
}

.calendar-day.drag-over {
  background-color: rgba(var(--color-primary), 0.1);
  background-color: color-mix(in srgb, var(--color-primary), transparent 90%);
  border: 2px dashed var(--color-primary);
}

.calendar-day.other-month {
  background-color: var(--color-background-secondary); /* slightly different/darker */
  opacity: 0.5;
}

.calendar-day.today {
  background-color: var(--color-background-secondary);
  border: 2px solid var(--color-primary);
  position: relative;
  z-index: 1;
}

.calendar-day.weekend {
  background-color: rgba(var(--color-primary-rgb), 0.02); /* very subtle tint */
  background-color: color-mix(in srgb, var(--color-primary), transparent 98%);
}

.calendar-day.today .day-number {
  color: var(--color-primary);
  font-weight: bold;
  background: rgba(var(--color-primary), 0.1);
  background: color-mix(in srgb, var(--color-primary), transparent 90%);
  padding: 2px 6px;
  border-radius: 4px;
}

.day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  height: 20px;
  flex-shrink: 0;
}

.day-number {
  font-size: 13px;
  font-weight: 500;
}

.btn-add-mini {
  opacity: 0;
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: 2px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.calendar-day:hover .btn-add-mini {
  opacity: 1;
}

.btn-add-mini:hover {
  background-color: var(--color-border);
  color: var(--color-primary);
}

.day-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  max-height: calc(100% - 30px); /* 为日期头部留出空间 */
}

.calendar-todo {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 4px;
  border-radius: 3px;
  background: var(--color-border);
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
  overflow: hidden; 
  user-select: none;
  min-height: 18px;
  flex-shrink: 0;
}

.calendar-todo.dragging {
  opacity: 0.5;
  cursor: grabbing;
}

.calendar-todo:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.calendar-todo.completed {
  opacity: 0.6;
  text-decoration: line-through;
}

.todo-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background-color: var(--color-text-tertiary);
  flex-shrink: 0;
}

.todo-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.calendar-todo.no-due-date {
  border-left: 2px solid var(--color-text-tertiary);
  background: color-mix(in srgb, var(--color-text-tertiary), transparent 90%);
  opacity: 0.8;
}

.no-date-indicator {
  font-size: 10px;
  color: var(--color-text-tertiary);
  margin-left: auto;
  flex-shrink: 0;
}

/* Priority Colors */
.calendar-todo.high {
  border-left: 2px solid var(--color-error);
  background: color-mix(in srgb, var(--color-error), transparent 90%);
}
.calendar-todo.high .todo-dot { background-color: var(--color-error); }

.calendar-todo.medium {
  border-left: 2px solid var(--color-warning);
  background: color-mix(in srgb, var(--color-warning), transparent 90%);
}
.calendar-todo.medium .todo-dot { background-color: var(--color-warning); }

.calendar-todo.low {
  border-left: 2px solid var(--color-success);
  background: color-mix(in srgb, var(--color-success), transparent 90%);
}
.calendar-todo.low .todo-dot { background-color: var(--color-success); }

/* 响应式设计 */
@media (max-width: 768px) {
  .calendar-day {
    min-height: 80px;
    padding: 4px;
  }
  
  .day-number {
    font-size: 12px;
  }
  
  .calendar-todo {
    font-size: 10px;
    padding: 1px 3px;
    min-height: 16px;
  }
  
  .todo-dot {
    width: 3px;
    height: 3px;
  }
  
  .week-day {
    padding: 8px 4px;
    font-size: 12px;
  }
  
  .calendar-header {
    padding: 12px;
  }
  
  .month-navigation h3 {
    font-size: 16px;
    min-width: 100px;
  }
}

@media (max-width: 480px) {
  .calendar-day {
    min-height: 60px;
    padding: 2px;
  }
  
  .day-content {
    gap: 1px;
    max-height: calc(100% - 20px);
  }
  
  .calendar-todo {
    font-size: 9px;
    min-height: 14px;
  }
  
  .btn-add-mini {
    display: none; /* 在小屏幕上隐藏添加按钮 */
  }
}
</style>
