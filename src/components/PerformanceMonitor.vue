/**
 * SnippetsHub - 专业代码片段管理工具
 * 
 * @file PerformanceMonitor.vue - 性能监控面板组件
 * @author Noah
 * @description 应用性能监控、分析和优化建议界面
 * @created 2026-01-31
 * @modified 2026-01-31
 * @version 1.0.0
 * 
 * 功能特性:
 * - 实时性能监控
 * - 内存使用分析
 * - 操作耗时统计
 * - 性能趋势图表
 * - 优化建议系统
 * - 性能报告导出
 */

<template>
  <div class="performance-monitor">
    <div class="monitor-header">
      <h3>性能监控</h3>
      <div class="header-controls">
        <button
          @click="isRecording = !isRecording"
          class="record-btn"
          :class="{ recording: isRecording }"
        >
          <component :is="isRecording ? Square : Play" :size="16" />
          <span>{{ isRecording ? '停止监控' : '开始监控' }}</span>
        </button>
        <button @click="clearMetrics" class="clear-btn">
          <Trash2 :size="16" />
          <span>清除数据</span>
        </button>
        <button @click="exportReport" class="export-btn">
          <Download :size="16" />
          <span>导出报告</span>
        </button>
      </div>
    </div>

    <!-- 实时指标卡片 -->
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-header">
          <Zap class="metric-icon" />
          <span class="metric-title">应用性能</span>
        </div>
        <div class="metric-value">{{ currentMetrics.fps }} FPS</div>
        <div class="metric-subtitle">{{ getPerformanceStatus(currentMetrics.fps) }}</div>
        <div class="metric-chart">
          <div class="mini-chart">
            <div
              v-for="(value, index) in fpsHistory.slice(-20)"
              :key="index"
              class="chart-bar"
              :style="{ height: `${(value / 60) * 100}%` }"
            ></div>
          </div>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-header">
          <MemoryStick class="metric-icon" />
          <span class="metric-title">内存使用</span>
        </div>
        <div class="metric-value">{{ formatBytes(currentMetrics.memoryUsage) }}</div>
        <div class="metric-subtitle">{{ getMemoryStatus(currentMetrics.memoryUsage) }}</div>
        <div class="metric-chart">
          <div class="memory-bar">
            <div
              class="memory-used"
              :style="{ width: `${(currentMetrics.memoryUsage / maxMemory) * 100}%` }"
            ></div>
          </div>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-header">
          <Clock class="metric-icon" />
          <span class="metric-title">平均响应时间</span>
        </div>
        <div class="metric-value">{{ currentMetrics.avgResponseTime }}ms</div>
        <div class="metric-subtitle">{{ getResponseTimeStatus(currentMetrics.avgResponseTime) }}</div>
        <div class="metric-chart">
          <div class="response-indicator">
            <div
              class="response-bar"
              :class="getResponseTimeClass(currentMetrics.avgResponseTime)"
              :style="{ width: `${Math.min((currentMetrics.avgResponseTime / 1000) * 100, 100)}%` }"
            ></div>
          </div>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-header">
          <Activity class="metric-icon" />
          <span class="metric-title">操作频率</span>
        </div>
        <div class="metric-value">{{ currentMetrics.operationsPerMinute }}/min</div>
        <div class="metric-subtitle">{{ getActivityStatus(currentMetrics.operationsPerMinute) }}</div>
        <div class="metric-chart">
          <div class="activity-dots">
            <div
              v-for="n in 10"
              :key="n"
              class="activity-dot"
              :class="{ active: n <= Math.min(currentMetrics.operationsPerMinute / 10, 10) }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 详细统计 -->
    <div class="detailed-stats">
      <div class="stats-tabs">
        <button
          v-for="tab in statsTabs"
          :key="tab.id"
          @click="activeStatsTab = tab.id"
          class="stats-tab"
          :class="{ active: activeStatsTab === tab.id }"
        >
          <component :is="tab.icon" :size="16" />
          <span>{{ tab.name }}</span>
        </button>
      </div>

      <div class="stats-content">
        <!-- 操作统计 -->
        <div v-if="activeStatsTab === 'operations'" class="operations-stats">
          <div class="stats-header">
            <h4>操作统计</h4>
            <div class="time-range">
              <select v-model="timeRange" class="time-select">
                <option value="1h">最近1小时</option>
                <option value="24h">最近24小时</option>
                <option value="7d">最近7天</option>
                <option value="30d">最近30天</option>
              </select>
            </div>
          </div>
          <div class="operations-list">
            <div
              v-for="operation in getFilteredOperations()"
              :key="operation.name"
              class="operation-item"
            >
              <div class="operation-info">
                <span class="operation-name">{{ operation.name }}</span>
                <span class="operation-count">{{ operation.count }} 次</span>
              </div>
              <div class="operation-metrics">
                <span class="avg-time">平均: {{ operation.avgTime }}ms</span>
                <span class="max-time">最大: {{ operation.maxTime }}ms</span>
              </div>
              <div class="operation-bar">
                <div
                  class="operation-progress"
                  :style="{ width: `${(operation.count / maxOperationCount) * 100}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 性能趋势 -->
        <div v-if="activeStatsTab === 'trends'" class="trends-stats">
          <div class="stats-header">
            <h4>性能趋势</h4>
            <div class="trend-controls">
              <button
                v-for="metric in trendMetrics"
                :key="metric.key"
                @click="activeTrendMetric = metric.key"
                class="trend-btn"
                :class="{ active: activeTrendMetric === metric.key }"
              >
                {{ metric.name }}
              </button>
            </div>
          </div>
          <div class="trend-chart">
            <canvas ref="trendChartRef" class="chart-canvas"></canvas>
          </div>
        </div>

        <!-- 内存分析 -->
        <div v-if="activeStatsTab === 'memory'" class="memory-stats">
          <div class="stats-header">
            <h4>内存分析</h4>
            <button @click="forceGarbageCollection" class="gc-btn">
              <RefreshCw :size="14" />
              <span>强制垃圾回收</span>
            </button>
          </div>
          <div class="memory-breakdown">
            <div class="memory-item">
              <span class="memory-label">已使用内存</span>
              <span class="memory-value">{{ formatBytes(memoryStats.usedJSHeapSize) }}</span>
              <div class="memory-bar">
                <div
                  class="memory-fill used"
                  :style="{ width: `${(memoryStats.usedJSHeapSize / memoryStats.totalJSHeapSize) * 100}%` }"
                ></div>
              </div>
            </div>
            <div class="memory-item">
              <span class="memory-label">总分配内存</span>
              <span class="memory-value">{{ formatBytes(memoryStats.totalJSHeapSize) }}</span>
              <div class="memory-bar">
                <div
                  class="memory-fill total"
                  :style="{ width: `${(memoryStats.totalJSHeapSize / memoryStats.jsHeapSizeLimit) * 100}%` }"
                ></div>
              </div>
            </div>
            <div class="memory-item">
              <span class="memory-label">内存限制</span>
              <span class="memory-value">{{ formatBytes(memoryStats.jsHeapSizeLimit) }}</span>
              <div class="memory-bar">
                <div class="memory-fill limit" style="width: 100%"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 优化建议 -->
        <div v-if="activeStatsTab === 'suggestions'" class="suggestions-stats">
          <div class="stats-header">
            <h4>优化建议</h4>
            <div class="suggestion-score">
              <span class="score-label">性能评分</span>
              <div class="score-circle" :class="getScoreClass(performanceScore)">
                <span class="score-value">{{ performanceScore }}</span>
              </div>
            </div>
          </div>
          <div class="suggestions-list">
            <div
              v-for="suggestion in optimizationSuggestions"
              :key="suggestion.id"
              class="suggestion-item"
              :class="suggestion.priority"
            >
              <div class="suggestion-header">
                <component :is="suggestion.icon" :size="16" class="suggestion-icon" />
                <span class="suggestion-title">{{ suggestion.title }}</span>
                <span class="suggestion-priority">{{ suggestion.priority }}</span>
              </div>
              <p class="suggestion-description">{{ suggestion.description }}</p>
              <div v-if="suggestion.actions" class="suggestion-actions">
                <button
                  v-for="action in suggestion.actions"
                  :key="action.label"
                  @click="executeAction(action)"
                  class="suggestion-action"
                >
                  {{ action.label }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 实时日志 -->
    <div v-if="showLogs" class="performance-logs">
      <div class="logs-header">
        <h4>性能日志</h4>
        <div class="logs-controls">
          <button @click="clearLogs" class="clear-logs-btn">
            <Trash2 :size="14" />
            <span>清除日志</span>
          </button>
          <button @click="showLogs = false" class="close-logs-btn">
            <X :size="14" />
          </button>
        </div>
      </div>
      <div class="logs-content">
        <div
          v-for="log in performanceLogs.slice(-100)"
          :key="log.id"
          class="log-entry"
          :class="log.level"
        >
          <span class="log-time">{{ formatTime(log.timestamp) }}</span>
          <span class="log-level">{{ log.level.toUpperCase() }}</span>
          <span class="log-message">{{ log.message }}</span>
          <span v-if="log.duration" class="log-duration">{{ log.duration }}ms</span>
        </div>
      </div>
    </div>

    <!-- 浮动日志按钮 -->
    <button
      v-if="!showLogs"
      @click="showLogs = true"
      class="floating-logs-btn"
      :class="{ alert: hasRecentWarnings }"
    >
      <FileText :size="16" />
      <span v-if="hasRecentWarnings" class="alert-dot"></span>
    </button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import {
  Zap, MemoryStick, Clock, Activity, Play, Square, Trash2, Download,
  RefreshCw, FileText, X, AlertTriangle, CheckCircle, Info, TrendingUp,
  Cpu, HardDrive, Wifi, Settings
} from 'lucide-vue-next'
import { performanceMonitor } from '../utils/performanceOptimized'
import { useNotifications } from '../composables/useNotifications'
import { fileUtils } from '../utils'

const { success, warning, error } = useNotifications()

// 响应式状态
const isRecording = ref(true)
const showLogs = ref(false)
const activeStatsTab = ref('operations')
const activeTrendMetric = ref('fps')
const timeRange = ref('1h')
const trendChartRef = ref(null)

// 当前指标
const currentMetrics = ref({
  fps: 60,
  memoryUsage: 0,
  avgResponseTime: 0,
  operationsPerMinute: 0
})

// 历史数据
const fpsHistory = ref([])
const memoryHistory = ref([])
const responseTimeHistory = ref([])
const operationHistory = ref([])
const performanceLogs = ref([])

// 内存统计
const memoryStats = ref({
  usedJSHeapSize: 0,
  totalJSHeapSize: 0,
  jsHeapSizeLimit: 0
})

const maxMemory = 1024 * 1024 * 1024 // 1GB

// 统计标签页
const statsTabs = ref([
  { id: 'operations', name: '操作统计', icon: Activity },
  { id: 'trends', name: '性能趋势', icon: TrendingUp },
  { id: 'memory', name: '内存分析', icon: MemoryStick },
  { id: 'suggestions', name: '优化建议', icon: Settings }
])

// 趋势指标
const trendMetrics = ref([
  { key: 'fps', name: 'FPS' },
  { key: 'memory', name: '内存' },
  { key: 'responseTime', name: '响应时间' },
  { key: 'operations', name: '操作数' }
])

// 操作统计
const operationStats = ref(new Map())

// 性能评分
const performanceScore = computed(() => {
  let score = 100
  
  // FPS 评分 (30%)
  const fpsScore = Math.min(currentMetrics.value.fps / 60, 1) * 30
  
  // 内存评分 (25%)
  const memoryScore = Math.max(1 - (currentMetrics.value.memoryUsage / maxMemory), 0) * 25
  
  // 响应时间评分 (25%)
  const responseScore = Math.max(1 - (currentMetrics.value.avgResponseTime / 1000), 0) * 25
  
  // 操作频率评分 (20%)
  const operationScore = Math.min(currentMetrics.value.operationsPerMinute / 100, 1) * 20
  
  score = Math.round(fpsScore + memoryScore + responseScore + operationScore)
  return Math.max(score, 0)
})

// 优化建议
const optimizationSuggestions = computed(() => {
  const suggestions = []
  
  if (currentMetrics.value.fps < 30) {
    suggestions.push({
      id: 'low-fps',
      title: 'FPS 过低',
      description: '应用帧率低于30FPS，可能影响用户体验。建议减少DOM操作或优化动画。',
      priority: 'high',
      icon: AlertTriangle,
      actions: [
        { label: '查看详情', action: 'showFpsDetails' },
        { label: '优化建议', action: 'showFpsOptimization' }
      ]
    })
  }
  
  if (currentMetrics.value.memoryUsage > maxMemory * 0.8) {
    suggestions.push({
      id: 'high-memory',
      title: '内存使用过高',
      description: '内存使用超过80%，可能导致应用卡顿。建议清理缓存或优化数据结构。',
      priority: 'high',
      icon: AlertTriangle,
      actions: [
        { label: '强制垃圾回收', action: 'forceGC' },
        { label: '清理缓存', action: 'clearCache' }
      ]
    })
  }
  
  if (currentMetrics.value.avgResponseTime > 500) {
    suggestions.push({
      id: 'slow-response',
      title: '响应时间过长',
      description: '平均响应时间超过500ms，用户可能感到延迟。建议优化异步操作。',
      priority: 'medium',
      icon: Clock,
      actions: [
        { label: '分析慢操作', action: 'analyzeSlowOperations' }
      ]
    })
  }
  
  if (suggestions.length === 0) {
    suggestions.push({
      id: 'good-performance',
      title: '性能良好',
      description: '当前应用性能表现良好，继续保持！',
      priority: 'low',
      icon: CheckCircle
    })
  }
  
  return suggestions
})

// 最大操作数量（用于计算百分比）
const maxOperationCount = computed(() => {
  if (operationStats.value.size === 0) return 1
  return Math.max(...Array.from(operationStats.value.values()).map(op => op.count))
})

// 是否有最近的警告
const hasRecentWarnings = computed(() => {
  const recentLogs = performanceLogs.value.slice(-10)
  return recentLogs.some(log => log.level === 'warn' || log.level === 'error')
})

// 监控定时器
let monitoringInterval = null
let fpsCounter = 0
let lastFrameTime = performance.now()

// 方法
const startMonitoring = () => {
  if (monitoringInterval) return
  
  monitoringInterval = setInterval(() => {
    updateMetrics()
  }, 1000)
  
  // FPS 监控
  const measureFPS = () => {
    const now = performance.now()
    const delta = now - lastFrameTime
    lastFrameTime = now
    
    if (delta > 0) {
      const fps = Math.round(1000 / delta)
      fpsCounter = fps
    }
    
    if (isRecording.value) {
      requestAnimationFrame(measureFPS)
    }
  }
  
  measureFPS()
}

const stopMonitoring = () => {
  if (monitoringInterval) {
    clearInterval(monitoringInterval)
    monitoringInterval = null
  }
}

const updateMetrics = () => {
  if (!isRecording.value) return
  
  // 更新 FPS
  currentMetrics.value.fps = fpsCounter
  fpsHistory.value.push(fpsCounter)
  if (fpsHistory.value.length > 100) {
    fpsHistory.value.shift()
  }
  
  // 更新内存使用
  if (performance.memory) {
    const memory = performance.memory.usedJSHeapSize
    currentMetrics.value.memoryUsage = memory
    memoryHistory.value.push(memory)
    if (memoryHistory.value.length > 100) {
      memoryHistory.value.shift()
    }
    
    memoryStats.value = {
      usedJSHeapSize: performance.memory.usedJSHeapSize,
      totalJSHeapSize: performance.memory.totalJSHeapSize,
      jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
    }
  }
  
  // 更新响应时间
  const metrics = performanceMonitor.getMetrics()
  if (metrics.size > 0) {
    const avgTime = Array.from(metrics.values())
      .reduce((sum, metric) => sum + metric.averageTime, 0) / metrics.size
    currentMetrics.value.avgResponseTime = Math.round(avgTime)
  }
  
  // 更新操作频率
  const recentOperations = Array.from(operationStats.value.values())
    .reduce((sum, op) => sum + op.recentCount, 0)
  currentMetrics.value.operationsPerMinute = recentOperations
  
  // 重置最近操作计数
  operationStats.value.forEach(op => {
    op.recentCount = 0
  })
  
  // 记录性能日志
  if (currentMetrics.value.fps < 30) {
    addLog('warn', `FPS 降至 ${currentMetrics.value.fps}`)
  }
  
  if (currentMetrics.value.memoryUsage > maxMemory * 0.9) {
    addLog('error', `内存使用过高: ${formatBytes(currentMetrics.value.memoryUsage)}`)
  }
}

const addLog = (level, message, duration = null) => {
  performanceLogs.value.push({
    id: Date.now() + Math.random(),
    timestamp: Date.now(),
    level,
    message,
    duration
  })
  
  // 限制日志数量
  if (performanceLogs.value.length > 1000) {
    performanceLogs.value = performanceLogs.value.slice(-500)
  }
}

const recordOperation = (name, duration) => {
  if (!operationStats.value.has(name)) {
    operationStats.value.set(name, {
      name,
      count: 0,
      totalTime: 0,
      avgTime: 0,
      maxTime: 0,
      recentCount: 0
    })
  }
  
  const op = operationStats.value.get(name)
  op.count++
  op.recentCount++
  op.totalTime += duration
  op.avgTime = Math.round(op.totalTime / op.count)
  op.maxTime = Math.max(op.maxTime, duration)
}

const getFilteredOperations = () => {
  return Array.from(operationStats.value.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 20)
}

const clearMetrics = () => {
  fpsHistory.value = []
  memoryHistory.value = []
  responseTimeHistory.value = []
  operationHistory.value = []
  operationStats.value.clear()
  performanceMonitor.clearMetrics()
  success('性能数据已清除')
}

const clearLogs = () => {
  performanceLogs.value = []
  success('性能日志已清除')
}

const forceGarbageCollection = () => {
  if (window.gc) {
    window.gc()
    success('垃圾回收已执行')
  } else {
    warning('浏览器不支持手动垃圾回收')
  }
}

const executeAction = (action) => {
  switch (action.action) {
    case 'forceGC':
      forceGarbageCollection()
      break
    case 'clearCache':
      // 清理应用缓存
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => caches.delete(name))
        })
      }
      success('缓存已清理')
      break
    case 'analyzeSlowOperations':
      activeStatsTab.value = 'operations'
      break
    default:
      console.log('执行动作:', action)
  }
}

