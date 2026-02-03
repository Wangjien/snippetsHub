/**
 * SnippetsHub - 专业代码片段管理工具
 * 
 * @file utils/lazyLoad.js - 懒加载工具函数
 * @author Noah
 * @description 提供组件和资源的懒加载功能，优化应用启动性能
 * @created 2026-01-31
 * @version 1.0.0
 * 
 * 功能特性:
 * - 组件懒加载
 * - 资源预加载
 * - 性能监控
 * - 错误处理
 */

import { defineAsyncComponent } from 'vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'

/**
 * 创建懒加载组件
 * @param {Function} loader - 组件加载函数
 * @param {Object} options - 配置选项
 * @returns {Object} Vue异步组件
 */
export const createLazyComponent = (loader, options = {}) => {
  const {
    loadingComponent = LoadingSpinner,
    errorComponent = null,
    delay = 200,
    timeout = 10000,
    suspensible = false,
    onError = null
  } = options

  return defineAsyncComponent({
    loader: async () => {
      const startTime = performance.now()
      
      try {
        const component = await loader()
        const loadTime = performance.now() - startTime
        
        // 记录加载性能
        console.log(`Component loaded in ${Math.round(loadTime)}ms`)
        
        return component
      } catch (error) {
        console.error('Component loading failed:', error)
        
        if (onError) {
          onError(error)
        }
        
        throw error
      }
    },
    loadingComponent,
    errorComponent,
    delay,
    timeout,
    suspensible
  })
}

/**
 * 预加载资源
 * @param {Array} resources - 资源列表
 * @param {Object} options - 配置选项
 */
export const preloadResources = (resources, options = {}) => {
  const {
    priority = 'low',
    timeout = 5000,
    onProgress = null,
    onComplete = null,
    onError = null
  } = options

  const loadPromises = resources.map(async (resource, index) => {
    try {
      const startTime = performance.now()
      
      let result
      if (typeof resource === 'function') {
        result = await resource()
      } else if (typeof resource === 'string') {
        // 预加载图片或其他资源
        result = await loadResource(resource)
      } else {
        result = await resource
      }
      
      const loadTime = performance.now() - startTime
      
      if (onProgress) {
        onProgress(index + 1, resources.length, loadTime)
      }
      
      return result
    } catch (error) {
      console.warn(`Resource ${index} failed to preload:`, error)
      
      if (onError) {
        onError(error, index)
      }
      
      return null
    }
  })

  // 设置超时
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Preload timeout')), timeout)
  })

  return Promise.race([
    Promise.allSettled(loadPromises),
    timeoutPromise
  ]).then(results => {
    if (onComplete) {
      onComplete(results)
    }
    return results
  }).catch(error => {
    console.warn('Preload failed:', error)
    if (onError) {
      onError(error)
    }
  })
}

/**
 * 加载单个资源
 * @param {string} url - 资源URL
 * @returns {Promise} 加载Promise
 */
const loadResource = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

/**
 * 智能预加载 - 基于用户行为预测
 * @param {Object} predictions - 预测配置
 */
export const smartPreload = (predictions) => {
  const {
    routes = [],
    components = [],
    resources = [],
    conditions = {}
  } = predictions

  // 基于当前路由预测下一个可能的路由
  const predictNextRoute = () => {
    // 实现路由预测逻辑
    return routes[0] // 简化实现
  }

  // 基于用户交互预测需要的组件
  const predictComponents = () => {
    // 实现组件预测逻辑
    return components
  }

  // 在空闲时间执行预加载
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(() => {
      const nextRoute = predictNextRoute()
      const neededComponents = predictComponents()
      
      if (nextRoute) {
        preloadResources([() => import(`../views/${nextRoute}.vue`)])
      }
      
      if (neededComponents.length > 0) {
        preloadResources(neededComponents.map(comp => 
          () => import(`../components/${comp}.vue`)
        ))
      }
    }, { timeout: 2000 })
  } else {
    setTimeout(() => {
      const nextRoute = predictNextRoute()
      const neededComponents = predictComponents()
      
      if (nextRoute) {
        preloadResources([() => import(`../views/${nextRoute}.vue`)])
      }
      
      if (neededComponents.length > 0) {
        preloadResources(neededComponents.map(comp => 
          () => import(`../components/${comp}.vue`)
        ))
      }
    }, 300)
  }
}

/**
 * 延迟执行函数
 * @param {Function} fn - 要执行的函数
 * @param {number} delay - 延迟时间(ms)
 * @param {Object} options - 配置选项
 */
export const deferExecution = (fn, delay = 0, options = {}) => {
  const {
    useIdleCallback = true,
    timeout = 5000,
    priority = 'normal'
  } = options

  if (useIdleCallback && typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(() => {
      setTimeout(fn, delay)
    }, { timeout })
  } else {
    setTimeout(fn, delay)
  }
}

/**
 * 批量延迟执行
 * @param {Array} tasks - 任务列表
 * @param {Object} options - 配置选项
 */
export const batchDeferExecution = (tasks, options = {}) => {
  const {
    batchSize = 3,
    interval = 100,
    onProgress = null,
    onComplete = null
  } = options

  let currentIndex = 0
  
  const executeBatch = () => {
    const batch = tasks.slice(currentIndex, currentIndex + batchSize)
    
    batch.forEach(task => {
      if (typeof task === 'function') {
        task()
      }
    })
    
    currentIndex += batchSize
    
    if (onProgress) {
      onProgress(currentIndex, tasks.length)
    }
    
    if (currentIndex < tasks.length) {
      setTimeout(executeBatch, interval)
    } else if (onComplete) {
      onComplete()
    }
  }
  
  deferExecution(executeBatch)
}

export default {
  createLazyComponent,
  preloadResources,
  smartPreload,
  deferExecution,
  batchDeferExecution
}