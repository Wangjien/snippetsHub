<template>
  <Teleport to="body">
    <Transition name="theme-transition" appear>
      <div v-if="isVisible" class="theme-transition-overlay" @click="hide">
        <div class="transition-container" @click.stop>
          <div class="transition-content">
            <!-- 主题切换动画 -->
            <div class="theme-animation">
              <div class="animation-circle" :class="animationClass">
                <component 
                  :is="fromIcon" 
                  :size="32" 
                  class="theme-icon from-icon"
                  :class="{ 'fade-out': isAnimating }"
                />
                <component 
                  :is="toIcon" 
                  :size="32" 
                  class="theme-icon to-icon"
                  :class="{ 'fade-in': isAnimating }"
                />
              </div>
            </div>

            <!-- 主题信息 -->
            <div class="theme-info">
              <div class="theme-name">{{ toThemeName }}</div>
              <div class="theme-description">{{ toThemeDescription }}</div>
            </div>

            <!-- 进度条 -->
            <div class="progress-container">
              <div class="progress-bar" :style="{ width: `${progress}%` }"></div>
            </div>

            <!-- 状态文本 -->
            <div class="status-text">{{ statusText }}</div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Sun, Moon, Monitor, Eye, Contrast, Palette } from 'lucide-vue-next'
import { THEMES, THEME_LABELS } from '../constants'

const props = defineProps({
  fromTheme: {
    type: String,
    required: true
  },
  toTheme: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    default: 1000
  }
})

const emit = defineEmits(['complete'])

const isVisible = ref(false)
const isAnimating = ref(false)
const progress = ref(0)
const statusText = ref('准备切换主题...')

let progressInterval = null
let animationTimeout = null

// 获取主题图标
const getThemeIcon = (theme) => {
  const icons = {
    [THEMES.LIGHT]: Sun,
    [THEMES.DARK]: Moon,
    [THEMES.HIGH_CONTRAST]: Contrast,
    [THEMES.SEPIA]: Eye,
    [THEMES.AUTO]: Monitor
  }
  return icons[theme] || Palette
}

// 获取主题描述
const getThemeDescription = (theme) => {
  const descriptions = {
    [THEMES.LIGHT]: '明亮清晰，适合白天使用',
    [THEMES.DARK]: '暗色护眼，适合夜间使用',
    [THEMES.HIGH_CONTRAST]: '高对比度，提升可读性',
    [THEMES.SEPIA]: '护眼模式，减少蓝光刺激'
  }
  return descriptions[theme] || '主题切换中...'
}

const fromIcon = computed(() => getThemeIcon(props.fromTheme))
const toIcon = computed(() => getThemeIcon(props.toTheme))
const toThemeName = computed(() => THEME_LABELS[props.toTheme] || '未知主题')
const toThemeDescription = computed(() => getThemeDescription(props.toTheme))

const animationClass = computed(() => {
  const classes = []
  
  // 根据主题类型添加动画类
  if (props.fromTheme === THEMES.LIGHT && props.toTheme === THEMES.DARK) {
    classes.push('light-to-dark')
  } else if (props.fromTheme === THEMES.DARK && props.toTheme === THEMES.LIGHT) {
    classes.push('dark-to-light')
  } else {
    classes.push('theme-change')
  }
  
  if (isAnimating.value) {
    classes.push('animating')
  }
  
  return classes
})

// 显示过渡动画
const show = () => {
  isVisible.value = true
  startAnimation()
}

// 隐藏过渡动画
const hide = () => {
  isVisible.value = false
  cleanup()
  emit('complete')
}

// 开始动画
const startAnimation = () => {
  progress.value = 0
  statusText.value = '正在切换主题...'
  
  // 开始图标动画
  setTimeout(() => {
    isAnimating.value = true
  }, 200)
  
  // 进度条动画
  progressInterval = setInterval(() => {
    progress.value += 2
    
    if (progress.value >= 30 && progress.value < 60) {
      statusText.value = '应用主题配置...'
    } else if (progress.value >= 60 && progress.value < 90) {
      statusText.value = '更新界面样式...'
    } else if (progress.value >= 90) {
      statusText.value = '主题切换完成！'
    }
    
    if (progress.value >= 100) {
      clearInterval(progressInterval)
      setTimeout(hide, 300)
    }
  }, props.duration / 50)
  
  // 自动隐藏
  animationTimeout = setTimeout(() => {
    hide()
  }, props.duration + 500)
}

