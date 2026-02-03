/**
 * SnippetsHub - 专业代码片段管理工具
 * 
 * @file performance.js - 性能监控工具
 * @author Noah
 * @description 应用程序性能监控和分析工具，提供详细的性能指标和用户行为分析
 * @created 2026-01-28
 * @modified 2026-01-29
 * @version 1.0.0
 * 
 * 功能特性:
 * - 性能指标收集
 * - 用户交互跟踪
 * - 内存使用监控
 * - 渲染性能分析
 * - 网络请求监控
 * - 错误日志记录
 * - 性能报告生成
 * - 实时监控面板
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map()
    this.interactions = []
    this.observers = new Map()
    this.thresholds = {
      renderTime: 16, // 60fps
      searchTime: 100,
      loadTime: 1000,
      memoryUsage: 50 * 1024 * 1024 // 50MB
    }
    
    this.init()
  }

  /**
   * 初始化性能监控
   */
  init() {
    // 监听页面性能
    if (typeof window !== 'undefined') {
      this.observePagePerformance()
      this.observeMemoryUsage()
      this.observeNetworkStatus()
    }
  }

  /**
   * 记录性能指标
   * @param {string} category - 指标类别
   * @param {string} name - 指标名称
   * @param {Object} data - 指标数据
   */
  recordMetric(category, name, data = {}) {
    const timestamp = performance.now()
    const key = `${category}:${name}`
    
    if (!this.metrics.has(key)) {
      this.metrics.set(key, [])
    }
    
    this.metrics.get(key).push({
      timestamp,
      ...data
    })

    // 检查性能阈值
    this.checkThresholds(category, name, data)
    
    // 触发性能事件
    this.notifyObservers(category, name, data)
  }

  /**
   * 记录用户交互
   * @param {string} action - 交互动作
   * @param {Object} data - 交互数据
   */
  recordInteraction(action, data = {}) {
    const timestamp = performance.now()
    
    this.interactions.push({
      action,
      timestamp,
      ...data
    })

    // 保持最近1000条交互记录
    if (this.interactions.length > 1000) {
      this.interactions = this.interactions.slice(-1000)
    }

    // 分析用户行为模式
    this.analyzeUserBehavior()
  }

  /**
   * 开始性能测量
   * @param {string} name - 测量名称
   * @returns {Function} 结束测量的函数
   */
  startMeasure(name) {
    const startTime = performance.now()
    
    return (data = {}) => {
      const duration = performance.now() - startTime
      this.recordMetric('timing', name, { duration, ...data })
      return duration
    }
  }

  /**
   * 测量函数执行时间
   * @param {Function} fn - 要测量的函数
   * @param {string} name - 测量名称
   * @returns {any} 函数执行结果
   */
  async measureFunction(fn, name) {
    const endMeasure = this.startMeasure(name)
    
    try {
      const result = await fn()
      endMeasure({ success: true })
      return result
    } catch (error) {
      endMeasure({ success: false, error: error.message })
      throw error
    }
  }

  /**
   * 获取性能统计
   * @param {string} category - 指标类别
   * @param {string} name - 指标名称
   * @returns {Object} 统计数据
   */
  getStats(category, name) {
    const key = `${category}:${name}`
    const metrics = this.metrics.get(key) || []
    
    if (metrics.length === 0) {
      return null
    }

    const values = metrics.map(m => m.duration || m.value || 0)
    const sum = values.reduce((a, b) => a + b, 0)
    const avg = sum / values.length
    const min = Math.min(...values)
    const max = Math.max(...values)
    const p95 = this.percentile(values, 95)
    const p99 = this.percentile(values, 99)

    return {
      count: metrics.length,
      avg: Math.round(avg * 100) / 100,
      min: Math.round(min * 100) / 100,
      max: Math.round(max * 100) / 100,
      p95: Math.round(p95 * 100) / 100,
      p99: Math.round(p99 * 100) / 100,
      recent: metrics.slice(-10)
    }
  }

  /**
   * 获取所有性能数据
   * @returns {Object} 完整的性能报告
   */
  getReport() {
    const report = {
      timestamp: Date.now(),
      metrics: {},
      interactions: this.interactions.slice(-100),
      memory: this.getMemoryInfo(),
      network: this.getNetworkInfo(),
      recommendations: this.getRecommendations()
    }

    // 收集所有指标统计
    for (const [key] of this.metrics) {
      const [category, name] = key.split(':')
      if (!report.metrics[category]) {
        report.metrics[category] = {}
      }
      report.metrics[category][name] = this.getStats(category, name)
    }

    return report
  }

  /**
   * 监听页面性能
   */
  observePagePerformance() {
    // 监听 FCP, LCP 等核心指标
    if ('PerformanceObserver' in window) {
      try {
        // First Contentful Paint
        const fcpObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              this.recordMetric('vitals', 'fcp', { value: entry.startTime })
            }
          }
        })
        fcpObserver.observe({ entryTypes: ['paint'] })

        // Largest Contentful Paint
        const lcpObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordMetric('vitals', 'lcp', { value: entry.startTime })
          }
        })
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })

        // Layout Shift
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              this.recordMetric('vitals', 'cls', { value: entry.value })
            }
          }
        })
        clsObserver.observe({ entryTypes: ['layout-shift'] })

      } catch (error) {
        console.warn('Performance Observer not supported:', error)
      }
    }

    // 监听页面加载时间
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0]
      if (navigation) {
        this.recordMetric('page', 'load-time', {
          value: navigation.loadEventEnd - navigation.fetchStart
        })
        this.recordMetric('page', 'dom-ready', {
          value: navigation.domContentLoadedEventEnd - navigation.fetchStart
        })
      }
    })
  }

  /**
   * 监听内存使用情况
   */
  observeMemoryUsage() {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = performance.memory
        this.recordMetric('memory', 'usage', {
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit
        })
      }, 10000) // 每10秒检查一次
    }
  }

  /**
   * 监听网络状态
   */
  observeNetworkStatus() {
    if ('connection' in navigator) {
      const updateNetworkInfo = () => {
        const connection = navigator.connection
        this.recordMetric('network', 'status', {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData
        })
      }

      updateNetworkInfo()
      navigator.connection.addEventListener('change', updateNetworkInfo)
    }
  }

  /**
   * 检查性能阈值
   * @param {string} category - 指标类别
   * @param {string} name - 指标名称
   * @param {Object} data - 指标数据
   */
  checkThresholds(category, name, data) {
    const key = `${category}-${name}`
    const value = data.duration || data.value || 0

    let threshold = null
    if (name.includes('render')) threshold = this.thresholds.renderTime
    else if (name.includes('search')) threshold = this.thresholds.searchTime
    else if (name.includes('load')) threshold = this.thresholds.loadTime

    if (threshold && value > threshold) {
      console.warn(`Performance threshold exceeded: ${key} = ${value}ms (threshold: ${threshold}ms)`)
      this.recordMetric('warnings', 'threshold-exceeded', {
        metric: key,
        value,
        threshold
      })
    }
  }

  /**
   * 分析用户行为模式
   */
  analyzeUserBehavior() {
    const recentInteractions = this.interactions.slice(-50)
    
    // 分析搜索模式
    const searches = recentInteractions.filter(i => i.action === 'search-snippets')
    if (searches.length >= 5) {
      const avgSearchTime = searches.reduce((sum, s) => sum + (s.duration || 0), 0) / searches.length
      this.recordMetric('behavior', 'search-pattern', {
        frequency: searches.length,
        avgTime: avgSearchTime
      })
    }

    // 分析主题切换频率
    const themeChanges = recentInteractions.filter(i => i.action === 'change-theme')
    if (themeChanges.length > 3) {
      this.recordMetric('behavior', 'theme-switching', {
        frequency: themeChanges.length
      })
    }
  }

  /**
   * 获取内存信息
   * @returns {Object} 内存信息
   */
  getMemoryInfo() {
    if ('memory' in performance) {
      const memory = performance.memory
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
        usagePercent: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100)
      }
    }
    return null
  }

  /**
   * 获取网络信息
   * @returns {Object} 网络信息
   */
  getNetworkInfo() {
    if ('connection' in navigator) {
      const connection = navigator.connection
      return {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      }
    }
    return null
  }

  /**
   * 获取性能优化建议
   * @returns {Array} 建议列表
   */
  getRecommendations() {
    const recommendations = []
    
    // 检查搜索性能
    const searchStats = this.getStats('search', 'filter-time')
    if (searchStats && searchStats.avg > 100) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        message: '搜索响应时间较慢，建议优化搜索算法或增加缓存'
      })
    }

    // 检查内存使用
    const memory = this.getMemoryInfo()
    if (memory && memory.usagePercent > 80) {
      recommendations.push({
        type: 'memory',
        priority: 'medium',
        message: '内存使用率较高，建议清理不必要的数据或优化内存管理'
      })
    }

    // 检查交互频率
    const recentInteractions = this.interactions.slice(-20)
    const errorInteractions = recentInteractions.filter(i => i.error)
    if (errorInteractions.length > 3) {
      recommendations.push({
        type: 'stability',
        priority: 'high',
        message: '检测到多次错误，建议检查应用稳定性'
      })
    }

    return recommendations
  }

  /**
   * 计算百分位数
   * @param {Array} values - 数值数组
   * @param {number} percentile - 百分位数
   * @returns {number} 百分位数值
   */
  percentile(values, percentile) {
    const sorted = [...values].sort((a, b) => a - b)
    const index = Math.ceil((percentile / 100) * sorted.length) - 1
    return sorted[index] || 0
  }

  /**
   * 添加性能观察者
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   */
  addObserver(event, callback) {
    if (!this.observers.has(event)) {
      this.observers.set(event, [])
    }
    this.observers.get(event).push(callback)
  }

  /**
   * 通知观察者
   * @param {string} category - 指标类别
   * @param {string} name - 指标名称
   * @param {Object} data - 指标数据
   */
  notifyObservers(category, name, data) {
    const event = `${category}:${name}`
    const observers = this.observers.get(event) || []
    observers.forEach(callback => {
      try {
        callback(data)
      } catch (error) {
        console.error('Observer callback error:', error)
      }
    })
  }

  /**
   * 清理旧数据
   * @param {number} maxAge - 最大保留时间（毫秒）
   */
  cleanup(maxAge = 24 * 60 * 60 * 1000) { // 默认24小时
    const cutoff = performance.now() - maxAge
    
    for (const [key, metrics] of this.metrics) {
      const filtered = metrics.filter(m => m.timestamp > cutoff)
      if (filtered.length === 0) {
        this.metrics.delete(key)
      } else {
        this.metrics.set(key, filtered)
      }
    }

    this.interactions = this.interactions.filter(i => i.timestamp > cutoff)
  }

  /**
   * 导出性能数据
   * @returns {string} JSON格式的性能数据
   */
  export() {
    return JSON.stringify(this.getReport(), null, 2)
  }
}

// 创建全局实例
export const performanceMonitor = new PerformanceMonitor()

// 自动清理旧数据
if (typeof window !== 'undefined') {
  setInterval(() => {
    performanceMonitor.cleanup()
  }, 60 * 60 * 1000) // 每小时清理一次
}

export default PerformanceMonitor