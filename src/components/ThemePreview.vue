/**
 * SnippetsHub - 代码片段管理工具
 * 
 * @file ThemePreview.vue - 主题预览组件
 * @author Noah
 * @description 主题预览和对比组件，展示不同主题的视觉效果
 * @created 2026-01-20
 * @modified 2026-01-29
 * @version 1.0.0
 * 
 * 功能特性:
 * - 实时主题预览
 * - 颜色方案展示
 * - 主题对比功能
 * - 视觉效果演示
 * - 主题切换动画
 * - 响应式布局
 * - 无障碍访问支持
 * - 主题统计信息
 */

<template>
  <div class="theme-preview-container">
    <div class="preview-header">
      <h3>主题预览</h3>
      <div class="preview-controls">
        <button 
          v-for="theme in availableThemes" 
          :key="theme"
          @click="previewTheme = theme"
          class="preview-btn"
          :class="{ active: previewTheme === theme }"
        >
          <component :is="getThemeIcon(theme)" :size="16" />
          {{ getThemeLabel(theme) }}
        </button>
      </div>
    </div>

    <div class="preview-content" :style="getPreviewStyles()">
      <!-- 模拟应用界面 -->
      <div class="preview-app">
        <!-- 侧边栏预览 -->
        <div class="preview-sidebar">
          <div class="preview-logo">
            <Package :size="20" />
            <span>SnippetsHub</span>
          </div>
          <nav class="preview-nav">
            <div class="preview-nav-item active">
              <Code :size="16" />
              <span>代码管理</span>
            </div>
            <div class="preview-nav-item">
              <CheckSquare :size="16" />
              <span>TODO List</span>
            </div>
            <div class="preview-nav-item">
              <FileText :size="16" />
              <span>Markdown</span>
            </div>
          </nav>
        </div>

        <!-- 主内容区预览 -->
        <div class="preview-main">
          <div class="preview-header-bar">
            <h4>代码片段</h4>
            <button class="preview-button primary">
              <Plus :size="14" />
              新建
            </button>
          </div>

          <div class="preview-content-area">
            <!-- 代码片段卡片 -->
            <div class="preview-card">
              <div class="card-header">
                <h5>React Hook 示例</h5>
                <span class="language-tag">
                  <i class="devicon-javascript-plain" style="margin-right: 4px"></i>
                  JavaScript
                </span>
              </div>
              <p class="card-description">自定义 React Hook 用于状态管理</p>
              <div class="card-tags">
                <span class="tag">React</span>
                <span class="tag">Hook</span>
                <span class="tag">State</span>
              </div>
            </div>

            <div class="preview-card">
              <div class="card-header">
                <h5>CSS Grid 布局</h5>
                <span class="language-tag">
                  <i class="devicon-css3-plain" style="margin-right: 4px"></i>
                  CSS
                </span>
              </div>
              <p class="card-description">响应式网格布局的最佳实践</p>
              <div class="card-tags">
                <span class="tag">CSS</span>
                <span class="tag">Grid</span>
                <span class="tag">Layout</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 主题信息 -->
      <div class="theme-info">
        <div class="info-item">
          <span class="info-label">主题名称:</span>
          <span class="info-value">{{ getThemeLabel(previewTheme) }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">适用场景:</span>
          <span class="info-value">{{ getThemeDescription(previewTheme) }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">主色调:</span>
          <div class="color-swatch" :style="{ backgroundColor: getThemeColors(previewTheme).primary }"></div>
          <span class="info-value">{{ getThemeColors(previewTheme).primary }}</span>
        </div>
      </div>

      <!-- 应用按钮 -->
      <div class="preview-actions">
        <button 
          @click="applyTheme"
          class="apply-btn"
          :disabled="previewTheme === themeStore.appliedTheme"
        >
          <Palette :size="16" />
          应用此主题
        </button>
        <button @click="resetPreview" class="reset-btn">
          <RotateCcw :size="16" />
          重置预览
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { 
  Package, Code, CheckSquare, FileText, Plus, Palette, RotateCcw,
  Sun, Moon, Monitor, Eye, Contrast
} from 'lucide-vue-next'
import { useThemeStore } from '../stores/themeStore'
import { THEMES, THEME_LABELS } from '../constants'

const themeStore = useThemeStore()
const previewTheme = ref(themeStore.appliedTheme)

const availableThemes = computed(() => [
  THEMES.LIGHT,
  THEMES.DARK,
  THEMES.HIGH_CONTRAST,
  THEMES.SEPIA
])

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

// 获取主题标签
const getThemeLabel = (theme) => {
  return THEME_LABELS[theme] || '未知主题'
}

// 获取主题描述
const getThemeDescription = (theme) => {
  const descriptions = {
    [THEMES.LIGHT]: '适合白天使用，清晰明亮',
    [THEMES.DARK]: '适合夜间使用，护眼舒适',
    [THEMES.HIGH_CONTRAST]: '高对比度，提升可读性',
    [THEMES.SEPIA]: '护眼模式，减少蓝光刺激'
  }
  return descriptions[theme] || '主题描述'
}

// 获取主题颜色
const getThemeColors = (theme) => {
  const config = themeStore.getThemeConfig(theme)
  return config ? config.colors : {}
}

// 获取预览样式
const getPreviewStyles = () => {
  const colors = getThemeColors(previewTheme.value)
  return {
    '--preview-bg': colors.background,
    '--preview-bg-secondary': colors.backgroundSecondary,
    '--preview-bg-tertiary': colors.backgroundTertiary,
    '--preview-text-primary': colors.textPrimary,
    '--preview-text-secondary': colors.textSecondary,
    '--preview-text-tertiary': colors.textTertiary,
    '--preview-border': colors.border,
    '--preview-border-secondary': colors.borderSecondary,
    '--preview-primary': colors.primary,
    '--preview-primary-hover': colors.primaryHover,
    '--preview-success': colors.success,
    '--preview-warning': colors.warning,
    '--preview-error': colors.error,
    '--preview-shadow': colors.shadow
  }
}

// 应用主题
const applyTheme = () => {
  themeStore.setTheme(previewTheme.value)
}

// 重置预览
const resetPreview = () => {
  previewTheme.value = themeStore.appliedTheme
}

onMounted(() => {
  previewTheme.value = themeStore.appliedTheme
})
</script>

<style scoped>
.theme-preview-container {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  overflow: hidden;
}

.preview-header {
  padding: 20px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-background-secondary);
}

.preview-header h3 {
  margin: 0 0 16px 0;
  color: var(--color-text-primary);
  font-size: 18px;
  font-weight: 600;
}

.preview-controls {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.preview-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  color: var(--color-text-primary);
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease, transform 0.15s ease;
  font-size: 13px;
}

.preview-btn:hover {
  background: var(--color-background-tertiary);
  border-color: var(--color-border-secondary);
}

.preview-btn.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.preview-content {
  padding: 20px;
  background: var(--preview-bg);
  color: var(--preview-text-primary);
  transition: background-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
}

/* 模拟应用界面 */
.preview-app {
  display: flex;
  height: 300px;
  border: 1px solid var(--preview-border);
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 20px;
}

.preview-sidebar {
  width: 200px;
  background: var(--preview-bg-secondary);
  border-right: 1px solid var(--preview-border);
  padding: 16px;
}

.preview-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  font-weight: 600;
  color: var(--preview-text-primary);
}