const exportReport = () => {
  try {
    const report = {
      timestamp: new Date().toISOString(),
      metrics: currentMetrics.value,
      history: {
        fps: fpsHistory.value,
        memory: memoryHistory.value,
        responseTime: responseTimeHistory.value
      },
      operations: Array.from(operationStats.value.values()),
      suggestions: optimizationSuggestions.value,
      logs: performanceLogs.value.slice(-100),
      score: performanceScore.value
    }
    
    const filename = `performance-report-${new Date().toISOString().split('T')[0]}.json`
    fileUtils.downloadFile(JSON.stringify(report, null, 2), filename, 'application/json')
    success('性能报告已导出')
  } catch (err) {
    error('导出失败: ' + err.message)
  }
}

// 格式化函数
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString()
}

const getPerformanceStatus = (fps) => {
  if (fps >= 50) return '优秀'
  if (fps >= 30) return '良好'
  if (fps >= 20) return '一般'
  return '需要优化'
}

const getMemoryStatus = (memory) => {
  const percentage = (memory / maxMemory) * 100
  if (percentage < 50) return '正常'
  if (percentage < 80) return '偏高'
  return '过高'
}

const getResponseTimeStatus = (time) => {
  if (time < 100) return '极快'
  if (time < 300) return '快速'
  if (time < 500) return '正常'
  return '较慢'
}

