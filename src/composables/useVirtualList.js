/**
 * SnippetsHub - 专业代码片段管理工具
 * 
 * @file useVirtualList.js - 虚拟列表组合式函数
 * @author Noah
 * @description 高性能虚拟列表实现，支持大数据量渲染和动态高度
 * @created 2026-01-28
 * @modified 2026-01-29
 * @version 1.0.0
 * 
 * 功能特性:
 * - 虚拟滚动优化
 * - 动态高度支持
 * - 水平和垂直滚动
 * - 预渲染和缓存
 * - 滚动位置记忆
 * - 性能监控集成
 * - 响应式配置
 * - 无障碍访问支持
 */

import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { throttle } from '../utils'

/**
 * 虚拟列表组合式函数
 * 提供高性能的大数据量列表渲染能力
 * 
 * @param {Ref} items - 列表数据
 * @param {Object} options - 配置选项
 * @returns {Object} 虚拟列表相关的响应式数据和方法
 */
export function useVirtualList(items, options = {}) {
  // 默认配置
  const defaultOptions = {
    itemHeight: 50,
    containerHeight: 400,
    overscan: 5,
    threshold: 100,
    estimatedItemHeight: null,
    getItemHeight: null,
    horizontal: false
  }

  const config = { ...defaultOptions, ...options }

  // 响应式状态
  const containerRef = ref(null)
  const scrollTop = ref(0)
  const scrollLeft = ref(0)
  const containerHeight = ref(config.containerHeight)
  const containerWidth = ref(0)
  const isScrolling = ref(false)
  const scrollDirection = ref('down')
  
  // 动态高度支持
  const itemHeights = ref(new Map())
  const estimatedTotalHeight = ref(0)
  const measuredItemCount = ref(0)

  // 计算属性
  const itemHeight = computed(() => {
    if (typeof config.itemHeight === 'function') {
      return config.itemHeight()
    }
    // 如果是 computed 对象，获取其值
    if (config.itemHeight && typeof config.itemHeight.value !== 'undefined') {
      return config.itemHeight.value
    }
    return config.itemHeight || 50
  })

  const totalItems = computed(() => items.value?.length || 0)

  // 计算可见范围
  const visibleRange = computed(() => {
    if (totalItems.value === 0) {
      return { start: 0, end: 0 }
    }

    let start, end

    if (config.getItemHeight || itemHeights.value.size > 0) {
      // 动态高度计算
      const result = calculateDynamicRange()
      start = result.start
      end = result.end
    } else {
      // 固定高度计算
      const height = itemHeight.value
      start = Math.floor(scrollTop.value / height)
      end = Math.min(
        start + Math.ceil(containerHeight.value / height) + config.overscan,
        totalItems.value
      )
    }

    // 应用 overscan
    start = Math.max(0, start - config.overscan)
    end = Math.min(totalItems.value, end + config.overscan)

    return { start, end }
  })

  // 可见项目
  const visibleItems = computed(() => {
    const { start, end } = visibleRange.value
    const result = []

    for (let i = start; i < end; i++) {
      if (items.value[i]) {
        result.push({
          index: i,
          key: `item-${i}`,
          data: items.value[i],
          style: getItemStyle(i)
        })
      }
    }

    return result
  })

  // 总高度/宽度
  const totalHeight = computed(() => {
    if (config.horizontal) {
      return containerHeight.value
    }

    if (config.getItemHeight || itemHeights.value.size > 0) {
      return calculateDynamicTotalHeight()
    }

    return totalItems.value * itemHeight.value
  })

  const totalWidth = computed(() => {
    if (!config.horizontal) {
      return containerWidth.value
    }

    if (config.getItemHeight || itemHeights.value.size > 0) {
      return calculateDynamicTotalWidth()
    }

    return totalItems.value * itemHeight.value
  })

  // 偏移量
  const offsetY = computed(() => {
    if (config.horizontal) return 0

    const { start } = visibleRange.value
    
    if (config.getItemHeight || itemHeights.value.size > 0) {
      return calculateDynamicOffset(start)
    }

    return start * itemHeight.value
  })

  const offsetX = computed(() => {
    if (!config.horizontal) return 0

    const { start } = visibleRange.value
    
    if (config.getItemHeight || itemHeights.value.size > 0) {
      return calculateDynamicOffset(start)
    }

    return start * itemHeight.value
  })

  // 动态高度计算
  function calculateDynamicRange() {
    let start = 0
    let end = 0
    let accumulatedHeight = 0

    // 找到开始位置
    for (let i = 0; i < totalItems.value; i++) {
      const height = getItemHeightByIndex(i)
      
      if (accumulatedHeight + height > scrollTop.value) {
        start = i
        break
      }
      
      accumulatedHeight += height
    }

    // 找到结束位置
    let visibleHeight = 0
    for (let i = start; i < totalItems.value; i++) {
      const height = getItemHeightByIndex(i)
      visibleHeight += height
      
      if (visibleHeight >= containerHeight.value) {
        end = i + 1
        break
      }
    }

    if (end === 0) {
      end = totalItems.value
    }

    return { start, end }
  }

  function calculateDynamicTotalHeight() {
    let total = 0
    
    for (let i = 0; i < totalItems.value; i++) {
      total += getItemHeightByIndex(i)
    }
    
    return total
  }

  function calculateDynamicTotalWidth() {
    let total = 0
    
    for (let i = 0; i < totalItems.value; i++) {
      total += getItemHeightByIndex(i) // 在水平模式下，itemHeight 实际是 itemWidth
    }
    
    return total
  }

  function calculateDynamicOffset(startIndex) {
    let offset = 0
    
    for (let i = 0; i < startIndex; i++) {
      offset += getItemHeightByIndex(i)
    }
    
    return offset
  }

  function getItemHeightByIndex(index) {
    // 优先使用缓存的高度
    if (itemHeights.value.has(index)) {
      return itemHeights.value.get(index)
    }

    // 使用自定义高度函数
    if (config.getItemHeight) {
      const height = config.getItemHeight(items.value[index], index)
      itemHeights.value.set(index, height)
      return height
    }

    // 使用估算高度
    if (config.estimatedItemHeight) {
      return config.estimatedItemHeight
    }

    // 使用默认高度
    return itemHeight.value
  }

  // 获取项目样式
  function getItemStyle(index) {
    const style = {}

    if (config.horizontal) {
      style.position = 'absolute'
      style.left = calculateDynamicOffset ? calculateDynamicOffset(index) + 'px' : (index * itemHeight.value) + 'px'
      style.top = '0px'
      style.width = getItemHeightByIndex(index) + 'px'
      style.height = '100%'
    } else {
      style.position = 'absolute'
      style.top = calculateDynamicOffset ? calculateDynamicOffset(index) + 'px' : (index * itemHeight.value) + 'px'
      style.left = '0px'
      style.height = getItemHeightByIndex(index) + 'px'
      style.width = '100%'
    }

    return style
  }

  // 滚动处理
  const handleScroll = throttle((event) => {
    const target = event.target
    const newScrollTop = target.scrollTop
    const newScrollLeft = target.scrollLeft

    // 检测滚动方向
    if (newScrollTop > scrollTop.value) {
      scrollDirection.value = 'down'
    } else if (newScrollTop < scrollTop.value) {
      scrollDirection.value = 'up'
    }

    scrollTop.value = newScrollTop
    scrollLeft.value = newScrollLeft

    // 设置滚动状态
    isScrolling.value = true
    clearTimeout(scrollTimer)
    scrollTimer = setTimeout(() => {
      isScrolling.value = false
    }, 150)

    // 触发滚动事件
    if (options.onScroll) {
      options.onScroll({
        scrollTop: newScrollTop,
        scrollLeft: newScrollLeft,
        scrollDirection: scrollDirection.value,
        isScrolling: isScrolling.value
      })
    }
  }, 16) // 60fps

  let scrollTimer = null

  // 滚动到指定位置
  function scrollTo(offset) {
    if (containerRef.value) {
      if (config.horizontal) {
        containerRef.value.scrollLeft = offset
      } else {
        containerRef.value.scrollTop = offset
      }
    }
  }

  // 滚动到指定项目
  function scrollToIndex(index, align = 'auto') {
    if (index < 0 || index >= totalItems.value) {
      return
    }

    let offset

    if (config.getItemHeight || itemHeights.value.size > 0) {
      offset = calculateDynamicOffset(index)
    } else {
      offset = index * itemHeight.value
    }

    // 根据对齐方式调整偏移量
    if (align === 'center') {
      offset -= (containerHeight.value - getItemHeightByIndex(index)) / 2
    } else if (align === 'end') {
      offset -= containerHeight.value - getItemHeightByIndex(index)
    }

    // 确保偏移量在有效范围内
    offset = Math.max(0, Math.min(offset, totalHeight.value - containerHeight.value))

    scrollTo(offset)
  }

  // 滚动到顶部
  function scrollToTop() {
    scrollTo(0)
  }

  // 滚动到底部
  function scrollToBottom() {
    scrollTo(totalHeight.value)
  }

  // 更新项目高度
  function updateItemHeight(index, height) {
    if (itemHeights.value.get(index) !== height) {
      itemHeights.value.set(index, height)
      measuredItemCount.value = itemHeights.value.size
      
      // 触发重新计算
      estimatedTotalHeight.value = calculateDynamicTotalHeight()
    }
  }

  // 重置缓存
  function resetCache() {
    itemHeights.value.clear()
    measuredItemCount.value = 0
    estimatedTotalHeight.value = 0
  }

  // 获取可见项目信息
  function getVisibleItemsInfo() {
    return {
      range: visibleRange.value,
      items: visibleItems.value,
      totalItems: totalItems.value,
      scrollTop: scrollTop.value,
      scrollLeft: scrollLeft.value,
      isScrolling: isScrolling.value,
      scrollDirection: scrollDirection.value
    }
  }

  // 预加载项目
  function preloadItems(count = 10) {
    const { end } = visibleRange.value
    const preloadEnd = Math.min(end + count, totalItems.value)
    
    for (let i = end; i < preloadEnd; i++) {
      if (config.getItemHeight && !itemHeights.value.has(i)) {
        const height = config.getItemHeight(items.value[i], i)
        itemHeights.value.set(i, height)
      }
    }
  }

  // 监听容器大小变化
  function observeContainerSize() {
    if (!containerRef.value || !window.ResizeObserver) {
      return
    }

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { height, width } = entry.contentRect
        containerHeight.value = height
        containerWidth.value = width
      }
    })

    resizeObserver.observe(containerRef.value)

    return () => {
      resizeObserver.disconnect()
    }
  }

  // 生命周期
  let cleanupResize = null

  onMounted(() => {
    if (containerRef.value) {
      containerRef.value.addEventListener('scroll', handleScroll, { passive: true })
      cleanupResize = observeContainerSize()
    }
  })

  onUnmounted(() => {
    if (containerRef.value) {
      containerRef.value.removeEventListener('scroll', handleScroll)
    }
    if (cleanupResize) {
      cleanupResize()
    }
    if (scrollTimer) {
      clearTimeout(scrollTimer)
    }
  })

  // 监听数据变化
  watch(items, () => {
    // 数据变化时重置部分缓存
    if (itemHeights.value.size > totalItems.value) {
      resetCache()
    }
  }, { deep: true })

  // 监听配置变化
  watch(() => config.itemHeight, () => {
    resetCache()
  })

  return {
    // 响应式数据
    containerRef,
    visibleItems,
    totalHeight,
    totalWidth,
    offsetY,
    offsetX,
    scrollTop,
    scrollLeft,
    isScrolling,
    scrollDirection,
    visibleRange,
    measuredItemCount,

    // 方法
    scrollTo,
    scrollToIndex,
    scrollToTop,
    scrollToBottom,
    updateItemHeight,
    resetCache,
    getVisibleItemsInfo,
    preloadItems,
    
    // 工具方法
    getItemStyle,
    getItemHeightByIndex
  }
}

export default useVirtualList