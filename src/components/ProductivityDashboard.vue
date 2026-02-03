/**
 * SnippetsHub - 专业代码片段管理工具
 * 
 * @file ProductivityDashboard.vue - 生产力分析仪表板
 * @author Noah
 * @description 显示任务完成情况、时间统计、效率分析等生产力指标
 * @created 2026-02-01
 * @version 1.0.0
 */

<template>
  <div class="productivity-dashboard">
    <div class="dashboard-header">
      <h3>生产力分析</h3>
      <div class="time-range-selector">
        <button 
          v-for="range in timeRanges" 
          :key="range.value"
          @click="selectedRange = range.value"
          :class="{ active: selectedRange === range.value }"
          class="range-btn"
        >
          {{ range.label }}
        </button>
      </div>
    </div>

    <div class="dashboard-content">
      <!-- Key Metrics -->
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-icon">
            <Target :size="24" />
          </div>
          <div class="metric-content">
            <div class="metric-value">{{ Math.round(stats.completionRate * 100) }}%</div>
            <div class="metric-label">完成率</div>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon">
            <Clock :size="24" />
          </div>
          <div class="metric-content">
            <div class="metric-value">{{ stats.totalActual.toFixed(1) }}h</div>
            <div class="metric-label">总工作时间</div>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon">
            <Zap :size="24" />
          </div>
          <div class="metric-content">
            <div class="metric-value">{{ Math.round(stats.efficiency * 100) }}%</div>
            <div class="metric-label">时间效率</div>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon">
            <TrendingUp :size="24" />
          </div>
          <div class="metric-content">
            <div class="metric-value">{{ stats.averageTaskTime.toFixed(1) }}h</div>
            <div class="metric-label">平均任务时间</div>
          </div>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="charts-section">
        <!-- Completion Trend Chart -->
        <div class="chart-card">
          <div class="chart-header">
            <h4>完成趋势</h4>
            <div class="chart-legend">
              <div class="legend-item">
                <div class="legend-color completed"></div>
                <span>已完成</span>
              </div>
              <div class="legend-item">
                <div class="legend-color created"></div>
                <span>新创建</span>
              </div>
            </div>
          </div>
          <div class="chart-content">
            <div class="trend-chart">
              <div 
                v-for="(day, index) in trendData" 
                :key="index"
                class="trend-bar"
                :style="{ height: Math.max(day.completed * 10, 4) + 'px' }"
                :title="`${day.date}: 完成 ${day.completed} 个任务`"
              >
                <div class="bar-completed" :style="{ height: '100%' }"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Time Distribution Chart -->
        <div class="chart-card">
          <div class="chart-header">
            <h4>时间分布</h4>
          </div>
          <div class="chart-content">
            <div class="time-distribution">
              <div class="distribution-item">
                <div class="distribution-label">预估时间</div>
                <div class="distribution-bar">
                  <div 
                    class="distribution-fill estimated"
                    :style="{ width: '100%' }"
                  ></div>
                </div>
                <div class="distribution-value">{{ stats.totalEstimated.toFixed(1) }}h</div>
              </div>
              <div class="distribution-item">
                <div class="distribution-label">实际时间</div>
                <div class="distribution-bar">
                  <div 
                    class="distribution-fill actual"
                    :style="{ 
                      width: stats.totalEstimated > 0 
                        ? Math.min((stats.totalActual / stats.totalEstimated) * 100, 100) + '%' 
                        : '0%' 
                    }"
                  ></div>
                </div>
                <div class="distribution-value">{{ stats.totalActual.toFixed(1) }}h</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Detailed Stats -->
      <div class="detailed-stats">
        <div class="stats-card">
          <h4>任务统计</h4>
          <div class="stats-list">
            <div class="stats-item">
              <span class="stats-label">总任务数</span>
              <span class="stats-value">{{ totalTasks }}</span>
            </div>
            <div class="stats-item">
              <span class="stats-label">已完成</span>
              <span class="stats-value">{{ completedTasks }}</span>
            </div>
            <div class="stats-item">
              <span class="stats-label">进行中</span>
              <span class="stats-value">{{ inProgressTasks }}</span>
            </div>
            <div class="stats-item">
              <span class="stats-label">待开始</span>
              <span class="stats-value">{{ pendingTasks }}</span>
            </div>
          </div>
        </div>

        <div class="stats-card">
          <h4>效率指标</h4>
          <div class="stats-list">
            <div class="stats-item">
              <span class="stats-label">按时完成率</span>
              <span class="stats-value">{{ onTimeRate }}%</span>
            </div>
            <div class="stats-item">
              <span class="stats-label">平均延期天数</span>
              <span class="stats-value">{{ averageDelay.toFixed(1) }}</span>
            </div>
            <div class="stats-item">
              <span class="stats-label">时间估算准确率</span>
              <span class="stats-value">{{ estimationAccuracy }}%</span>
            </div>
            <div class="stats-item">
              <span class="stats-label">日均完成任务</span>
              <span class="stats-value">{{ dailyAverage.toFixed(1) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Recommendations -->
      <div class="recommendations">
        <h4>优化建议</h4>
        <div class="recommendation-list">
          <div v-for="recommendation in recommendations" :key="recommendation.id" class="recommendation-item">
            <div class="recommendation-icon">
              <component :is="recommendation.icon" :size="16" />
            </div>
            <div class="recommendation-content">
              <div class="recommendation-title">{{ recommendation.title }}</div>
              <div class="recommendation-description">{{ recommendation.description }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { 
  Target, Clock, Zap, TrendingUp, AlertCircle, 
  CheckCircle, Calendar, BarChart3
} from 'lucide-vue-next'

const props = defineProps({
  stats: {
    type: Object,
    required: true
  }
})

const selectedRange = ref('week')

const timeRanges = [
  { value: 'week', label: '本周' },
  { value: 'month', label: '本月' },
  { value: 'quarter', label: '本季度' },
  { value: 'year', label: '本年' }
]

// Mock data for demonstration
const trendData = computed(() => {
  // Generate mock trend data for the last 7 days
  const data = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    data.push({
      date: date.toLocaleDateString(),
      completed: Math.floor(Math.random() * 5) + 1,
      created: Math.floor(Math.random() * 3) + 1
    })
  }
  return data
})

const totalTasks = computed(() => 25) // Mock data
const completedTasks = computed(() => Math.round(totalTasks.value * props.stats.completionRate))
const inProgressTasks = computed(() => Math.floor(totalTasks.value * 0.2))
const pendingTasks = computed(() => totalTasks.value - completedTasks.value - inProgressTasks.value)

const onTimeRate = computed(() => Math.round(Math.random() * 30 + 70)) // Mock data
const averageDelay = computed(() => Math.random() * 2 + 0.5) // Mock data
const estimationAccuracy = computed(() => Math.round(props.stats.efficiency * 100))
const dailyAverage = computed(() => completedTasks.value / 7)

const recommendations = computed(() => {
  const recs = []
  
  if (props.stats.completionRate < 0.7) {
    recs.push({
      id: 'completion',
      icon: Target,
      title: '提高任务完成率',
      description: '当前完成率较低，建议分解大任务为小任务，设置更合理的截止日期。'
    })
  }
  
  if (props.stats.efficiency < 0.8) {
    recs.push({
      id: 'efficiency',
      icon: Zap,
      title: '优化时间估算',
      description: '实际用时超出预估，建议记录更详细的时间日志，提高估算准确性。'
    })
  }
  
  if (props.stats.averageTaskTime > 8) {
    recs.push({
      id: 'task-size',
      icon: AlertCircle,
      title: '控制任务规模',
      description: '平均任务时间过长，建议将大任务拆分为2-4小时的小任务。'
    })
  }
  
  recs.push({
    id: 'consistency',
    icon: Calendar,
    title: '保持工作节奏',
    description: '建议每天完成2-3个任务，保持稳定的工作节奏。'
  })
  
  return recs
})
</script>

<style scoped>
.productivity-dashboard {
  padding: 20px;
  max-height: 80vh;
  overflow-y: auto;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.dashboard-header h3 {
  margin: 0;
  color: var(--color-text-primary);
}

.time-range-selector {
  display: flex;
  gap: 4px;
  background: var(--color-border);
  padding: 2px;
  border-radius: 6px;
}

.range-btn {
  background: none;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  color: var(--color-text-secondary);
  transition: all 0.2s;
}

.range-btn:hover {
  color: var(--color-text-primary);
}

.range-btn.active {
  background: var(--color-background);
  color: var(--color-primary);
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.dashboard-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.metric-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--color-background-secondary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 16px;
}

.metric-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: var(--color-primary);
  color: var(--color-background);
  border-radius: 8px;
}

.metric-content {
  flex: 1;
}

.metric-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: 1;
}

.metric-label {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-top: 4px;
}

.charts-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.chart-card {
  background: var(--color-background-secondary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 16px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.chart-header h4 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 14px;
}

.chart-legend {
  display: flex;
  gap: 12px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.legend-color.completed {
  background: var(--color-success);
}

.legend-color.created {
  background: var(--color-primary);
}

.trend-chart {
  display: flex;
  align-items: end;
  gap: 4px;
  height: 100px;
  padding: 8px 0;
}

.trend-bar {
  flex: 1;
  background: var(--color-border);
  border-radius: 2px;
  min-height: 4px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.trend-bar:hover {
  opacity: 0.8;
}

.bar-completed {
  background: var(--color-success);
  border-radius: 2px;
}

.time-distribution {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.distribution-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.distribution-label {
  width: 80px;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.distribution-bar {
  flex: 1;
  height: 8px;
  background: var(--color-border);
  border-radius: 4px;
  overflow: hidden;
}

.distribution-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.distribution-fill.estimated {
  background: var(--color-primary);
}

.distribution-fill.actual {
  background: var(--color-warning);
}

.distribution-value {
  width: 60px;
  text-align: right;
  font-size: 12px;
  color: var(--color-text-primary);
  font-weight: 500;
}

.detailed-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.stats-card {
  background: var(--color-background-secondary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 16px;
}

.stats-card h4 {
  margin: 0 0 12px 0;
  color: var(--color-text-primary);
  font-size: 14px;
}

.stats-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stats-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stats-label {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.stats-value {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
}

.recommendations {
  background: var(--color-background-secondary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 16px;
}

.recommendations h4 {
  margin: 0 0 12px 0;
  color: var(--color-text-primary);
  font-size: 14px;
}

.recommendation-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.recommendation-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: var(--color-background);
  border-radius: 6px;
  border: 1px solid var(--color-border);
}

.recommendation-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: var(--color-primary);
  color: var(--color-background);
  border-radius: 6px;
  flex-shrink: 0;
}

.recommendation-content {
  flex: 1;
}

.recommendation-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: 4px;
}

.recommendation-description {
  font-size: 12px;
  color: var(--color-text-secondary);
  line-height: 1.4;
}
</style>