const getActivityStatus = (operations) => {
  if (operations > 50) return '活跃'
  if (operations > 20) return '正常'
  if (operations > 5) return '较少'
  return '空闲'
}

const getResponseTimeClass = (time) => {
  if (time < 100) return 'excellent'
  if (time < 300) return 'good'
  if (time < 500) return 'fair'
  return 'poor'
}

const getScoreClass = (score) => {
  if (score >= 90) return 'excellent'
  if (score >= 70) return 'good'
  if (score >= 50) return 'fair'
  return 'poor'
}

// 监听录制状态变化
watch(isRecording, (recording) => {
  if (recording) {
    startMonitoring()
    addLog('info', '开始性能监控')
  } else {
    stopMonitoring()
    addLog('info', '停止性能监控')
  }
})

// 生命周期
onMounted(() => {
  if (isRecording.value) {
    startMonitoring()
  }
  
  // 监听性能监控器事件
  performanceMonitor.on('metric', (name, data) => {
    recordOperation(name, data.duration)
  })
})

onUnmounted(() => {
  stopMonitoring()
})
</script>

<style scoped>
.performance-monitor {
  background: var(--color-background);
  border-radius: 8px;
  overflow: hidden;
}

.monitor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: var(--color-background-secondary);
  border-bottom: 1px solid var(--color-border);
}