// 清理资源
const cleanup = () => {
  if (progressInterval) {
    clearInterval(progressInterval)
    progressInterval = null
  }
  
  if (animationTimeout) {
    clearTimeout(animationTimeout)
    animationTimeout = null
  }
  
  isAnimating.value = false
  progress.value = 0
}

// 键盘事件处理
const handleKeydown = (event) => {
  if (event.key === 'Escape') {
    hide()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  show()
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  cleanup()
})

// 暴露方法给父组件
defineExpose({
  show,
  hide
})
</script>

<style scoped>
.theme-transition-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--color-overlay);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  cursor: pointer;
}

.transition-container {
  cursor: default;
}

.transition-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding: 40px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  box-shadow: 0 20px 60px var(--color-shadow);
  min-width: 320px;
  text-align: center;
}

/* 主题动画 */
.theme-animation {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.animation-circle {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--color-background-secondary);
  border: 2px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition: all 0.6s ease;
}

.animation-circle.animating {
  transform: scale(1.1);
  box-shadow: 0 0 30px var(--color-primary);
}

.theme-icon {
  position: absolute;
  color: var(--color-primary);
  transition: all 0.4s ease;
}

.from-icon {
  opacity: 1;
  transform: scale(1) rotate(0deg);
}

.from-icon.fade-out {
  opacity: 0;
  transform: scale(0.8) rotate(-180deg);
}

.to-icon {
  opacity: 0;
  transform: scale(0.8) rotate(180deg);
}

.to-icon.fade-in {
  opacity: 1;
  transform: scale(1) rotate(0deg);
}

/* 特殊动画效果 */
.animation-circle.light-to-dark.animating {
  background: linear-gradient(45deg, #ffffff, #1e1e2e);
  animation: lightToDark 0.8s ease-in-out;
}

.animation-circle.dark-to-light.animating {
  background: linear-gradient(45deg, #1e1e2e, #ffffff);
  animation: darkToLight 0.8s ease-in-out;
}

.animation-circle.theme-change.animating {
  animation: themeChange 0.8s ease-in-out;
}

@keyframes lightToDark {
  0% { background: #ffffff; }
  50% { background: #888888; transform: scale(1.2) rotate(180deg); }
  100% { background: #1e1e2e; transform: scale(1.1) rotate(360deg); }
}

@keyframes darkToLight {
  0% { background: #1e1e2e; }
  50% { background: #888888; transform: scale(1.2) rotate(180deg); }
  100% { background: #ffffff; transform: scale(1.1) rotate(360deg); }
}

@keyframes themeChange {
  0% { transform: scale(1) rotate(0deg); }
  25% { transform: scale(1.1) rotate(90deg); }
  50% { transform: scale(1.2) rotate(180deg); }
  75% { transform: scale(1.1) rotate(270deg); }
  100% { transform: scale(1.1) rotate(360deg); }
}

/* 主题信息 */
.theme-info {
  text-align: center;
}

.theme-name {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 8px;
}

.theme-description {
  font-size: 14px;
  color: var(--color-text-secondary);
  line-height: 1.4;
}

/* 进度条 */
.progress-container {
  width: 100%;
  height: 4px;
  background: var(--color-background-tertiary);
  border-radius: 2px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), var(--color-primary-hover));
  border-radius: 2px;
  transition: width 0.1s ease;
  position: relative;
}

.progress-bar::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  animation: shimmer 1s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

/* 状态文本 */
.status-text {
  font-size: 14px;
  color: var(--color-text-secondary);
  font-weight: 500;
  min-height: 20px;
}

/* 过渡动画 */
.theme-transition-enter-active,
.theme-transition-leave-active {
  transition: background-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
}

.theme-transition-enter-from {
  opacity: 0;
  transform: scale(0.9);
}

.theme-transition-leave-to {
  opacity: 0;
  transform: scale(1.1);
}

/* 响应式 */
@media (max-width: 480px) {
  .transition-content {
    padding: 32px 24px;
    min-width: 280px;
  }
  
  .animation-circle {
    width: 64px;
    height: 64px;
  }
  
  .theme-icon {
    width: 24px;
    height: 24px;
  }
  
  .theme-name {
    font-size: 18px;
  }
}

/* 减少动画模式支持 */
@media (prefers-reduced-motion: reduce) {
  .animation-circle,
  .theme-icon,
  .progress-bar {
    transition: none !important;
    animation: none !important;
  }
  
  .animation-circle.animating {
    transform: none;
  }
  
  .progress-bar::after {
    animation: none;
  }
}
</style>