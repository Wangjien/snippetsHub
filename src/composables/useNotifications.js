/**
 * SnippetsHub - 专业代码片段管理工具
 * 
 * @file useNotifications.js - 通知系统组合式函数
 * @author Noah
 * @description 全局通知和消息管理系统，支持多种通知类型和交互
 * @created 2026-01-28
 * @modified 2026-01-29
 * @version 1.0.0
 * 
 * 功能特性:
 * - 多种通知类型（成功、错误、警告、信息）
 * - 自动消失和手动关闭
 * - 通知队列管理
 * - 位置和样式自定义
 * - 操作按钮支持
 * - 声音和振动提醒
 * - 通知历史记录
 * - 无障碍访问支持
 */

import { ref, reactive } from 'vue'
import { performanceMonitor } from '../utils/performance'

/**
 * 通知系统组合式函数
 * 提供全面的通知管理功能
 */
export function useNotifications() {
  const notifications = ref([])
  const settings = reactive({
    maxNotifications: 5,
    defaultDuration: 5000,
    position: 'top-right',
    enableSound: true,
    enableAnimation: true,
    groupSimilar: true,
    persistentTypes: ['error']
  })

  let notificationId = 0

  /**
   * 显示通知
   * @param {string|Object} message - 通知消息或配置对象
   * @param {string} type - 通知类型
   * @param {Object} options - 选项
   * @returns {Object} 通知对象
   */
  function show(message, type = 'info', options = {}) {
    const notification = createNotification(message, type, options)
    
    // 检查是否需要分组相似通知
    if (settings.groupSimilar) {
      const existing = findSimilarNotification(notification)
      if (existing) {
        return updateNotificationCount(existing)
      }
    }

    // 添加通知
    notifications.value.unshift(notification)
    
    // 限制通知数量
    if (notifications.value.length > settings.maxNotifications) {
      notifications.value = notifications.value.slice(0, settings.maxNotifications)
    }

    // 自动移除（如果不是持久化类型）
    if (!settings.persistentTypes.includes(type) && notification.duration > 0) {
      setTimeout(() => {
        remove(notification.id)
      }, notification.duration)
    }

    // 播放声音
    if (settings.enableSound) {
      playNotificationSound(type)
    }

    // 记录通知
    performanceMonitor.recordInteraction('show-notification', {
      type,
      message: typeof message === 'string' ? message.slice(0, 50) : 'object',
      duration: notification.duration
    })

    return notification
  }

  /**
   * 创建通知对象
   * @param {string|Object} message - 消息
   * @param {string} type - 类型
   * @param {Object} options - 选项
   * @returns {Object} 通知对象
   */
  function createNotification(message, type, options) {
    const id = ++notificationId
    const timestamp = Date.now()

    let config = {
      id,
      type,
      timestamp,
      duration: options.duration ?? settings.defaultDuration,
      persistent: options.persistent ?? settings.persistentTypes.includes(type),
      closable: options.closable !== false,
      actions: options.actions || [],
      count: 1,
      ...options
    }

    // 处理消息内容
    if (typeof message === 'string') {
      config.title = options.title || getDefaultTitle(type)
      config.message = message
    } else if (typeof message === 'object') {
      config = { ...config, ...message }
    }

    return config
  }

  /**
   * 获取默认标题
   * @param {string} type - 通知类型
   * @returns {string} 默认标题
   */
  function getDefaultTitle(type) {
    const titles = {
      success: '成功',
      error: '错误',
      warning: '警告',
      info: '信息'
    }
    return titles[type] || '通知'
  }

  /**
   * 查找相似通知
   * @param {Object} notification - 通知对象
   * @returns {Object|null} 相似的通知
   */
  function findSimilarNotification(notification) {
    return notifications.value.find(n => 
      n.type === notification.type &&
      n.message === notification.message &&
      n.title === notification.title
    )
  }

  /**
   * 更新通知计数
   * @param {Object} notification - 通知对象
   * @returns {Object} 更新后的通知
   */
  function updateNotificationCount(notification) {
    notification.count++
    notification.timestamp = Date.now()
    
    // 移动到顶部
    const index = notifications.value.indexOf(notification)
    if (index > 0) {
      notifications.value.splice(index, 1)
      notifications.value.unshift(notification)
    }

    return notification
  }

  /**
   * 移除通知
   * @param {number} id - 通知ID
   */
  function remove(id) {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }

  /**
   * 清空所有通知
   * @param {string} type - 可选，只清空指定类型的通知
   */
  function clear(type = null) {
    if (type) {
      notifications.value = notifications.value.filter(n => n.type !== type)
    } else {
      notifications.value = []
    }
  }

  /**
   * 成功通知
   * @param {string} message - 消息
   * @param {Object} options - 选项
   * @returns {Object} 通知对象
   */
  function success(message, options = {}) {
    return show(message, 'success', options)
  }

  /**
   * 错误通知
   * @param {string} message - 消息
   * @param {Object} options - 选项
   * @returns {Object} 通知对象
   */
  function error(message, options = {}) {
    return show(message, 'error', {
      persistent: true,
      ...options
    })
  }

  /**
   * 警告通知
   * @param {string} message - 消息
   * @param {Object} options - 选项
   * @returns {Object} 通知对象
   */
  function warning(message, options = {}) {
    return show(message, 'warning', options)
  }

  /**
   * 信息通知
   * @param {string} message - 消息
   * @param {Object} options - 选项
   * @returns {Object} 通知对象
   */
  function info(message, options = {}) {
    return show(message, 'info', options)
  }

  /**
   * 加载通知
   * @param {string} message - 消息
   * @param {Object} options - 选项
   * @returns {Object} 通知对象
   */
  function loading(message, options = {}) {
    return show(message, 'loading', {
      persistent: true,
      closable: false,
      ...options
    })
  }

  /**
   * 进度通知
   * @param {string} message - 消息
   * @param {number} progress - 进度百分比
   * @param {Object} options - 选项
   * @returns {Object} 通知对象
   */
  function progress(message, progress = 0, options = {}) {
    return show(message, 'progress', {
      progress,
      persistent: true,
      closable: false,
      ...options
    })
  }

  /**
   * 更新进度通知
   * @param {number} id - 通知ID
   * @param {number} progress - 新进度
   * @param {string} message - 新消息（可选）
   */
  function updateProgress(id, progress, message = null) {
    const notification = notifications.value.find(n => n.id === id)
    if (notification && notification.type === 'progress') {
      notification.progress = progress
      if (message) {
        notification.message = message
      }
      
      // 如果进度完成，自动转换为成功通知
      if (progress >= 100) {
        setTimeout(() => {
          notification.type = 'success'
          notification.persistent = false
          notification.closable = true
          
          setTimeout(() => {
            remove(id)
          }, 2000)
        }, 500)
      }
    }
  }

  /**
   * 确认通知
   * @param {string} message - 消息
   * @param {Object} options - 选项
   * @returns {Promise} 用户选择的Promise
   */
  function confirm(message, options = {}) {
    return new Promise((resolve) => {
      const notification = show(message, 'confirm', {
        persistent: true,
        closable: false,
        actions: [
          {
            label: options.confirmText || '确认',
            style: 'primary',
            handler: () => {
              remove(notification.id)
              resolve(true)
            }
          },
          {
            label: options.cancelText || '取消',
            style: 'secondary',
            handler: () => {
              remove(notification.id)
              resolve(false)
            }
          }
        ],
        ...options
      })
    })
  }

  /**
   * 输入通知
   * @param {string} message - 消息
   * @param {Object} options - 选项
   * @returns {Promise} 用户输入的Promise
   */
  function prompt(message, options = {}) {
    return new Promise((resolve) => {
      let inputValue = options.defaultValue || ''
      
      const notification = show(message, 'prompt', {
        persistent: true,
        closable: false,
        inputValue,
        inputPlaceholder: options.placeholder || '',
        inputType: options.inputType || 'text',
        actions: [
          {
            label: options.confirmText || '确认',
            style: 'primary',
            handler: () => {
              remove(notification.id)
              resolve(inputValue)
            }
          },
          {
            label: options.cancelText || '取消',
            style: 'secondary',
            handler: () => {
              remove(notification.id)
              resolve(null)
            }
          }
        ],
        onInput: (value) => {
          inputValue = value
        },
        ...options
      })
    })
  }

  /**
   * 播放通知声音
   * @param {string} type - 通知类型
   */
  function playNotificationSound(type) {
    if (!settings.enableSound || typeof Audio === 'undefined') return

    try {
      // 使用 Web Audio API 生成简单的提示音
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      // 根据类型设置不同的音调
      const frequencies = {
        success: 800,
        error: 400,
        warning: 600,
        info: 500
      }

      oscillator.frequency.setValueAtTime(frequencies[type] || 500, audioContext.currentTime)
      oscillator.type = 'sine'

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.2)
    } catch (error) {
      console.warn('Failed to play notification sound:', error)
    }
  }

  /**
   * 更新设置
   * @param {Object} newSettings - 新设置
   */
  function updateSettings(newSettings) {
    Object.assign(settings, newSettings)
  }

  /**
   * 获取通知统计
   * @returns {Object} 统计信息
   */
  function getStats() {
    const stats = {
      total: notifications.value.length,
      byType: {},
      persistent: 0,
      withActions: 0
    }

    notifications.value.forEach(notification => {
      // 按类型统计
      stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1
      
      // 持久化通知
      if (notification.persistent) {
        stats.persistent++
      }
      
      // 带操作的通知
      if (notification.actions && notification.actions.length > 0) {
        stats.withActions++
      }
    })

    return stats
  }

  /**
   * 导出通知历史
   * @returns {Array} 通知历史
   */
  function exportHistory() {
    return notifications.value.map(notification => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      timestamp: notification.timestamp,
      count: notification.count
    }))
  }

  /**
   * 批量操作
   * @param {string} action - 操作类型
   * @param {Function} filter - 过滤函数
   */
  function batch(action, filter = null) {
    let targetNotifications = notifications.value
    
    if (filter) {
      targetNotifications = notifications.value.filter(filter)
    }

    switch (action) {
      case 'remove':
        targetNotifications.forEach(n => remove(n.id))
        break
      case 'markAsRead':
        targetNotifications.forEach(n => n.read = true)
        break
      case 'makePersistent':
        targetNotifications.forEach(n => n.persistent = true)
        break
    }
  }

  return {
    // 状态
    notifications,
    settings,

    // 基础方法
    show,
    remove,
    clear,

    // 便捷方法
    success,
    error,
    warning,
    info,
    loading,
    progress,
    updateProgress,

    // 交互方法
    confirm,
    prompt,

    // 管理方法
    updateSettings,
    getStats,
    exportHistory,
    batch
  }
}

// 创建全局通知实例
let globalNotifications = null

export function useGlobalNotifications() {
  if (!globalNotifications) {
    globalNotifications = useNotifications()
  }
  return globalNotifications
}

export default useNotifications