.monitor-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.header-controls {
  display: flex;
  gap: 8px;
}

.record-btn,
.clear-btn,
.export-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-text-secondary);
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.record-btn.recording {
  background: var(--color-error);
  border-color: var(--color-error);
  color: white;
}

.clear-btn:hover {
  border-color: var(--color-warning);
  color: var(--color-warning);
}

.export-btn:hover {
  border-color: var(--color-success);
  color: var(--color-success);
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
  padding: 20px;
}

.metric-card {
  background: var(--color-background-secondary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 16px;
  transition: all 0.2s;
}

.metric-card:hover {
  border-color: var(--color-border-secondary);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px var(--color-shadow);
}

.metric-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.metric-icon {
  color: var(--color-primary);
}

.metric-title {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.metric-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 4px;
}

.metric-subtitle {
  font-size: 11px;
  color: var(--color-text-tertiary);
  margin-bottom: 12px;
}

.metric-chart {
  height: 40px;
}

.mini-chart {
  display: flex;
  align-items: end;
  height: 100%;
  gap: 1px;
}

.chart-bar {
  flex: 1;
  background: var(--color-primary);
  opacity: 0.7;
  border-radius: 1px;
  min-height: 2px;
  transition: all 0.2s;
}

.memory-bar,
.response-indicator {
  width: 100%;
  height: 8px;
  background: var(--color-background-tertiary);
  border-radius: 4px;
  overflow: hidden;
}

.memory-used {
  height: 100%;
  background: var(--color-primary);
  transition: width 0.3s;
}

.response-bar {
  height: 100%;
  transition: width 0.3s;
}

.response-bar.excellent {
  background: var(--color-success);
}

.response-bar.good {
  background: var(--color-primary);
}

.response-bar.fair {
  background: var(--color-warning);
}

.response-bar.poor {
  background: var(--color-error);
}

.activity-dots {
  display: flex;
  gap: 4px;
  align-items: center;
  height: 100%;
}

.activity-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-background-tertiary);
  transition: all 0.2s;
}

