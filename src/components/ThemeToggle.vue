/**
 * SnippetsHub - 专业代码片段管理工具
 * 
 * @file ThemeToggle.vue - 主题切换组件
 * @author Noah
 * @description 简洁的主题切换按钮组件，支持多种主题模式
 * @created 2026-01-28
 * @modified 2026-01-29
 * @version 1.0.0
 * 
 * 功能特性:
 * - 快速主题切换
 * - 系统主题检测
 * - 动画过渡效果
 * - 可配置显示样式
 * - 键盘快捷键支持
 * - 状态持久化
 */

<template>
  <div class="theme-toggle">
    <button
      @click="toggleTheme"
      class="theme-toggle-btn"
      :title="getToggleTitle()"
      :aria-label="getToggleTitle()"
    >
      <component
        :is="getThemeIcon()"
        :size="size"
        class="theme-icon"
      />
      <span v-if="showLabel" class="theme-label">
        {{ getThemeLabel() }}
      </span>
    </button>
    
    <!-- 主题选择下拉菜单 -->
    <div v-if="showDropdown && isDropdownOpen" class="theme-dropdown">
      <div
        v-for="theme in availableThemes"
        :key="theme"
        @click="selectTheme(theme)"
        class="theme-option"
        :class="{ active: isThemeActive(theme) }"
      >
        <component :is="getThemeIconByType(theme)" :size="16" />
        <span>{{ getThemeLabelByType(theme) }}</span>
        <Check v-if="isThemeActive(theme)" :size="14" class="check-icon" />
      </div>
      
      <div class="theme-divider"></div>
      
      <div
        @click="toggleFollowSystem"
        class="theme-option"
        :class="{ active: themeStore.followSystemTheme }"
      >
        <Monitor :size="16" />
        <span>跟随系统</span>
        <Check v-if="themeStore.followSystemTheme" :size="14" class="check-icon" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Sun, Moon, Monitor, Palette, Check } from 'lucide-vue-next'
import { useThemeStore } from '../stores/themeStore'
import { THEMES, THEME_LABELS } from '../constants'

const props = defineProps({
  size: {
    type: Number,
    default: 18
  },
  showLabel: {
    type: Boolean,
    default: false
  },
  showDropdown: {
    type: Boolean,
    default: false
  },
  variant: {
    type: String,
    default: 'button', // 'button' | 'icon'
    validator: (value) => ['button', 'icon'].includes(value)
  }
})

const themeStore = useThemeStore()
const isDropdownOpen = ref(false)

// 可用主题
const availableThemes = computed(() => [THEMES.LIGHT, THEMES.DARK])

// 获取当前主题图标
const getThemeIcon = () => {
  if (themeStore.followSystemTheme) {
    return Monitor
  }
  return themeStore.appliedTheme === THEMES.DARK ? Moon : Sun
}

// 根据主题类型获取图标
const getThemeIconByType = (theme) => {
  switch (theme) {
    case THEMES.LIGHT:
      return Sun
    case THEMES.DARK:
      return Moon
    case THEMES.AUTO:
      return Monitor
    default:
      return Palette
  }
}

// 获取主题标签
const getThemeLabel = () => {
  if (themeStore.followSystemTheme) {
    return '跟随系统'
  }
  return THEME_LABELS[themeStore.appliedTheme] || '未知主题'
}

// 根据主题类型获取标签
const getThemeLabelByType = (theme) => {
  return THEME_LABELS[theme] || '未知主题'
}

// 获取切换按钮标题
const getToggleTitle = () => {
  const currentLabel = getThemeLabel()
  return `当前主题: ${currentLabel}，点击切换`
}

// 切换主题
const toggleTheme = () => {
  if (props.showDropdown) {
    isDropdownOpen.value = !isDropdownOpen.value
  } else {
    themeStore.toggleTheme()
  }
}

// 选择主题
const selectTheme = (theme) => {
  themeStore.setTheme(theme)
  isDropdownOpen.value = false
}

// 切换跟随系统
const toggleFollowSystem = () => {
  themeStore.setFollowSystemTheme(!themeStore.followSystemTheme)
  isDropdownOpen.value = false
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
  if (!event.target.closest('.theme-toggle')) {
    isDropdownOpen.value = false
  }
}

onMounted(() => {
  if (props.showDropdown) {
    document.addEventListener('click', handleClickOutside)
  }
})

onUnmounted(() => {
  if (props.showDropdown) {
    document.removeEventListener('click', handleClickOutside)
  }
})
</script>

<style scoped>
.theme-toggle {
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
}

.theme-toggle-btn:hover {
  background: var(--color-background-tertiary);
  border-color: var(--color-border-secondary);
}

.theme-toggle-btn:active {
  transform: translateY(1px);
}

.theme-icon {
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.theme-toggle-btn:hover .theme-icon {
  transform: rotate(15deg);
}

.theme-label {
  font-weight: 500;
  white-space: nowrap;
}

/* 下拉菜单样式 */
.theme-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: var(--color-shadow) 0px 4px 12px;
  z-index: 1000;
  min-width: 160px;
  overflow: hidden;
}

.theme-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.2s ease;
  font-size: 14px;
  color: var(--color-text-primary);
}

.theme-option:hover {
  background: var(--color-background-secondary);
}

.theme-option.active {
  background: var(--color-primary);
  color: white;
}

.theme-option.active:hover {
  background: var(--color-primary-hover);
}

.check-icon {
  margin-left: auto;
  color: currentColor;
}

.theme-divider {
  height: 1px;
  background: var(--color-border);
  margin: 4px 0;
}

/* 图标变体样式 */
.theme-toggle.variant-icon .theme-toggle-btn {
  padding: 8px;
  min-width: 36px;
  justify-content: center;
}

.theme-toggle.variant-icon .theme-label {
  display: none;
}

/* 响应式 */
@media (max-width: 768px) {
  .theme-dropdown {
    right: auto;
    left: 0;
  }
}

/* 深色主题特定样式 */
.theme-dark .theme-dropdown {
  background: var(--color-background-secondary);
  border-color: var(--color-border-secondary);
}

/* 明色主题特定样式 */
.theme-light .theme-dropdown {
  background: var(--color-background);
  border-color: var(--color-border);
  box-shadow: rgba(0, 0, 0, 0.1) 0px 4px 12px;
}

/* 动画效果 */
.theme-dropdown {
  animation: slideDown 0.2s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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
  .theme-toggle-btn {
    border-width: 2px;
  }
  
  .theme-dropdown {
    border-width: 2px;
  }
}

/* 减少动画模式支持 */
@media (prefers-reduced-motion: reduce) {
  .theme-toggle-btn,
  .theme-icon,
  .theme-option,
  .theme-dropdown {
    transition: none;
  }
  
  .theme-dropdown {
    animation: none;
  }
  
  .theme-toggle-btn:hover .theme-icon {
    transform: none;
  }
}
</style>