.preview-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.preview-nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  color: var(--preview-text-secondary);
  font-size: 14px;
  transition: background-color 0.15s ease, color 0.15s ease, transform 0.15s ease;
}

.preview-nav-item.active {
  background: var(--preview-primary);
  color: white;
}

.preview-main {
  flex: 1;
  background: var(--preview-bg);
  display: flex;
  flex-direction: column;
}

.preview-header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--preview-border);
  background: var(--preview-bg-secondary);
}

.preview-header-bar h4 {
  margin: 0;
  color: var(--preview-text-primary);
  font-size: 16px;
}

.preview-button {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: 1px solid var(--preview-border);
  border-radius: 6px;
  background: var(--preview-bg);
  color: var(--preview-text-primary);
  font-size: 13px;
  cursor: pointer;
}

.preview-button.primary {
  background: var(--preview-primary);
  border-color: var(--preview-primary);
  color: white;
}

.preview-content-area {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.preview-card {
  background: var(--preview-bg-secondary);
  border: 1px solid var(--preview-border);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.card-header h5 {
  margin: 0;
  color: var(--preview-text-primary);
  font-size: 14px;
  font-weight: 600;
}

.language-tag {
  background: var(--preview-border);
  color: var(--preview-primary);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.card-description {
  margin: 0 0 12px 0;
  color: var(--preview-text-secondary);
  font-size: 13px;
  line-height: 1.4;
}

.card-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.tag {
  background: var(--preview-bg-tertiary);
  color: var(--preview-text-tertiary);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
}

/* 主题信息 */
.theme-info {
  background: var(--color-background-secondary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-label {
  font-size: 13px;
  color: var(--color-text-secondary);
  min-width: 80px;
}

.info-value {
  font-size: 13px;
  color: var(--color-text-primary);
  font-weight: 500;
}

.color-swatch {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 1px solid var(--color-border);
}

/* 操作按钮 */
.preview-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.apply-btn,
.reset-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease, transform 0.15s ease;
}

.apply-btn {
  background: var(--color-primary);
  color: white;
}

.apply-btn:hover:not(:disabled) {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
}

.apply-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.reset-btn {
  background: var(--color-background-secondary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.reset-btn:hover {
  background: var(--color-background-tertiary);
  border-color: var(--color-border-secondary);
}

/* 响应式 */
@media (max-width: 768px) {
  .preview-app {
    height: 250px;
  }
  
  .preview-sidebar {
    width: 160px;
  }
  
  .preview-actions {
    flex-direction: column;
  }
}
</style>