.activity-dot.active {
  background: var(--color-primary);
  transform: scale(1.2);
}

.detailed-stats {
  border-top: 1px solid var(--color-border);
}

.stats-tabs {
  display: flex;
  background: var(--color-background-secondary);
  border-bottom: 1px solid var(--color-border);
}

.stats-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 16px;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 2px solid transparent;
}

.stats-tab:hover {
  background: var(--color-background-tertiary);
  color: var(--color-text-primary);
}

.stats-tab.active {
  background: var(--color-background);
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

.stats-content {
  padding: 20px;
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.stats-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.time-range,
.trend-controls {
  display: flex;
  gap: 8px;
}

.time-select {
  padding: 4px 8px;
  border: 1px solid var(--color-border);
  background: var(--color-background-secondary);
  color: var(--color-text-primary);
  border-radius: 4px;
  font-size: 11px;
}

.trend-btn {
  padding: 4px 8px;
  border: 1px solid var(--color-border);
  background: var(--color-background-secondary);
  color: var(--color-text-secondary);
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}

.trend-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.trend-btn.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.operations-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.operation-item {
  padding: 12px;
  background: var(--color-background-secondary);
  border: 1px solid var(--color-border);
  border-radius: 6px;
}

.operation-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.operation-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-primary);
}

.operation-count {
  font-size: 11px;
  color: var(--color-text-tertiary);
}

