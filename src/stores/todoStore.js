/**
 * SnippetsHub - 专业代码片段管理工具
 * 
 * @file todoStore.js - TODO任务管理状态存储
 * @author Noah
 * @description 基于SQLite的专业任务管理系统，支持子任务、批量操作、智能排序等高级功能
 * @created 2026-01-26
 * @modified 2026-02-01
 * @version 2.0.0
 * 
 * 功能特性:
 * - SQLite数据库存储
 * - 子任务和依赖关系
 * - 批量操作支持
 * - 智能排序和分组
 * - 时间跟踪
 * - 生产力分析
 * - 高级搜索和过滤
 * - 数据导入导出
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { PRIORITY } from '../constants'

// 预定义的标签颜色
export const TAG_COLORS = [
  { id: 'red', name: '红色', color: '#ef4444', bgColor: '#fef2f2' },
  { id: 'orange', name: '橙色', color: '#f97316', bgColor: '#fff7ed' },
  { id: 'amber', name: '琥珀', color: '#f59e0b', bgColor: '#fffbeb' },
  { id: 'yellow', name: '黄色', color: '#eab308', bgColor: '#fefce8' },
  { id: 'lime', name: '青柠', color: '#84cc16', bgColor: '#f7fee7' },
  { id: 'green', name: '绿色', color: '#22c55e', bgColor: '#f0fdf4' },
  { id: 'emerald', name: '翠绿', color: '#10b981', bgColor: '#ecfdf5' },
  { id: 'teal', name: '青色', color: '#14b8a6', bgColor: '#f0fdfa' },
  { id: 'cyan', name: '青蓝', color: '#06b6d4', bgColor: '#ecfeff' },
  { id: 'sky', name: '天蓝', color: '#0ea5e9', bgColor: '#f0f9ff' },
  { id: 'blue', name: '蓝色', color: '#3b82f6', bgColor: '#eff6ff' },
  { id: 'indigo', name: '靛蓝', color: '#6366f1', bgColor: '#eef2ff' },
  { id: 'violet', name: '紫罗兰', color: '#8b5cf6', bgColor: '#f5f3ff' },
  { id: 'purple', name: '紫色', color: '#a855f7', bgColor: '#faf5ff' },
  { id: 'fuchsia', name: '紫红', color: '#d946ef', bgColor: '#fdf4ff' },
  { id: 'pink', name: '粉色', color: '#ec4899', bgColor: '#fdf2f8' },
  { id: 'rose', name: '玫瑰', color: '#f43f5e', bgColor: '#fff1f2' },
  { id: 'gray', name: '灰色', color: '#6b7280', bgColor: '#f9fafb' }
]

export const useTodoStore = defineStore('todo', () => {
  // 状态
  const todos = ref([])
  const tags = ref([])
  const stats = ref({
    total: 0,
    completed: 0,
    pending: 0,
    in_progress: 0,
    blocked: 0,
    overdue: 0,
    due_today: 0,
    due_this_week: 0,
    by_priority: {},
    by_project: {},
    by_assignee: {}
  })
  const isLoading = ref(false)
  const error = ref(null)

  // 计算属性 - 检查 completed 字段或 status === 'completed'
  const completedCount = computed(() => todos.value.filter(todo => todo.completed || todo.status === 'completed').length)
  const pendingCount = computed(() => todos.value.filter(todo => !todo.completed && todo.status !== 'completed').length)
  const totalCount = computed(() => todos.value.length)

  const todosByPriority = computed(() => {
    const groups = {
      [PRIORITY.HIGH]: [],
      [PRIORITY.MEDIUM]: [],
      [PRIORITY.LOW]: [],
      none: []
    }

    todos.value.forEach(todo => {
      const priority = todo.priority || 'none'
      if (groups[priority]) {
        groups[priority].push(todo)
      }
    })

    return groups
  })

  const todosByTag = computed(() => {
    const groups = {}

    // 初始化所有标签组
    tags.value.forEach(tag => {
      groups[tag.id] = []
    })

    // 添加无标签组
    groups['untagged'] = []

    todos.value.forEach(todo => {
      if (todo.tags && todo.tags.length > 0) {
        todo.tags.forEach(tagId => {
          if (groups[tagId]) {
            groups[tagId].push(todo)
          }
        })
      } else {
        groups['untagged'].push(todo)
      }
    })

    return groups
  })

  const allTags = computed(() => {
    // 获取所有使用过的标签
    const usedTagIds = new Set()
    todos.value.forEach(todo => {
      if (todo.tags) {
        todo.tags.forEach(tagId => usedTagIds.add(tagId))
      }
    })

    return tags.value.map(tag => ({
      ...tag,
      count: todosByTag.value[tag.id]?.length || 0,
      isUsed: usedTagIds.has(tag.id)
    }))
  })

  // 智能排序的任务列表
  const smartSortedTodos = computed(() => {
    return [...todos.value].sort((a, b) => {
      // 1. 未完成任务优先
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1
      }

      // 2. 优先级排序
      const priorityWeight = { high: 3, medium: 2, low: 1 }
      const aPriority = priorityWeight[a.priority] || 0
      const bPriority = priorityWeight[b.priority] || 0
      if (aPriority !== bPriority) {
        return bPriority - aPriority
      }

      // 3. 截止日期排序
      if (a.due_date && b.due_date) {
        return new Date(a.due_date) - new Date(b.due_date)
      }
      if (a.due_date) return -1
      if (b.due_date) return 1

      // 4. 更新时间排序
      return b.updated_at - a.updated_at
    })
  })

  // 分组的任务列表
  const groupedTodos = computed(() => {
    const groups = {
      overdue: [],
      today: [],
      tomorrow: [],
      thisWeek: [],
      later: [],
      noDate: []
    }

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
    const weekEnd = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

    todos.value.forEach(todo => {
      if (!todo.due_date) {
        groups.noDate.push(todo)
        return
      }

      const dueDate = new Date(todo.due_date)
      if (dueDate < today) {
        groups.overdue.push(todo)
      } else if (dueDate.getTime() === today.getTime()) {
        groups.today.push(todo)
      } else if (dueDate.getTime() === tomorrow.getTime()) {
        groups.tomorrow.push(todo)
      } else if (dueDate <= weekEnd) {
        groups.thisWeek.push(todo)
      } else {
        groups.later.push(todo)
      }
    })

    return groups
  })

  // 方法
  const loadTodos = async () => {
    try {
      isLoading.value = true
      error.value = null
      const result = await invoke('get_todos')
      todos.value = result || []
    } catch (err) {
      console.error('Failed to load todos:', err)
      error.value = '加载任务失败'
      throw new Error('加载任务失败')
    } finally {
      isLoading.value = false
    }
  }

  const loadTags = async () => {
    try {
      const result = await invoke('get_todo_tags')
      tags.value = result || []
    } catch (err) {
      console.error('Failed to load tags:', err)
      error.value = '加载标签失败'
      throw new Error('加载标签失败')
    }
  }

  const loadStats = async () => {
    try {
      const result = await invoke('get_todo_stats')
      stats.value = result || stats.value
    } catch (err) {
      console.error('Failed to load stats:', err)
      // Stats loading failure is not critical, don't throw
    }
  }

  const createTag = async (tagData) => {
    try {
      const newTag = await invoke('create_todo_tag', {
        req: {
          name: tagData.name.trim(),
          color_id: tagData.color
        }
      })

      tags.value.push(newTag)
      return newTag
    } catch (err) {
      console.error('Failed to create tag:', err)
      error.value = '创建标签失败'
      throw new Error('创建标签失败')
    }
  }

  const updateTag = async (id, updates) => {
    try {
      const updatedTag = await invoke('update_todo_tag', {
        req: {
          id,
          name: updates.name,
          color_id: updates.color
        }
      })

      const index = tags.value.findIndex(tag => tag.id === id)
      if (index !== -1) {
        tags.value[index] = updatedTag
      }

      return updatedTag
    } catch (err) {
      console.error('Failed to update tag:', err)
      error.value = '更新标签失败'
      throw new Error('更新标签失败')
    }
  }

  const deleteTag = async (id) => {
    try {
      await invoke('delete_todo_tag', { tagId: id })

      const index = tags.value.findIndex(tag => tag.id === id)
      if (index !== -1) {
        tags.value.splice(index, 1)
      }

      // Reload todos to update tag references
      await loadTodos()
    } catch (err) {
      console.error('Failed to delete tag:', err)
      error.value = '删除标签失败'
      throw new Error('删除标签失败')
    }
  }

  const createTodo = async (todoData) => {
    try {
      const newTodo = await invoke('create_todo', {
        req: {
          title: todoData.title.trim(),
          description: todoData.description?.trim() || null,
          status: todoData.status || 'todo',
          priority: todoData.priority || null,
          due_date: todoData.due_date || null,
          estimated_hours: todoData.estimated_hours || null,
          assignee: todoData.assignee || null,
          project_id: todoData.project_id || null,
          parent_id: todoData.parent_id || null,
          recurring_config: todoData.recurring_config || null,
          dependencies: todoData.dependencies || null,
          tags: todoData.tags || null
        }
      })

      todos.value.unshift(newTodo) // 新任务放在最前面
      await loadStats() // 更新统计信息
      return newTodo
    } catch (err) {
      console.error('Failed to create todo:', err)
      error.value = '创建任务失败'
      throw new Error('创建任务失败')
    }
  }

  const updateTodo = async (id, updates) => {
    try {
      const updatedTodo = await invoke('update_todo', {
        req: {
          id,
          ...updates
        }
      })

      const index = todos.value.findIndex(todo => todo.id === id)
      if (index !== -1) {
        todos.value[index] = updatedTodo
      }

      await loadStats() // 更新统计信息
      return updatedTodo
    } catch (err) {
      console.error('Failed to update todo:', err)
      error.value = '更新任务失败'
      throw new Error('更新任务失败')
    }
  }

  const deleteTodo = async (id) => {
    try {
      await invoke('delete_todo', { todoId: id })

      const index = todos.value.findIndex(todo => todo.id === id)
      if (index !== -1) {
        todos.value.splice(index, 1)
      }

      await loadStats() // 更新统计信息
    } catch (err) {
      console.error('Failed to delete todo:', err)
      error.value = '删除任务失败'
      throw new Error('删除任务失败')
    }
  }

  const toggleTodo = async (id) => {
    try {
      const todo = todos.value.find(t => t.id === id)
      if (!todo) {
        throw new Error('任务不存在')
      }

      const updatedTodo = await invoke('update_todo', {
        req: {
          id,
          completed: !todo.completed,
          status: !todo.completed ? 'completed' : 'todo'
        }
      })

      const index = todos.value.findIndex(t => t.id === id)
      if (index !== -1) {
        todos.value[index] = updatedTodo
      }

      await loadStats() // 更新统计信息
      return updatedTodo
    } catch (err) {
      console.error('Failed to toggle todo:', err)
      error.value = '切换任务状态失败'
      throw new Error('切换任务状态失败')
    }
  }

  const filterTodos = (filter) => {
    switch (filter) {
      case 'completed':
        return todos.value.filter(todo => todo.completed || todo.status === 'completed')
      case 'pending':
        return todos.value.filter(todo => !todo.completed && todo.status !== 'completed')
      case 'high':
        return todos.value.filter(todo => todo.priority === PRIORITY.HIGH)
      case 'medium':
        return todos.value.filter(todo => todo.priority === PRIORITY.MEDIUM)
      case 'low':
        return todos.value.filter(todo => todo.priority === PRIORITY.LOW)
      default:
        // 检查是否是标签过滤
        if (filter.startsWith('tag:')) {
          const tagId = filter.replace('tag:', '')
          return todos.value.filter(todo =>
            todo.tags && todo.tags.includes(tagId)
          )
        }
        return todos.value
    }
  }

  const searchTodos = async (query) => {
    try {
      if (!query.keyword && !query.status && !query.priority && !query.tags) {
        return todos.value
      }

      const result = await invoke('search_todos', { query })
      return result || []
    } catch (err) {
      console.error('Failed to search todos:', err)
      error.value = '搜索任务失败'
      throw new Error('搜索任务失败')
    }
  }

  const clearCompleted = async () => {
    console.log('clearCompleted called')

    try {
      // 先重新加载数据确保状态同步
      await loadTodos()

      const completedTodos = todos.value.filter(todo => todo.completed || todo.status === 'completed')
      console.log('Completed todos found:', completedTodos.length)

      if (completedTodos.length === 0) {
        console.log('No completed todos to clear')
        return 0
      }

      const todoIds = completedTodos.map(todo => todo.id)
      console.log('Todo IDs to delete:', todoIds)

      // 使用单个删除确保可靠性
      let deletedCount = 0
      for (const todoId of todoIds) {
        try {
          console.log('Deleting todo:', todoId)
          await invoke('delete_todo', { todoId })
          deletedCount++
        } catch (error) {
          console.error('Failed to delete todo:', todoId, error)
        }
      }

      console.log('Deleted count:', deletedCount)

      // 重新加载数据和统计信息 - 关键修复
      await loadTodos()
      await loadStats()

      console.log('Data reloaded, clearCompleted finished successfully')
      return deletedCount
    } catch (err) {
      console.error('Failed to clear completed todos:', err)
      error.value = '清除已完成任务失败'
      throw new Error('清除已完成任务失败')
    }
  }

  // 批量操作
  const batchUpdateTodos = async (todoIds, operation, updates = null) => {
    try {
      await invoke('batch_update_todos', {
        operation: {
          todo_ids: todoIds,
          operation,
          updates
        }
      })

      // 重新加载数据
      await loadTodos()
      await loadStats()
    } catch (err) {
      console.error('Failed to batch update todos:', err)
      error.value = '批量操作失败'
      throw new Error('批量操作失败')
    }
  }

  const batchCompleteTodos = (todoIds) => {
    return batchUpdateTodos(todoIds, 'complete')
  }

  const batchDeleteTodos = (todoIds) => {
    return batchUpdateTodos(todoIds, 'delete')
  }

  const batchArchiveTodos = (todoIds) => {
    return batchUpdateTodos(todoIds, 'archive')
  }

  const batchAssignTodos = (todoIds, assignee) => {
    return batchUpdateTodos(todoIds, 'update', { assignee })
  }

  // 子任务管理
  const createSubtask = async (parentId, taskData) => {
    return createTodo({
      ...taskData,
      parent_id: parentId
    })
  }

  const getSubtasks = (parentId) => {
    return todos.value.filter(todo => todo.parent_id === parentId)
  }

  // 依赖关系管理
  const addDependency = async (taskId, dependsOnId) => {
    const task = todos.value.find(t => t.id === taskId)
    if (!task) throw new Error('任务不存在')

    const dependencies = [...(task.dependencies || []), dependsOnId]
    return updateTodo(taskId, { dependencies })
  }

  const removeDependency = async (taskId, dependsOnId) => {
    const task = todos.value.find(t => t.id === taskId)
    if (!task) throw new Error('任务不存在')

    const dependencies = (task.dependencies || []).filter(id => id !== dependsOnId)
    return updateTodo(taskId, { dependencies })
  }

  const canStartTask = (taskId) => {
    const task = todos.value.find(t => t.id === taskId)
    if (!task?.dependencies?.length) return true

    return task.dependencies.every(depId => {
      const depTask = todos.value.find(t => t.id === depId)
      return depTask?.completed
    })
  }

  // 时间跟踪
  const timeTrackingState = ref({}) // 存储每个任务的开始时间

  const startTimeTracking = async (taskId) => {
    console.log('startTimeTracking called with taskId:', taskId)
    const task = todos.value.find(t => t.id === taskId)
    if (!task) {
      console.error('Task not found:', taskId)
      throw new Error('任务不存在')
    }

    console.log('Setting tracking state for task:', taskId)
    // 记录开始时间
    timeTrackingState.value[taskId] = Date.now()
    console.log('timeTrackingState after start:', timeTrackingState.value)
    forceUpdateTracking() // 强制更新响应式

    // 更新任务状态为进行中（如果还没有完成的话）
    console.log('Updating task status to in_progress')
    if (!task.completed) {
      return updateTodo(taskId, { status: 'in_progress' })
    }
  }

  const stopTimeTracking = async (taskId, manualHours = null) => {
    console.log('stopTimeTracking called with taskId:', taskId, 'manualHours:', manualHours)
    const task = todos.value.find(t => t.id === taskId)
    if (!task) {
      console.error('Task not found:', taskId)
      throw new Error('任务不存在')
    }

    let actualHours = 0

    if (manualHours !== null) {
      console.log('Using manual hours:', manualHours)
      // 使用手动输入的时间
      actualHours = manualHours
    } else if (timeTrackingState.value[taskId]) {
      console.log('Calculating auto-tracked time')
      // 计算自动追踪的时间
      const startTime = timeTrackingState.value[taskId]
      const endTime = Date.now()
      const durationMs = endTime - startTime
      actualHours = Math.round((durationMs / (1000 * 60 * 60)) * 100) / 100 // 保留两位小数
      console.log('Auto-tracked hours:', actualHours)

      // 清除追踪状态
      delete timeTrackingState.value[taskId]
      console.log('timeTrackingState after stop:', timeTrackingState.value)
      forceUpdateTracking() // 强制更新响应式
    }

    // 累加到现有的actual_hours
    const currentActualHours = task.actual_hours || 0
    const newActualHours = currentActualHours + actualHours
    console.log('Updating actual_hours from', currentActualHours, 'to', newActualHours)

    return updateTodo(taskId, {
      actual_hours: newActualHours,
      // 停止计时后，如果未完成，将状态重置为'todo'，以便此时显示"开始计时"按钮
      status: task.completed ? 'completed' : 'todo'
    })
  }

  // 检查任务是否正在追踪时间
  const isTimeTracking = (taskId) => {
    return !!timeTrackingState.value[taskId]
  }

  // 获取当前追踪时间
  const getCurrentTrackingTime = (taskId) => {
    const startTime = timeTrackingState.value[taskId]
    if (!startTime) return 0

    const currentTime = Date.now()
    const durationMs = currentTime - startTime
    return Math.round((durationMs / (1000 * 60 * 60)) * 100) / 100 // 小时，保留两位小数
  }

  // 强制更新追踪状态的响应式
  const forceUpdateTracking = () => {
    // 触发响应式更新
    const currentState = { ...timeTrackingState.value }
    timeTrackingState.value = currentState
  }

  // 生产力分析
  const getProductivityStats = () => {
    const completedTodos = todos.value.filter(t => t.completed)
    const totalEstimated = todos.value.reduce((sum, t) => sum + (t.estimated_hours || 0), 0)
    const totalActual = todos.value.reduce((sum, t) => sum + (t.actual_hours || 0), 0)

    return {
      totalEstimated,
      totalActual,
      completionRate: totalCount.value > 0 ? completedCount.value / totalCount.value : 0,
      averageTaskTime: completedTodos.length > 0
        ? completedTodos.reduce((sum, t) => sum + (t.actual_hours || 0), 0) / completedTodos.length
        : 0,
      efficiency: totalEstimated > 0 ? totalActual / totalEstimated : 0
    }
  }

  // 导出和导入
  const exportTodos = () => {
    try {
      return JSON.stringify({
        todos: todos.value,
        tags: tags.value,
        stats: stats.value,
        exported_at: new Date().toISOString()
      }, null, 2)
    } catch (err) {
      console.error('Failed to export todos:', err)
      error.value = '导出任务失败'
      throw new Error('导出任务失败')
    }
  }

  const importTodos = async (jsonData) => {
    try {
      const importedData = JSON.parse(jsonData)

      // 导入标签
      if (importedData.tags && Array.isArray(importedData.tags)) {
        for (const tag of importedData.tags) {
          try {
            await createTag({
              name: tag.name,
              color: tag.color_id || 'blue'
            })
          } catch (err) {
            // 忽略重复标签错误
            console.warn('Failed to import tag:', tag.name, err)
          }
        }
      }

      // 导入任务
      if (importedData.todos && Array.isArray(importedData.todos)) {
        let importedCount = 0
        for (const todo of importedData.todos) {
          try {
            await createTodo({
              title: todo.title,
              description: todo.description,
              status: todo.status || 'todo',
              priority: todo.priority,
              due_date: todo.due_date,
              estimated_hours: todo.estimated_hours,
              tags: todo.tags
            })
            importedCount++
          } catch (err) {
            console.warn('Failed to import todo:', todo.title, err)
          }
        }
        return importedCount
      }

      return 0
    } catch (err) {
      console.error('Failed to import todos:', err)
      error.value = '导入任务失败'
      throw new Error('导入任务失败')
    }
  }

  // 初始化时加载数据
  const initialize = async () => {
    try {
      await Promise.all([
        loadTodos(),
        loadTags(),
        loadStats()
      ])
    } catch (err) {
      console.error('Failed to initialize todo store:', err)
      error.value = '初始化失败'
    }
  }

  return {
    // 状态
    todos,
    tags,
    stats,
    isLoading,
    error,

    // 计算属性
    completedCount,
    pendingCount,
    totalCount,
    todosByPriority,
    todosByTag,
    allTags,
    smartSortedTodos,
    groupedTodos,

    // 基础方法
    loadTodos,
    loadTags,
    loadStats,
    createTodo,
    updateTodo,
    deleteTodo,
    toggleTodo,
    createTag,
    updateTag,
    deleteTag,
    filterTodos,
    searchTodos,
    clearCompleted,

    // 高级功能
    batchUpdateTodos,
    batchCompleteTodos,
    batchDeleteTodos,
    batchArchiveTodos,
    batchAssignTodos,
    createSubtask,
    getSubtasks,
    addDependency,
    removeDependency,
    canStartTask,
    startTimeTracking,
    stopTimeTracking,
    isTimeTracking,
    getCurrentTrackingTime,
    forceUpdateTracking,
    getProductivityStats,
    exportTodos,
    importTodos,
    initialize
  }
})