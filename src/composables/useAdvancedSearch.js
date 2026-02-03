/**
 * SnippetsHub - 专业代码片段管理工具
 * 
 * @file useAdvancedSearch.js - 高级搜索组合式函数
 * @author Noah
 * @description 提供智能搜索、语义搜索和高级过滤功能
 * @created 2026-01-29
 * @modified 2026-01-29
 * @version 1.0.0
 * 
 * 功能特性:
 * - 模糊搜索算法
 * - 语义搜索支持
 * - 搜索历史管理
 * - 智能建议系统
 * - 高级过滤器
 * - 搜索结果排序
 * - 实时搜索优化
 * - 搜索统计分析
 */

import { ref, computed, watch } from 'vue'
import { debounce } from '../utils'

/**
 * 高级搜索组合式函数
 * @param {Array} items - 搜索数据源
 * @param {Object} options - 搜索配置选项
 * @returns {Object} 搜索相关的响应式数据和方法
 */
export function useAdvancedSearch(items, options = {}) {
  // 默认配置
  const defaultOptions = {
    searchFields: ['title', 'description', 'code', 'tags'],
    fuzzyThreshold: 0.6,
    maxResults: 100,
    enableHistory: true,
    enableSuggestions: true,
    debounceDelay: 300
  }
  
  const config = { ...defaultOptions, ...options }
  
  // 响应式状态
  const searchQuery = ref('')
  const searchHistory = ref(JSON.parse(localStorage.getItem('search-history') || '[]'))
  const searchSuggestions = ref([])
  const isSearching = ref(false)
  const searchStats = ref({
    totalSearches: 0,
    averageResultCount: 0,
    popularQueries: []
  })
  
  // 高级过滤器状态
  const filters = ref({
    language: null,
    tags: [],
    dateRange: null,
    minLength: null,
    maxLength: null,
    isFavorite: null,
    hasComments: null
  })
  
  // 排序选项
  const sortBy = ref('relevance') // relevance, date, title, usage
  const sortOrder = ref('desc')
  
  /**
   * 模糊搜索算法 - Levenshtein Distance
   */
  const calculateSimilarity = (str1, str2) => {
    const matrix = []
    const len1 = str1.length
    const len2 = str2.length
    
    if (len1 === 0) return len2
    if (len2 === 0) return len1
    
    // 初始化矩阵
    for (let i = 0; i <= len2; i++) {
      matrix[i] = [i]
    }
    for (let j = 0; j <= len1; j++) {
      matrix[0][j] = j
    }
    
    // 计算编辑距离
    for (let i = 1; i <= len2; i++) {
      for (let j = 1; j <= len1; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // 替换
            matrix[i][j - 1] + 1,     // 插入
            matrix[i - 1][j] + 1      // 删除
          )
        }
      }
    }
    
    const maxLen = Math.max(len1, len2)
    return 1 - matrix[len2][len1] / maxLen
  }
  
  /**
   * 语义搜索 - 基于关键词权重
   */
  const calculateSemanticScore = (item, query) => {
    const queryWords = query.toLowerCase().split(/\s+/)
    let totalScore = 0
    let matchCount = 0
    
    config.searchFields.forEach(field => {
      const fieldValue = item[field]
      if (!fieldValue) return
      
      const fieldText = Array.isArray(fieldValue) 
        ? fieldValue.join(' ').toLowerCase()
        : fieldValue.toString().toLowerCase()
      
      queryWords.forEach(word => {
        if (fieldText.includes(word)) {
          matchCount++
          // 根据字段类型给予不同权重
          const fieldWeight = {
            title: 3,
            tags: 2.5,
            description: 2,
            code: 1
          }[field] || 1
          
          // 完全匹配给予更高分数
          const exactMatch = fieldText === word
          const wordScore = exactMatch ? fieldWeight * 2 : fieldWeight
          
          totalScore += wordScore
        }
      })
    })
    
    // 计算匹配度百分比
    const matchPercentage = matchCount / queryWords.length
    return totalScore * matchPercentage
  }
  
  /**
   * 高级过滤逻辑
   */
  const applyFilters = (items) => {
    return items.filter(item => {
      // 语言过滤
      if (filters.value.language && item.language !== filters.value.language) {
        return false
      }
      
      // 标签过滤
      if (filters.value.tags.length > 0) {
        const hasAllTags = filters.value.tags.every(tag => 
          item.tags && item.tags.includes(tag)
        )
        if (!hasAllTags) return false
      }
      
      // 日期范围过滤
      if (filters.value.dateRange) {
        const itemDate = new Date(item.updated_at * 1000)
        const { start, end } = filters.value.dateRange
        if (itemDate < start || itemDate > end) return false
      }
      
      // 代码长度过滤
      if (filters.value.minLength && item.code.length < filters.value.minLength) {
        return false
      }
      if (filters.value.maxLength && item.code.length > filters.value.maxLength) {
        return false
      }
      
      // 收藏状态过滤
      if (filters.value.isFavorite !== null && item.isFavorite !== filters.value.isFavorite) {
        return false
      }
      
      // 注释过滤
      if (filters.value.hasComments !== null) {
        const hasComments = item.code.includes('//') || item.code.includes('/*')
        if (hasComments !== filters.value.hasComments) return false
      }
      
      return true
    })
  }
  
  /**
   * 搜索结果排序
   */
  const sortResults = (results) => {
    return results.sort((a, b) => {
      let comparison = 0
      
      switch (sortBy.value) {
        case 'relevance':
          comparison = (b._searchScore || 0) - (a._searchScore || 0)
          break
        case 'date':
          comparison = b.updated_at - a.updated_at
          break
        case 'title':
          comparison = a.title.localeCompare(b.title)
          break
        case 'usage':
          comparison = (b.usage_count || 0) - (a.usage_count || 0)
          break
        default:
          comparison = 0
      }
      
      return sortOrder.value === 'desc' ? comparison : -comparison
    })
  }
  
  /**
   * 执行搜索
   */
  const performSearch = (query, itemsToSearch) => {
    if (!query.trim()) {
      return applyFilters(itemsToSearch)
    }
    
    isSearching.value = true
    const startTime = performance.now()
    
    try {
      // 应用基础过滤器
      let filteredItems = applyFilters(itemsToSearch)
      
      // 执行搜索匹配
      const searchResults = filteredItems.map(item => {
        let score = 0
        
        // 语义搜索评分
        const semanticScore = calculateSemanticScore(item, query)
        score += semanticScore
        
        // 模糊搜索评分
        config.searchFields.forEach(field => {
          const fieldValue = item[field]
          if (!fieldValue) return
          
          const fieldText = Array.isArray(fieldValue) 
            ? fieldValue.join(' ')
            : fieldValue.toString()
          
          const similarity = calculateSimilarity(
            query.toLowerCase(),
            fieldText.toLowerCase()
          )
          
          if (similarity >= config.fuzzyThreshold) {
            score += similarity * 10
          }
        })
        
        return {
          ...item,
          _searchScore: score
        }
      }).filter(item => item._searchScore > 0)
      
      // 排序结果
      const sortedResults = sortResults(searchResults)
      
      // 限制结果数量
      const finalResults = sortedResults.slice(0, config.maxResults)
      
      // 更新搜索统计
      const searchTime = performance.now() - startTime
      updateSearchStats(query, finalResults.length, searchTime)
      
      return finalResults
      
    } finally {
      isSearching.value = false
    }
  }
  
  /**
   * 更新搜索统计
   */
  const updateSearchStats = (query, resultCount, searchTime) => {
    searchStats.value.totalSearches++
    searchStats.value.averageResultCount = 
      (searchStats.value.averageResultCount + resultCount) / 2
    
    // 记录热门查询
    const existingQuery = searchStats.value.popularQueries.find(q => q.query === query)
    if (existingQuery) {
      existingQuery.count++
      existingQuery.lastUsed = Date.now()
    } else {
      searchStats.value.popularQueries.push({
        query,
        count: 1,
        lastUsed: Date.now(),
        averageResults: resultCount,
        averageTime: searchTime
      })
    }
    
    // 保持热门查询列表在合理大小
    searchStats.value.popularQueries = searchStats.value.popularQueries
      .sort((a, b) => b.count - a.count)
      .slice(0, 20)
  }
  
  /**
   * 生成搜索建议
   */
  const generateSuggestions = (query) => {
    if (!query || query.length < 2) {
      searchSuggestions.value = []
      return
    }
    
    const suggestions = new Set()
    
    // 从搜索历史中获取建议
    searchHistory.value.forEach(historyItem => {
      if (historyItem.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(historyItem)
      }
    })
    
    // 从热门查询中获取建议
    searchStats.value.popularQueries.forEach(popularQuery => {
      if (popularQuery.query.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(popularQuery.query)
      }
    })
    
    // 从数据中提取相关建议
    items.value.forEach(item => {
      // 标题建议
      if (item.title.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(item.title)
      }
      
      // 标签建议
      if (item.tags) {
        item.tags.forEach(tag => {
          if (tag.toLowerCase().includes(query.toLowerCase())) {
            suggestions.add(tag)
          }
        })
      }
    })
    
    searchSuggestions.value = Array.from(suggestions).slice(0, 10)
  }
  
  /**
   * 添加到搜索历史
   */
  const addToHistory = (query) => {
    if (!config.enableHistory || !query.trim()) return
    
    // 移除重复项
    const filteredHistory = searchHistory.value.filter(item => item !== query)
    
    // 添加到开头
    searchHistory.value = [query, ...filteredHistory].slice(0, 50)
    
    // 保存到本地存储
    localStorage.setItem('search-history', JSON.stringify(searchHistory.value))
  }
  
  /**
   * 清除搜索历史
   */
  const clearHistory = () => {
    searchHistory.value = []
    localStorage.removeItem('search-history')
  }
  
  /**
   * 重置过滤器
   */
  const resetFilters = () => {
    filters.value = {
      language: null,
      tags: [],
      dateRange: null,
      minLength: null,
      maxLength: null,
      isFavorite: null,
      hasComments: null
    }
  }
  
  // 防抖搜索
  const debouncedSearch = debounce((query) => {
    if (config.enableSuggestions) {
      generateSuggestions(query)
    }
  }, config.debounceDelay)
  
  // 计算属性 - 搜索结果
  const searchResults = computed(() => {
    return performSearch(searchQuery.value, items.value)
  })
  
  // 监听搜索查询变化
  watch(searchQuery, (newQuery) => {
    debouncedSearch(newQuery)
    if (newQuery.trim()) {
      addToHistory(newQuery)
    }
  })
  
  // 监听过滤器变化
  watch(filters, () => {
    // 过滤器变化时重新搜索
  }, { deep: true })
  
  return {
    // 响应式状态
    searchQuery,
    searchResults,
    searchHistory,
    searchSuggestions,
    isSearching,
    searchStats,
    filters,
    sortBy,
    sortOrder,
    
    // 方法
    performSearch,
    generateSuggestions,
    addToHistory,
    clearHistory,
    resetFilters,
    
    // 工具方法
    calculateSimilarity,
    calculateSemanticScore
  }
}