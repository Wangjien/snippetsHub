/**
 * SnippetsHub - 专业代码片段管理工具
 * 
 * @file AdvancedThemeToggle.vue - 高级主题切换组件
 * @author Noah
 * @description 集成多种主题模式（亮色、暗色、高对比度、护眼），支持快捷键切换和预览
 * @created 2026-02-02
 * @version 1.0.0
 * 
 * 功能特性:
 * - 多主题模式切换
 * - 跟随系统设置
 * - 实时主题预览
 * - 切换过渡动画
 * - 键盘快捷键支持
 */
<template>
  <div class="advanced-theme-toggle" :class="{ 'is-open': isOpen }">
    <!-- 主题切换按钮 -->
    <button
      @click="toggleDropdown"
      class="theme-toggle-btn"
      :title="getToggleTitle()"
      :aria-label="getToggleTitle()"
      :aria-expanded="isOpen"
    >
      <div class="theme-icon-container">
        <component
          :is="getCurrentThemeIcon()"
          :size="iconSize"
          class="theme-icon"
          :class="{ 'rotating': isChanging }"
        />
      </div>
      <span v-if="showLabel" class="theme-label">
        {{ getCurrentThemeLabel() }}
      </span>
      <ChevronDown v-if="showDropdown" :size="14" class="dropdown-arrow" :class="{ 'rotated': isOpen }" />
    </button>

    <!-- 主题选择下拉菜单 -->
    <Transition name="dropdown">
      <div v-if="showDropdown && isOpen" class="theme-dropdown" @click.stop>
        <div class="dropdown-header">
          <Palette :size="16" />
          <span>选择主题</span>
        </div>
        
        <div class="theme-options">
          <div
            v-for="theme in availableThemes"
            :key="theme"
            @click="selectTheme(theme)"
            class="theme-option"
            :class="{ 
              active: isThemeActive(theme),
              disabled: theme === THEMES.AUTO && !supportsSystemTheme
            }"
          >
            <div class="theme-preview" :style="getThemePreviewStyle(theme)">
              <div class="preview-bg"></div>
              <div class="preview-accent"></div>
            </div>
            
            <div class="theme-info">
              <div class="theme-name">{{ getThemeLabelByType(theme) }}</div>
              <div class="theme-description">{{ getThemeDescription(theme) }}</div>
            </div>
            
            <component :is="getThemeIconByType(theme)" :size="16" class="theme-icon-small" />
            
            <Check v-if="isThemeActive(theme)" :size="14" class="check-icon" />
          </div>
        </div>
        
        <div class="dropdown-divider"></div>
        
        <!-- 系统跟随选项 -->
        <div
          @click="toggleFollowSystem"
          class="theme-option system-option"
          :class="{ active: themeStore.followSystemTheme }"
        >
          <div class="theme-preview system-preview">
            <div class="preview-bg system-bg"></div>
            <div class="preview-accent system-accent"></div>
          </div>
          
          <div class="theme-info">
            <div class="theme-name">跟随系统</div>
            <div class="theme-description">自动切换明暗主题</div>
          </div>
          
          <Monitor :size="16" class="theme-icon-small" />
          
          <Check v-if="themeStore.followSystemTheme" :size="14" class="check-icon" />
        </div>

        <!-- 快捷键提示 -->
        <div class="dropdown-footer">
          <div class="shortcut-hint">
            <kbd>{{ shortcutKey }}</kbd>
            <span>快速切换</span>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 主题切换动画遮罩 -->
    <Transition name="theme-transition">
      <div v-if="isChanging" class="theme-transition-overlay">
        <div class="transition-content">
          <div class="transition-icon">
            <Palette :size="32" class="pulse-icon" />
          </div>
          <div class="transition-text">切换主题中...</div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { 
  Sun, Moon, Monitor, Palette, ChevronDown, Check, 
  Eye, Contrast, Sunrise 
} from 'lucide-vue-next'
import { useThemeStore } from '../stores/themeStore'
import { THEMES, THEME_LABELS } from '../constants'

const props = defineProps({
  iconSize: {
    type: Number,
    default: 18
  },
  showLabel: {
    type: Boolean,
    default: false
  },
  showDropdown: {
    type: Boolean,
    default: true
  },
  variant: {
    type: String,
    default: 'button',
    validator: (value) => ['button', 'icon', 'compact'].includes(value)
  }
})

const themeStore = useThemeStore()
const isOpen = ref(false)
const isChanging = ref(false)
const supportsSystemTheme = ref(false)

// 快捷键显示
const shortcutKey = computed(() => {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0
  return isMac ? '⌘⇧T' : 'Ctrl+Shift+T'
})

// 可用主题
const availableThemes = computed(() => [
  THEMES.LIGHT, 
  THEMES.DARK, 
  THEMES.HIGH_CONTRAST, 
  THEMES.SEPIA
])

