/**
 * SnippetsHub - 专业代码片段管理工具
 * 
 * @file useNotifications.js - 通知系统组合式函数
 * @author Noah
 * @description 现代化的通知系统，替代原生alert()
 * @created 2026-02-05
 * @version 1.0.0
 */

import { ref, reactive } from 'vue'

const notifications = ref([])
let notificationId = 0

export function useNotifications() {
  
  const addNotification = (type, title, message = '', options = {}) => {
    const id = ++notificationId
    const notification = {
      id,
      type,
      title,
      message,
      duration: options.duration || (type === 'error' ? 8000 : 4000),
      persistent: options.persistent || false,
      actions: options.actions || [],
      createdAt: Date.now()
    }
    
    notifications.value.push(notification)
    
    // 自动移除（除非是持久化通知）
    if (!notification.persistent) {
      setTimeout(() => {
        removeNotification(id)
      }, notification.duration)
    }
    
    return id
  }
  
  const removeNotification = (id) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }
  
  const clearAll = () => {
    notifications.value.length = 0
  }
  
  // 便捷方法
  const success = (title, message, options) => {
    return addNotification('success', title, message, options)
  }
  
  const error = (title, message, options) => {
    return addNotification('error', title, message, options)
  }
  
  const warning = (title, message, options) => {
    return addNotification('warning', title, message, options)
  }
  
  const info = (title, message, options) => {
    return addNotification('info', title, message, options)
  }
  
  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    success,
    error,
    warning,
    info
  }
}