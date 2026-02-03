/**
 * SnippetsHub - 专业代码片段管理工具
 * 
 * @file utils/index.js - 通用工具函数库
 * @author Noah
 * @description 提供应用程序中常用的工具函数和辅助方法
 * @created 2026-01-11
 * @modified 2026-01-29
 * @version 1.0.0
 * 
 * 功能特性:
 * - 时间格式化和相对时间计算
 * - 防抖和节流函数优化
 * - 深拷贝和数据处理
 * - 本地存储管理
 * - 错误处理和日志记录
 * - 文件操作和下载
 * - 搜索和高亮功能
 * - 输入验证工具
 * 
 * 使用示例:
 * ```javascript
 * import { debounce, storage, formatRelativeTime } from './utils'
 * 
 * // 防抖搜索
 * const debouncedSearch = debounce(searchFunction, 300)
 * 
 * // 存储数据
 * storage.set('user-settings', { theme: 'dark' })
 * 
 * // 格式化时间
 * const timeAgo = formatRelativeTime(Date.now() - 3600000) // "1小时前"
 * ```
 */

import { ERROR_MESSAGES } from '../constants'

/**
 * 格式化日期
 * @param {number|Date} timestamp - 时间戳或日期对象
 * @param {string} locale - 地区设置
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(timestamp, locale = 'zh-CN') {
  try {
    const date = typeof timestamp === 'number' ? new Date(timestamp) : timestamp
    return date.toLocaleDateString(locale)
  } catch (error) {
    console.error('Date formatting error:', error)
    return '无效日期'
  }
}

/**
 * 格式化相对时间
 * @param {number|Date} timestamp - 时间戳或日期对象
 * @returns {string} 相对时间字符串
 */
export function formatRelativeTime(timestamp) {
  try {
    const date = typeof timestamp === 'number' ? new Date(timestamp) : timestamp
    const now = new Date()
    const diff = now - date
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}天前`
    if (hours > 0) return `${hours}小时前`
    if (minutes > 0) return `${minutes}分钟前`
    return '刚刚'
  } catch (error) {
    console.error('Relative time formatting error:', error)
    return '未知时间'
  }
}

/**
 * 防抖函数
 * @param {Function} func - 要防抖的函数
 * @param {number} wait - 等待时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
export function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * 节流函数
 * @param {Function} func - 要节流的函数
 * @param {number} limit - 限制时间（毫秒）
 * @returns {Function} 节流后的函数
 */
export function throttle(func, limit) {
  let inThrottle
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * 生成唯一ID
 * @returns {string} 唯一ID
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

/**
 * 深拷贝对象
 * @param {any} obj - 要拷贝的对象
 * @returns {any} 拷贝后的对象
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime())
  if (obj instanceof Array) return obj.map(item => deepClone(item))
  if (typeof obj === 'object') {
    const clonedObj = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key])
      }
    }
    return clonedObj
  }
}

/**
 * 验证输入
 * @param {string} value - 输入值
 * @param {Object} rules - 验证规则
 * @returns {Object} 验证结果
 */
export function validateInput(value, rules = {}) {
  const errors = []

  if (rules.required && (!value || value.trim() === '')) {
    errors.push('此字段为必填项')
  }

  if (rules.minLength && value.length < rules.minLength) {
    errors.push(`最少需要${rules.minLength}个字符`)
  }

  if (rules.maxLength && value.length > rules.maxLength) {
    errors.push(`最多允许${rules.maxLength}个字符`)
  }

  if (rules.pattern && !rules.pattern.test(value)) {
    errors.push(rules.patternMessage || '格式不正确')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * 本地存储工具
 */
export const storage = {
  /**
   * 设置存储项
   * @param {string} key - 键名
   * @param {any} value - 值
   */
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error('Storage set error:', error)
    }
  },

  /**
   * 获取存储项
   * @param {string} key - 键名
   * @param {any} defaultValue - 默认值
   * @returns {any} 存储的值或默认值
   */
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      console.error('Storage get error:', error)
      return defaultValue
    }
  },

  /**
   * 删除存储项
   * @param {string} key - 键名
   */
  remove(key) {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error('Storage remove error:', error)
    }
  },

  /**
   * 清空所有存储
   */
  clear() {
    try {
      localStorage.clear()
    } catch (error) {
      console.error('Storage clear error:', error)
    }
  }
}

/**
 * 错误处理工具
 */
export const errorHandler = {
  /**
   * 处理API错误
   * @param {Error} error - 错误对象
   * @returns {string} 用户友好的错误消息
   */
  handleApiError(error) {
    if (!navigator.onLine) {
      return ERROR_MESSAGES.NETWORK_ERROR
    }

    if (error.response) {
      switch (error.response.status) {
        case 400:
          return ERROR_MESSAGES.INVALID_INPUT
        case 403:
          return ERROR_MESSAGES.PERMISSION_DENIED
        case 500:
          return '服务器内部错误，请稍后重试'
        default:
          return error.response.data?.message || '请求失败'
      }
    }

    return error.message || '未知错误'
  },

  /**
   * 记录错误
   * @param {Error} error - 错误对象
   * @param {string} context - 错误上下文
   */
  logError(error, context = '') {
    console.error(`[${context}] Error:`, error)
    // 这里可以添加错误上报逻辑
  }
}

/**
 * 文件处理工具
 */
export const fileUtils = {
  /**
   * 读取文件内容
   * @param {File} file - 文件对象
   * @returns {Promise<string>} 文件内容
   */
  readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = e => resolve(e.target.result)
      reader.onerror = reject
      reader.readAsText(file)
    })
  },

  /**
   * 下载文件
   * @param {string} content - 文件内容
   * @param {string} filename - 文件名
   * @param {string} type - MIME类型
   */
  downloadFile(content, filename, type = 'text/plain') {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  },

  /**
   * 格式化文件大小
   * @param {number} bytes - 字节数
   * @returns {string} 格式化后的大小
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
}

/**
 * 搜索工具
 */
export const searchUtils = {
  /**
   * 模糊搜索
   * @param {string} query - 搜索查询
   * @param {Array} items - 搜索项目
   * @param {Array} fields - 搜索字段
   * @returns {Array} 搜索结果
   */
  fuzzySearch(query, items, fields = ['title', 'description']) {
    if (!query.trim()) return items

    const queryLower = query.toLowerCase()
    return items.filter(item => {
      return fields.some(field => {
        const value = item[field]
        if (typeof value === 'string') {
          return value.toLowerCase().includes(queryLower)
        }
        if (Array.isArray(value)) {
          return value.some(v =>
            typeof v === 'string' && v.toLowerCase().includes(queryLower)
          )
        }
        return false
      })
    })
  },

  /**
   * 高亮搜索结果
   * @param {string} text - 原文本
   * @param {string} query - 搜索查询
   * @returns {string} 高亮后的HTML
   */
  highlightText(text, query) {
    if (!query.trim()) return text

    const regex = new RegExp(`(${query})`, 'gi')
    return text.replace(regex, '<mark>$1</mark>')
  }
}