// 获取当前主题图标
const getCurrentThemeIcon = () => {
  if (themeStore.followSystemTheme) {
    return Monitor
  }
  return getThemeIconByType(themeStore.appliedTheme)
}

// 根据主题类型获取图标
const getThemeIconByType = (theme) => {
  switch (theme) {
    case THEMES.LIGHT:
      return Sun
    case THEMES.DARK:
      return Moon
    case THEMES.HIGH_CONTRAST:
      return Contrast
    case THEMES.SEPIA:
      return Eye
    case THEMES.AUTO:
      return Monitor
    default:
      return Palette
  }
}

// 获取当前主题标签
const getCurrentThemeLabel = () => {
  if (themeStore.followSystemTheme) {
    return '跟随系统'
  }
  return THEME_LABELS[themeStore.appliedTheme] || '未知主题'
}

// 根据主题类型获取标签
const getThemeLabelByType = (theme) => {
  return THEME_LABELS[theme] || '未知主题'
}

// 获取主题描述
const getThemeDescription = (theme) => {
  const descriptions = {
    [THEMES.LIGHT]: '适合白天使用的明亮主题',
    [THEMES.DARK]: '适合夜间使用的暗色主题',
    [THEMES.HIGH_CONTRAST]: '高对比度，提升可读性',
    [THEMES.SEPIA]: '护眼模式，减少蓝光刺激'
  }
  return descriptions[theme] || ''
}

// 获取主题预览样式
const getThemePreviewStyle = (theme) => {
  const config = themeStore.getThemeConfig(theme)
  if (!config) return {}
  
  return {
    '--preview-bg': config.colors.background,
    '--preview-secondary': config.colors.backgroundSecondary,
    '--preview-accent': config.colors.primary
  }
}

// 获取切换按钮标题
const getToggleTitle = () => {
  const currentLabel = getCurrentThemeLabel()
  return `当前主题: ${currentLabel}，点击${props.showDropdown ? '选择' : '切换'}主题`
}

// 切换下拉菜单
const toggleDropdown = () => {
  if (props.showDropdown) {
    isOpen.value = !isOpen.value
  } else {
    quickToggleTheme()
  }
}

// 快速切换主题
const quickToggleTheme = async () => {
  isChanging.value = true
  
  // 添加切换动画延迟
  await new Promise(resolve => setTimeout(resolve, 150))
  
  themeStore.toggleTheme()
  
  // 等待主题应用完成
  await nextTick()
  await new Promise(resolve => setTimeout(resolve, 300))
  
  isChanging.value = false
}

// 选择主题
const selectTheme = async (theme) => {
  if (theme === THEMES.AUTO && !supportsSystemTheme.value) {
    return
  }
  
  isOpen.value = false
  
  // 使用过渡动画
  themeStore.setTheme(theme, true)
}

// 切换跟随系统
const toggleFollowSystem = async () => {
  isOpen.value = false
  
  themeStore.setFollowSystemTheme(!themeStore.followSystemTheme)
}

// 检查主题是否激活
const isThemeActive = (theme) => {
  if (themeStore.followSystemTheme) {
    return false
  }
  return themeStore.currentTheme === theme
}

// 点击外部关闭下拉菜单
const handleClickOutside = (event) => {
  if (!event.target.closest('.advanced-theme-toggle')) {
    isOpen.value = false
  }
}

// 键盘事件处理
const handleKeydown = (event) => {
  if (isOpen.value) {
    if (event.key === 'Escape') {
      isOpen.value = false
    }
  }
}

onMounted(() => {
  // 检测系统主题支持
  supportsSystemTheme.value = typeof window !== 'undefined' && 
    window.matchMedia && 
    window.matchMedia('(prefers-color-scheme: dark)').matches !== undefined

  if (props.showDropdown) {
    document.addEventListener('click', handleClickOutside)
    document.addEventListener('keydown', handleKeydown)
  }
})

onUnmounted(() => {
  if (props.showDropdown) {
    document.removeEventListener('click', handleClickOutside)
    document.removeEventListener('keydown', handleKeydown)
  }
})
</script>

<style scoped>
.advanced-theme-toggle {
  position: relative;
  display: inline-block;
}

.theme-toggle-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--color-background-secondary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  color: var(--color-text-primary);
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease, transform 0.15s ease;
  font-size: 14px;
  min-height: 36px;
  position: relative;
  overflow: hidden;
}

.theme-toggle-btn:hover {
  background: var(--color-background-tertiary);
  border-color: var(--color-border-secondary);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px var(--color-shadow);
}

.theme-toggle-btn:active {
  transform: translateY(0);
}

.theme-icon-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.theme-icon {
  flex-shrink: 0;
  transition: background-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
}

.theme-icon.rotating {
  animation: rotate 0.6s ease-in-out;
}

@keyframes rotate {
  0% { transform: rotate(0deg) scale(1); }
  50% { transform: rotate(180deg) scale(1.1); }
  100% { transform: rotate(360deg) scale(1); }
}