.operation-metrics {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
  font-size: 11px;
  color: var(--color-text-secondary);
}

.operation-bar {
  height: 4px;
  background: var(--color-background-tertiary);
  border-radius: 2px;
  overflow: hidden;
}

.operation-progress {
  height: 100%;
  background: var(--color-primary);
  transition: width 0.3s;
}

.trend-chart {
  height: 300px;
  background: var(--color-background-secondary);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 16px;
}

.chart-canvas {
  width: 100%;
  height: 100%;
}

.memory-breakdown {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.memory-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.memory-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.memory-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.memory-bar {
  height: 8px;
  background: var(--color-background-tertiary);
  border-radius: 4px;
  overflow: hidden;
}

.memory-fill {
  height: 100%;
  transition: width 0.3s;
}

.memory-fill.used {
  background: var(--color-primary);
}

.memory-fill.total {
  background: var(--color-warning);
}

.memory-fill.limit {
  background: var(--color-error);
}

.gc-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid var(--color-border);
  background: var(--color-background-secondary);
  color: var(--color-text-secondary);
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.gc-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.suggestion-score {
  display: flex;
  align-items: center;
  gap: 12px;
}

.score-label {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.score-circle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 3px solid;
  font-weight: 700;
}

.score-circle.excellent {
  border-color: var(--color-success);
  color: var(--color-success);
}

.score-circle.good {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.score-circle.fair {
  border-color: var(--color-warning);
  color: var(--color-warning);
}

.score-circle.poor {
  border-color: var(--color-error);
  color: var(--color-error);
}

.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.suggestion-item {
  padding: 16px;
  background: var(--color-background-secondary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  border-left-width: 4px;
}

.suggestion-item.high {
  border-left-color: var(--color-error);
}

.suggestion-item.medium {
  border-left-color: var(--color-warning);
}

.suggestion-item.low {
  border-left-color: var(--color-success);
}

.suggestion-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.suggestion-icon {
  color: var(--color-text-secondary);
}

.suggestion-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
  flex: 1;
}

.suggestion-priority {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: 500;
  text-transform: uppercase;
}

.suggestion-item.high .suggestion-priority {
  background: var(--color-error);
  color: white;
}

.suggestion-item.medium .suggestion-priority {
  background: var(--color-warning);
  color: white;
}

.suggestion-item.low .suggestion-priority {
  background: var(--color-success);
  color: white;
}

.suggestion-description {
  font-size: 12px;
  color: var(--color-text-secondary);
  line-height: 1.4;
  margin: 0 0 12px 0;
}

.suggestion-actions {
  display: flex;
  gap: 8px;
}

.suggestion-action {
  padding: 4px 8px;
  border: 1px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-text-secondary);
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}

.suggestion-action:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.performance-logs {
  border-top: 1px solid var(--color-border);
  background: var(--color-background-secondary);
  max-height: 300px;
  display: flex;
  flex-direction: column;
}

.logs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border);
}

