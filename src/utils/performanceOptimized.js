/**
 * SnippetsHub - 专业代码片段管理工具
 * 
 * @file utils/performanceOptimized.js - 优化版性能监控工具
 * @author Noah
 * @description 应用性能监控、分析和优化工具
 * @created 2026-01-31
 * @version 1.1.0
 * 
 * 功能特性:
 * - 启动性能监控
 * - 运行时性能分析
 * - 内存使用监控
 * - 用户交互追踪
 * - 性能报告生成
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map()
    this.interactions = []
    this.observers = new Map()
    this.startTime = performance.now()
    this.isEnabled = true
    
    // 初始化性能观察器
    this.initializeObservers()
  }

  /**
   * 初始化性能观察器
   */
  initializeObservers() {
    // 长任务监控
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordMetric('performance', 'long-task', {
              duration: entry.duration,
              startTime: entry.startTime,
              name: entry.name
            })
            
            if (entry.duration > 50) {
              console.warn(`Long task detected: ${entry.duration}ms`)
            }
          }
        })
        
        longTaskObserver.observe({ entryTypes: ['longtask'] })
        this.observers.set('longtask', longTaskObserver)
      } catch (e) {
        console.warn('Long task observer not supported')
      }

      // 导航性能监控
      try {
        const navigationObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordMetric('navigation', 'timing', {
              domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
              loadComplete: entry.loadEventEnd - entry.loadEventStart,
              domInteractive: entry.domInteractive - entry.fetchStart,
              firstPaint: this.getFirstPaint(),
              firstContentfulPaint: this.getFirstContentfulPaint()
            })
          }
        })
        
        navigationObserver.observe({ entryTypes: ['navigation'] })
        this.observers.set('navigation', navigationObserver)
      } catch (e) {
        console.warn('Navigation observer not supported')
      }

      // 资源加载监控
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 1000) { // 只记录加载时间超过1秒的资源
              this.recordMetric('resource', 'slow-load', {
                name: entry.name,
                duration: entry.duration,
                size: entry.transferSize,
                type: entry.initiatorType
              })
            }
          }
        })
        
        resourceObserver.observe({ entryTypes: ['resource'] })
        this.observers.set('resource', resourceObserver)
      } catch (e) {
        console.warn('Resource observer not supported')
      }
    }

    // 内存监控
    if ('memory' in performance) {
      setInterval(() => {
        this.recordMemoryUsage()
      }, 30000) // 每30秒记录一次内存使用
    }
  }

  /**
   * 记录性能指标
   */
  recordMetric(category, name, data = {}) {
    if (!this.isEnabled) return

    const timestamp = performance.now()
    const key = `${category}.${name}`
    
    if (!this.metrics.has(key)) {
      this.metrics.set(key, [])
    }
    
    this.metrics.get(key).push({
      timestamp,
      data,
      relativeTime: timestamp - this.startTime
    })

    // 限制每个指标的记录数量
    const records = this.metrics.get(key)
    if (records.length > 100) {
      records.splice(0, records.length - 100)
    }
  }

  /**
   * 记录用户交互
   */
  recordInteraction(action, data = {}) {
    if (!this.isEnabled) return

    this.interactions.push({
      action,
      data,
      timestamp: performance.now(),
      relativeTime: performance.now() - this.startTime
    })

    // 限制交互记录数量
    if (this.interactions.length > 200) {
      this.interactions.splice(0, this.interactions.length - 200)
    }
  }

  /**
   * 记录内存使用情况
   */
  recordMemoryUsage() {
    if ('memory' in performance) {
      const memory = performance.memory
      this.recordMetric('memory', 'usage', {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
        usagePercent: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
      })
    }
  }

  /**
   * 获取首次绘制时间
   */
  getFirstPaint() {
    const paintEntries = performance.getEntriesByType('paint')
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint')
    return firstPaint ? firstPaint.startTime : null
  }

  /**
   * 获取首次内容绘制时间
   */
  getFirstContentfulPaint() {
    const paintEntries = performance.getEntriesByType('paint')
    const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint')
    return fcp ? fcp.startTime : null
  }

  /**
   * 获取性能报告
   */
  getPerformanceReport() {
    const report = {
      summary: this.getSummary(),
      metrics: Object.fromEntries(this.metrics),
      interactions: this.interactions.slice(-50), // 最近50个交互
      recommendations: this.getRecommendations()
    }

    return report
  }

  /**
   * 获取性能摘要
   */
  getSummary() {
    const currentTime = performance.now()
    const uptime = currentTime - this.startTime

    const summary = {
      uptime: Math.round(uptime),
      totalMetrics: this.metrics.size,
      totalInteractions: this.interactions.length,
      averageInteractionTime: this.getAverageInteractionTime(),
      memoryUsage: this.getCurrentMemoryUsage(),
      performanceScore: this.calculatePerformanceScore()
    }

    return summary
  }

  /**
   * 获取平均交互时间
   */
  getAverageInteractionTime() {
    if (this.interactions.length < 2) return 0

    const intervals = []
    for (let i = 1; i < this.interactions.length; i++) {
      intervals.push(this.interactions[i].timestamp - this.interactions[i-1].timestamp)
    }

    return intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length
  }

  /**
   * 获取当前内存使用情况
   */
  getCurrentMemoryUsage() {
    if ('memory' in performance) {
      const memory = performance.memory
      return {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024), // MB
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024), // MB
        usagePercent: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100)
      }
    }
    return null
  }

  /**
   * 计算性能评分
   */
  calculatePerformanceScore() {
    let score = 100

    // 检查长任务
    const longTasks = this.metrics.get('performance.long-task') || []
    const recentLongTasks = longTasks.filter(task => 
      performance.now() - task.timestamp < 60000 // 最近1分钟
    )
    score -= recentLongTasks.length * 5

    // 检查内存使用
    const memoryUsage = this.getCurrentMemoryUsage()
    if (memoryUsage && memoryUsage.usagePercent > 80) {
      score -= 20
    } else if (memoryUsage && memoryUsage.usagePercent > 60) {
      score -= 10
    }

    // 检查启动时间
    const startupMetrics = this.metrics.get('app.startup-time') || []
    if (startupMetrics.length > 0) {
      const latestStartup = startupMetrics[startupMetrics.length - 1]
      if (latestStartup.data.duration > 3000) {
        score -= 15
      } else if (latestStartup.data.duration > 2000) {
        score -= 10
      }
    }

    return Math.max(0, Math.min(100, score))
  }

  /**
   * 获取性能优化建议
   */
  getRecommendations() {
    const recommendations = []

    // 检查长任务
    const longTasks = this.metrics.get('performance.long-task') || []
    if (longTasks.length > 0) {
      recommendations.push({
        type: 'warning',
        title: '检测到长任务',
        description: `发现 ${longTasks.length} 个长任务，可能影响用户体验`,
        suggestion: '考虑将长任务分解为更小的任务或使用 Web Workers'
      })
    }

    // 检查内存使用
    const memoryUsage = this.getCurrentMemoryUsage()
    if (memoryUsage && memoryUsage.usagePercent > 70) {
      recommendations.push({
        type: 'warning',
        title: '内存使用率较高',
        description: `当前内存使用率: ${memoryUsage.usagePercent}%`,
        suggestion: '检查是否存在内存泄漏，清理不必要的缓存'
      })
    }

    // 检查慢资源
    const slowResources = this.metrics.get('resource.slow-load') || []
    if (slowResources.length > 0) {
      recommendations.push({
        type: 'info',
        title: '发现慢加载资源',
        description: `${slowResources.length} 个资源加载时间超过1秒`,
        suggestion: '考虑优化资源大小或使用CDN加速'
      })
    }

    return recommendations
  }

  /**
   * 启用/禁用性能监控
   */
  setEnabled(enabled) {
    this.isEnabled = enabled
  }

  /**
   * 清理资源
   */
  cleanup() {
    // 断开所有观察器
    this.observers.forEach(observer => {
      observer.disconnect()
    })
    this.observers.clear()

    // 清理数据
    this.metrics.clear()
    this.interactions.length = 0
  }

  /**
   * 导出性能数据
   */
  exportData() {
    return {
      metrics: Object.fromEntries(this.metrics),
      interactions: this.interactions,
      summary: this.getSummary(),
      timestamp: new Date().toISOString()
    }
  }
}

// 创建全局实例
export const performanceMonitor = new PerformanceMonitor()

// 开发环境下的性能调试工具
if (process.env.NODE_ENV === 'development') {
  window.performanceMonitor = performanceMonitor
  
  // 添加快捷键查看性能报告
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'P') {
      console.log('Performance Report:', performanceMonitor.getPerformanceReport())
    }
  })
}

export default performanceMonitor