.theme-label {
  font-weight: 500;
  white-space: nowrap;
  transition: opacity 0.2s ease;
}

.dropdown-arrow {
  transition: transform 0.2s ease;
  opacity: 0.7;
}

.dropdown-arrow.rotated {
  transform: rotate(180deg);
}

/* 下拉菜单样式 */
.theme-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  box-shadow: 0 8px 32px var(--color-shadow);
  z-index: 1000;
  min-width: 280px;
  overflow: hidden;
  backdrop-filter: blur(8px);
}

.dropdown-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: var(--color-background-secondary);
  border-bottom: 1px solid var(--color-border);
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.theme-options {
  padding: 8px;
}

.theme-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease, transform 0.15s ease;
  position: relative;
}

.theme-option:hover:not(.disabled) {
  background: var(--color-background-secondary);
  transform: translateX(2px);
}

.theme-option.active {
  background: var(--color-primary);
  color: white;
}

.theme-option.active:hover {
  background: var(--color-primary-hover);
}

.theme-option.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.theme-preview {
  width: 32px;
  height: 24px;
  border-radius: 6px;
  position: relative;
  overflow: hidden;
  border: 1px solid var(--color-border);
  flex-shrink: 0;
}

.preview-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--preview-bg, var(--color-background));
}

.preview-accent {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--preview-accent, var(--color-primary));
}

.system-preview .system-bg {
  background: linear-gradient(45deg, #ffffff 50%, #1e1e2e 50%);
}

.system-preview .system-accent {
  background: linear-gradient(45deg, #0d6efd 50%, #89b4fa 50%);
}

.theme-info {
  flex: 1;
  min-width: 0;
}

.theme-name {
  font-size: 14px;
  font-weight: 500;
  color: currentColor;
  margin-bottom: 2px;
}

.theme-description {
  font-size: 12px;
  opacity: 0.7;
  color: currentColor;
}

.theme-icon-small {
  flex-shrink: 0;
  opacity: 0.7;
}

.check-icon {
  position: absolute;
  top: 8px;
  right: 8px;
  color: currentColor;
}

.dropdown-divider {
  height: 1px;
  background: var(--color-border);
  margin: 8px 0;
}

.system-option {
  border-top: 1px solid var(--color-border);
  margin-top: 4px;
  padding-top: 12px;
}

.dropdown-footer {
  padding: 8px 16px;
  background: var(--color-background-secondary);
  border-top: 1px solid var(--color-border);
}

.shortcut-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--color-text-tertiary);
}

kbd {
  background: var(--color-border);
  color: var(--color-text-secondary);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-family: monospace;
  border: 1px solid var(--color-border-secondary);
}

/* 主题切换动画遮罩 */
.theme-transition-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--color-overlay);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.transition-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 32px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  box-shadow: 0 16px 64px var(--color-shadow);
}

.transition-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.pulse-icon {
  animation: pulse 1s ease-in-out infinite;
  color: var(--color-primary);
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
}

.transition-text {
  font-size: 14px;
  color: var(--color-text-secondary);
  font-weight: 500;
}

/* 过渡动画 */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: background-color 0.15s ease, color 0.15s ease, transform 0.15s ease;
}

.dropdown-enter-from {
  opacity: 0;
  transform: translateY(-8px) scale(0.95);
}

.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.95);
}

.theme-transition-enter-active,
.theme-transition-leave-active {
  transition: background-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
}

.theme-transition-enter-from,
.theme-transition-leave-to {
  opacity: 0;
}

/* 响应式 */
@media (max-width: 768px) {
  .theme-dropdown {
    right: auto;
    left: 0;
    min-width: 260px;
  }
}

/* 变体样式 */
.advanced-theme-toggle.variant-icon .theme-toggle-btn {
  padding: 8px;
  min-width: 36px;
  justify-content: center;
}

.advanced-theme-toggle.variant-icon .theme-label {
  display: none;
}

.advanced-theme-toggle.variant-compact .theme-toggle-btn {
  padding: 6px 10px;
  min-height: 32px;
  font-size: 13px;
}

/* 无障碍支持 */
.theme-toggle-btn:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.theme-option:focus {
  background: var(--color-background-secondary);
  outline: none;
}

/* 高对比度模式支持 */
@media (prefers-contrast: high) {
  .theme-toggle-btn,
  .theme-dropdown {
    border-width: 2px;
  }
  
  .theme-preview {
    border-width: 2px;
  }
}

/* 减少动画模式支持 */
@media (prefers-reduced-motion: reduce) {
  .theme-toggle-btn,
  .theme-icon,
  .dropdown-arrow,
  .theme-option,
  .pulse-icon {
    transition: none !important;
    animation: none !important;
  }
  
  .theme-icon.rotating {
    animation: none;
  }
}
</style>