.logs-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.logs-controls {
  display: flex;
  gap: 8px;
}

.clear-logs-btn,
.close-logs-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border: none;
  background: transparent;
  color: var(--color-text-tertiary);
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-logs-btn:hover {
  background: var(--color-background-tertiary);
  color: var(--color-text-primary);
}

.close-logs-btn:hover {
  background: var(--color-error);
  color: white;
}

.logs-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px 16px;
  font-family: monospace;
}

.log-entry {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 2px 0;
  font-size: 11px;
  border-bottom: 1px solid transparent;
}

.log-entry.warn {
  color: var(--color-warning);
}

.log-entry.error {
  color: var(--color-error);
}

.log-entry.info {
  color: var(--color-text-secondary);
}

.log-time {
  color: var(--color-text-tertiary);
  min-width: 80px;
}

.log-level {
  min-width: 40px;
  font-weight: 500;
}

.log-message {
  flex: 1;
}

.log-duration {
  color: var(--color-text-tertiary);
  min-width: 50px;
  text-align: right;
}

.floating-logs-btn {
  position: fixed;
  bottom: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  transition: all 0.2s;
  z-index: 1000;
}

.floating-logs-btn:hover {
  transform: scale(1.1);
}

.floating-logs-btn.alert {
  background: var(--color-error);
  animation: pulse 2s infinite;
}

.alert-dot {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 8px;
  height: 8px;
  background: var(--color-warning);
  border-radius: 50%;
  border: 2px solid white;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-tabs {
    flex-wrap: wrap;
  }
  
  .stats-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .floating-logs-btn {
    bottom: 80px;
  }
}
</style>