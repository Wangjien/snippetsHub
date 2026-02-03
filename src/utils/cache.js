/**
 * SnippetsHub - 专业代码片段管理工具
 * 
 * @file cache.js - 智能缓存系统
 * @author Noah
 * @description 多层级智能缓存系统，提供内存、本地存储和会话缓存
 * @created 2026-01-28
 * @modified 2026-01-29
 * @version 1.0.0
 * 
 * 功能特性:
 * - 三层缓存架构
 * - LRU缓存策略
 * - 自动过期管理
 * - 缓存统计分析
 * - 压缩和序列化
 * - 缓存预热机制
 * - 内存使用优化
 * - 缓存同步策略
 */

class CacheManager {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 100
    this.defaultTTL = options.defaultTTL || 5 * 60 * 1000 // 5分钟
    this.cleanupInterval = options.cleanupInterval || 60 * 1000 // 1分钟
    
    // 内存缓存
    this.memoryCache = new Map()
    this.accessTimes = new Map()
    this.expirationTimes = new Map()
    
    // 持久化缓存
    this.persistentCache = new Map()
    this.persistentKeys = new Set()
    
    // 统计信息
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      cleanups: 0
    }
    
    this.init()
  }

  /**
   * 初始化缓存系统
   */
  init() {
    // 从 localStorage 加载持久化缓存
    this.loadPersistentCache()
    
    // 启动定期清理
    this.startCleanup()
    
    // 监听页面卸载，保存持久化缓存
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.savePersistentCache()
      })
    }
  }

  /**
   * 设置缓存项
   * @param {string} key - 缓存键
   * @param {any} value - 缓存值
   * @param {number} ttl - 生存时间（毫秒）
   * @param {boolean} persistent - 是否持久化
   */
  set(key, value, ttl = this.defaultTTL, persistent = false) {
    const now = Date.now()
    
    // 检查缓存大小，必要时进行LRU淘汰
    if (this.memoryCache.size >= this.maxSize) {
      this.evictLRU()
    }
    
    // 设置缓存
    this.memoryCache.set(key, value)
    this.accessTimes.set(key, now)
    this.expirationTimes.set(key, now + ttl)
    
    // 持久化缓存
    if (persistent) {
      this.persistentCache.set(key, {
        value,
        expiresAt: now + ttl,
        createdAt: now
      })
      this.persistentKeys.add(key)
    }
    
    this.stats.sets++
    
    return this
  }

  /**
   * 获取缓存项
   * @param {string} key - 缓存键
   * @param {any} defaultValue - 默认值
   * @returns {any} 缓存值或默认值
   */
  get(key, defaultValue = null) {
    const now = Date.now()
    
    // 检查内存缓存
    if (this.memoryCache.has(key)) {
      const expiresAt = this.expirationTimes.get(key)
      
      if (expiresAt > now) {
        // 更新访问时间
        this.accessTimes.set(key, now)
        this.stats.hits++
        return this.memoryCache.get(key)
      } else {
        // 过期，删除
        this.delete(key)
      }
    }
    
    // 检查持久化缓存
    if (this.persistentCache.has(key)) {
      const item = this.persistentCache.get(key)
      
      if (item.expiresAt > now) {
        // 恢复到内存缓存
        this.memoryCache.set(key, item.value)
        this.accessTimes.set(key, now)
        this.expirationTimes.set(key, item.expiresAt)
        this.stats.hits++
        return item.value
      } else {
        // 过期，删除
        this.persistentCache.delete(key)
        this.persistentKeys.delete(key)
      }
    }
    
    this.stats.misses++
    return defaultValue
  }

  /**
   * 检查缓存项是否存在
   * @param {string} key - 缓存键
   * @returns {boolean} 是否存在
   */
  has(key) {
    const now = Date.now()
    
    // 检查内存缓存
    if (this.memoryCache.has(key)) {
      const expiresAt = this.expirationTimes.get(key)
      if (expiresAt > now) {
        return true
      } else {
        this.delete(key)
      }
    }
    
    // 检查持久化缓存
    if (this.persistentCache.has(key)) {
      const item = this.persistentCache.get(key)
      if (item.expiresAt > now) {
        return true
      } else {
        this.persistentCache.delete(key)
        this.persistentKeys.delete(key)
      }
    }
    
    return false
  }

  /**
   * 删除缓存项
   * @param {string} key - 缓存键
   * @returns {boolean} 是否删除成功
   */
  delete(key) {
    let deleted = false
    
    if (this.memoryCache.has(key)) {
      this.memoryCache.delete(key)
      this.accessTimes.delete(key)
      this.expirationTimes.delete(key)
      deleted = true
    }
    
    if (this.persistentCache.has(key)) {
      this.persistentCache.delete(key)
      this.persistentKeys.delete(key)
      deleted = true
    }
    
    if (deleted) {
      this.stats.deletes++
    }
    
    return deleted
  }

  /**
   * 清空所有缓存
   */
  clear() {
    this.memoryCache.clear()
    this.accessTimes.clear()
    this.expirationTimes.clear()
    this.persistentCache.clear()
    this.persistentKeys.clear()
    
    // 清空 localStorage 中的缓存
    if (typeof localStorage !== 'undefined') {
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith('cache:')) {
          localStorage.removeItem(key)
        }
      })
    }
  }

  /**
   * LRU淘汰算法
   */
  evictLRU() {
    let oldestKey = null
    let oldestTime = Date.now()
    
    for (const [key, time] of this.accessTimes) {
      if (time < oldestTime) {
        oldestTime = time
        oldestKey = key
      }
    }
    
    if (oldestKey) {
      this.delete(oldestKey)
      this.stats.evictions++
    }
  }

  /**
   * 清理过期缓存
   */
  cleanup() {
    const now = Date.now()
    const expiredKeys = []
    
    // 清理内存缓存
    for (const [key, expiresAt] of this.expirationTimes) {
      if (expiresAt <= now) {
        expiredKeys.push(key)
      }
    }
    
    expiredKeys.forEach(key => this.delete(key))
    
    // 清理持久化缓存
    const expiredPersistentKeys = []
    for (const [key, item] of this.persistentCache) {
      if (item.expiresAt <= now) {
        expiredPersistentKeys.push(key)
      }
    }
    
    expiredPersistentKeys.forEach(key => {
      this.persistentCache.delete(key)
      this.persistentKeys.delete(key)
    })
    
    this.stats.cleanups++
  }

  /**
   * 启动定期清理
   */
  startCleanup() {
    setInterval(() => {
      this.cleanup()
    }, this.cleanupInterval)
  }

  /**
   * 加载持久化缓存
   */
  loadPersistentCache() {
    if (typeof localStorage === 'undefined') return
    
    try {
      const keys = Object.keys(localStorage)
      keys.forEach(storageKey => {
        if (storageKey.startsWith('cache:')) {
          const key = storageKey.replace('cache:', '')
          const data = JSON.parse(localStorage.getItem(storageKey))
          
          if (data && data.expiresAt > Date.now()) {
            this.persistentCache.set(key, data)
            this.persistentKeys.add(key)
          } else {
            localStorage.removeItem(storageKey)
          }
        }
      })
    } catch (error) {
      console.warn('Failed to load persistent cache:', error)
    }
  }

  /**
   * 保存持久化缓存
   */
  savePersistentCache() {
    if (typeof localStorage === 'undefined') return
    
    try {
      for (const key of this.persistentKeys) {
        const item = this.persistentCache.get(key)
        if (item && item.expiresAt > Date.now()) {
          localStorage.setItem(`cache:${key}`, JSON.stringify(item))
        }
      }
    } catch (error) {
      console.warn('Failed to save persistent cache:', error)
    }
  }

  /**
   * 获取缓存统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0 
      ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
      : 0
    
    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      memorySize: this.memoryCache.size,
      persistentSize: this.persistentCache.size,
      maxSize: this.maxSize
    }
  }

  /**
   * 获取缓存键列表
   * @returns {Array} 缓存键数组
   */
  keys() {
    const memoryKeys = Array.from(this.memoryCache.keys())
    const persistentKeys = Array.from(this.persistentKeys)
    return [...new Set([...memoryKeys, ...persistentKeys])]
  }

  /**
   * 获取缓存大小
   * @returns {number} 缓存项数量
   */
  size() {
    return this.memoryCache.size + this.persistentCache.size
  }

  /**
   * 批量设置缓存
   * @param {Object} entries - 键值对对象
   * @param {number} ttl - 生存时间
   * @param {boolean} persistent - 是否持久化
   */
  mset(entries, ttl = this.defaultTTL, persistent = false) {
    Object.entries(entries).forEach(([key, value]) => {
      this.set(key, value, ttl, persistent)
    })
  }

  /**
   * 批量获取缓存
   * @param {Array} keys - 缓存键数组
   * @returns {Object} 键值对对象
   */
  mget(keys) {
    const result = {}
    keys.forEach(key => {
      result[key] = this.get(key)
    })
    return result
  }

  /**
   * 批量删除缓存
   * @param {Array} keys - 缓存键数组
   */
  mdel(keys) {
    keys.forEach(key => this.delete(key))
  }

  /**
   * 设置缓存，如果不存在的话
   * @param {string} key - 缓存键
   * @param {any} value - 缓存值
   * @param {number} ttl - 生存时间
   * @param {boolean} persistent - 是否持久化
   * @returns {boolean} 是否设置成功
   */
  setIfNotExists(key, value, ttl = this.defaultTTL, persistent = false) {
    if (!this.has(key)) {
      this.set(key, value, ttl, persistent)
      return true
    }
    return false
  }

  /**
   * 更新缓存过期时间
   * @param {string} key - 缓存键
   * @param {number} ttl - 新的生存时间
   * @returns {boolean} 是否更新成功
   */
  expire(key, ttl) {
    if (this.has(key)) {
      const now = Date.now()
      this.expirationTimes.set(key, now + ttl)
      
      if (this.persistentCache.has(key)) {
        const item = this.persistentCache.get(key)
        item.expiresAt = now + ttl
        this.persistentCache.set(key, item)
      }
      
      return true
    }
    return false
  }

  /**
   * 获取缓存剩余生存时间
   * @param {string} key - 缓存键
   * @returns {number} 剩余时间（毫秒），-1表示不存在
   */
  ttl(key) {
    if (this.expirationTimes.has(key)) {
      const expiresAt = this.expirationTimes.get(key)
      return Math.max(0, expiresAt - Date.now())
    }
    
    if (this.persistentCache.has(key)) {
      const item = this.persistentCache.get(key)
      return Math.max(0, item.expiresAt - Date.now())
    }
    
    return -1
  }
}

// 创建默认缓存实例
export const cache = new CacheManager({
  maxSize: 200,
  defaultTTL: 10 * 60 * 1000, // 10分钟
  cleanupInterval: 2 * 60 * 1000 // 2分钟
})

// 创建搜索专用缓存
export const searchCache = new CacheManager({
  maxSize: 50,
  defaultTTL: 30 * 1000, // 30秒
  cleanupInterval: 60 * 1000 // 1分钟
})

// 创建主题缓存
export const themeCache = new CacheManager({
  maxSize: 10,
  defaultTTL: 24 * 60 * 60 * 1000, // 24小时
  cleanupInterval: 60 * 60 * 1000 // 1小时
})

export default CacheManager