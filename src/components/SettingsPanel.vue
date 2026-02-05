/**
 * SnippetsHub - 专业代码片段管理工具
 * 
 * @file SettingsPanel.vue - 应用程序设置面板
 * @author Noah
 * @description 集中管理应用程序的通用、外观、编辑器、快捷键和同步设置
 * @created 2026-02-01
 * @version 1.0.0
 * 
 * 功能特性:
 * - 分类设置管理（通用、主题、编辑器等）
 * - 配置导出与恢复
 * - 快捷键自定义
 * - 数据备份管理
 */
<template>
  <div class="settings-panel">
    <!-- 设置头部 -->
    <div class="settings-header">
      <div class="header-icon">
        <Settings :size="28" />
      </div>
      <div class="header-info">
        <h2>设置</h2>
        <p>自定义您的 SnippetsHub 体验</p>
      </div>
    </div>

    <!-- 设置导航和内容 -->
    <div class="settings-layout">
      <!-- 左侧分类导航 -->
      <div class="settings-nav">
        <button 
          v-for="category in categories" 
          :key="category.id"
          class="nav-item"
          :class="{ active: activeCategory === category.id }"
          @click="activeCategory = category.id"
          :title="category.label"
        >
          <component :is="category.icon" :size="20" />
          <span class="nav-label">{{ category.label }}</span>
          <span class="nav-count" v-if="category.count">{{ category.count }}</span>
          <ChevronRight :size="16" class="nav-arrow" />
        </button>
      </div>

      <!-- 右侧设置内容 -->
      <div class="settings-content">
        <!-- 外观设置 -->
        <div v-if="activeCategory === 'appearance'" class="category-section">
          <div class="section-header">
            <Palette :size="24" />
            <div class="section-info">
              <h3>外观设置</h3>
              <p>自定义应用的视觉风格</p>
            </div>
          </div>
          
          <div class="settings-cards">
            <div class="setting-card">
              <div class="card-header">
                <span class="card-title">主题模式</span>
                <span class="card-badge">推荐</span>
              </div>
              <p class="card-desc">选择您喜欢的主题风格，支持跟随系统</p>
              <div class="card-action">
                <AdvancedThemeToggle :show-dropdown="true" :show-label="true" />
              </div>
            </div>

            <div class="setting-card">
              <div class="card-header">
                <span class="card-title">快速切换</span>
              </div>
              <p class="card-desc">使用 {{ getShortcutKey() }} 快速切换明暗主题</p>
              <div class="card-action">
                <ThemeToggle :size="22" />
              </div>
            </div>
          </div>

          <div class="subsection">
            <h4>主题预览</h4>
            <ThemePreview />
          </div>

          <div class="subsection">
            <h4>主题信息</h4>
            <div class="theme-stats-grid">
              <div class="stat-card mini">
                <Palette :size="20" class="stat-icon" />
                <div class="stat-content">
                  <span class="stat-value">{{ themeStats.totalThemes }}</span>
                  <span class="stat-label">可用主题</span>
                </div>
              </div>
              <div class="stat-card mini">
                <component :is="getCurrentThemeIcon()" :size="20" class="stat-icon" />
                <div class="stat-content">
                  <span class="stat-value">{{ getCurrentThemeLabel() }}</span>
                  <span class="stat-label">当前主题</span>
                </div>
              </div>
              <div class="stat-card mini">
                <Monitor :size="20" class="stat-icon" />
                <div class="stat-content">
                  <span class="stat-value">{{ themeStats.isSystemTheme ? '是' : '否' }}</span>
                  <span class="stat-label">跟随系统</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 编辑器设置 -->
        <div v-if="activeCategory === 'editor'" class="category-section">
          <div class="section-header">
            <Code2 :size="24" />
            <div class="section-info">
              <h3>编辑器设置</h3>
              <p>配置代码编辑器的行为和外观</p>
            </div>
          </div>

          <div class="settings-list">
            <div class="setting-item">
              <div class="item-icon">
                <Type :size="18" />
              </div>
              <div class="item-info">
                <label>字体大小</label>
                <p>调整代码编辑器的字体大小</p>
              </div>
              <div class="item-action">
                <select v-model="settings.fontSize" @change="saveSettings" class="setting-select">
                  <option :value="12">12px</option>
                  <option :value="14">14px（推荐）</option>
                  <option :value="16">16px</option>
                  <option :value="18">18px</option>
                  <option :value="20">20px</option>
                </select>
              </div>
            </div>

            <div class="setting-item">
              <div class="item-icon">
                <Map :size="18" />
              </div>
              <div class="item-info">
                <label>显示小地图</label>
                <p>在编辑器右侧显示代码小地图，方便导航</p>
              </div>
              <div class="item-action">
                <label class="toggle-switch">
                  <input type="checkbox" v-model="settings.showMinimap" @change="saveSettings">
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>

            <div class="setting-item">
              <div class="item-icon">
                <WrapText :size="18" />
              </div>
              <div class="item-info">
                <label>自动换行</label>
                <p>长代码行自动换行显示</p>
              </div>
              <div class="item-action">
                <label class="toggle-switch">
                  <input type="checkbox" v-model="settings.wordWrap" @change="saveSettings">
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>

            <div class="setting-item">
              <div class="item-icon">
                <Indent :size="18" />
              </div>
              <div class="item-info">
                <label>Tab 大小</label>
                <p>设置缩进的空格数量</p>
              </div>
              <div class="item-action">
                <select v-model="settings.tabSize" @change="saveSettings" class="setting-select">
                  <option :value="2">2 空格</option>
                  <option :value="4">4 空格</option>
                  <option :value="8">8 空格</option>
                </select>
              </div>
            </div>

            <div class="setting-item">
              <div class="item-icon">
                <Hash :size="18" />
              </div>
              <div class="item-info">
                <label>显示行号</label>
                <p>在编辑器左侧显示代码行号</p>
              </div>
              <div class="item-action">
                <label class="toggle-switch">
                  <input type="checkbox" v-model="settings.showLineNumbers" @change="saveSettings">
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>

            <div class="setting-item">
              <div class="item-icon">
                <Terminal :size="18" />
              </div>
              <div class="item-info">
                <label>Vim 模式</label>
                <p>启用 Vim 键盘绑定（适合高级用户）</p>
              </div>
              <div class="item-action">
                <label class="toggle-switch">
                  <input type="checkbox" v-model="settings.vimMode" @change="saveSettings">
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- 开发工具设置 -->
        <div v-if="activeCategory === 'devtools'" class="category-section">
          <div class="section-header">
            <Wrench :size="24" />
            <div class="section-info">
              <h3>开发工具</h3>
              <p>管理代码执行和智能补全所需的开发工具</p>
            </div>
          </div>

          <DevelopmentToolsStatus />
        </div>

        <!-- 数据管理 -->
        <div v-if="activeCategory === 'data'" class="category-section">
          <div class="section-header">
            <Database :size="24" />
            <div class="section-info">
              <h3>数据管理</h3>
              <p>管理您的代码片段数据</p>
            </div>
          </div>



          <div class="subsection">
            <h4>导入 / 导出</h4>
            <ImportExportPanel />
          </div>

          <div class="subsection danger-zone">
            <h4>危险操作</h4>
            <div class="warning-card">
              <AlertTriangle :size="20" class="warning-icon" />
              <div class="warning-content">
                <p>以下操作将永久删除您的数据，请谨慎操作</p>
              </div>
            </div>
            <button class="danger-btn" @click="clearAllData" title="永久删除所有数据（不可恢复）">
              <Trash2 :size="18" />
              清除所有数据
            </button>
          </div>
        </div>

        <!-- 云同步 -->
        <div v-if="activeCategory === 'cloud'" class="category-section">
          <div class="section-header">
            <Cloud :size="24" />
            <div class="section-info">
              <h3>云同步</h3>
              <p>将代码片段上传到 GitHub Gist 或 Gitee</p>
            </div>
          </div>

          <CloudSyncPanel />
        </div>

        <!-- 快捷键 -->
        <div v-if="activeCategory === 'shortcuts'" class="category-section">
          <div class="section-header">
            <Keyboard :size="24" />
            <div class="section-info">
              <h3>快捷键</h3>
              <p>查看和自定义键盘快捷键</p>
            </div>
          </div>

          <div class="shortcuts-grid">
            <div class="shortcut-card" v-for="shortcut in shortcuts" :key="shortcut.action">
              <div class="shortcut-keys">
                <kbd v-for="(key, idx) in shortcut.keys" :key="idx">{{ key }}</kbd>
              </div>
              <div class="shortcut-info">
                <span class="shortcut-action">{{ shortcut.action }}</span>
                <span class="shortcut-desc">{{ shortcut.description }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 关于 -->
        <div v-if="activeCategory === 'about'" class="category-section">
          <div class="section-header">
            <Info :size="24" />
            <div class="section-info">
              <h3>关于 SnippetsHub</h3>
              <p>应用信息和版本</p>
            </div>
          </div>

          <div class="about-card">
            <div class="app-logo">
              <Package :size="64" />
            </div>
            <h2 class="app-name">SnippetsHub</h2>
            <p class="app-version">版本 {{ appVersion }}</p>
            <p class="app-desc">代码片段管理工具</p>
            
            <div class="tech-stack">
              <span class="tech-badge">Tauri</span>
              <span class="tech-badge">Vue 3</span>
              <span class="tech-badge">Pinia</span>
              <span class="tech-badge">Monaco Editor</span>
            </div>

            <div class="about-links">
              <a href="#" class="about-link">
                <Github :size="18" />
                GitHub
              </a>
              <a href="#" class="about-link">
                <FileText :size="18" />
                文档
              </a>
              <a href="#" class="about-link">
                <Bug :size="18" />
                反馈
              </a>
            </div>
          </div>

          <div class="subsection">
            <h4>系统信息</h4>
            <div class="system-info-list">
              <div class="info-item">
                <span class="info-label">操作系统</span>
                <span class="info-value">{{ systemInfo.os }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">架构</span>
                <span class="info-value">{{ systemInfo.arch }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Tauri 版本</span>
                <span class="info-value">{{ systemInfo.tauriVersion }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { 
  Settings, Palette, Code2, Database, Keyboard, Info, ChevronRight,
  Monitor, Sun, Moon, Eye, Contrast, Type, Map, WrapText, Indent, Hash,
  Download, Upload, Trash2, AlertTriangle, Package, Github, FileText, Bug, Cloud, Terminal, Wrench
} from 'lucide-vue-next'
import { useThemeStore } from '../stores/themeStore'
import { APP_VERSION } from '../constants'
import AdvancedThemeToggle from './AdvancedThemeToggle.vue'
import ThemeToggle from './ThemeToggle.vue'
import ThemePreview from './ThemePreview.vue'

import ImportExportPanel from './ImportExportPanel.vue'
import CloudSyncPanel from './CloudSyncPanel.vue'
import DevelopmentToolsStatus from './DevelopmentToolsStatus.vue'

import { useAppStore } from '../stores/appStore'

const themeStore = useThemeStore()
const appStore = useAppStore()

const activeCategory = ref('appearance')
const appVersion = APP_VERSION

// 设置分类
const categories = [
  { id: 'appearance', label: '外观', icon: Palette },
  { id: 'editor', label: '编辑器', icon: Code2 },
  { id: 'devtools', label: '开发工具', icon: Wrench },
  { id: 'data', label: '数据管理', icon: Database },
  { id: 'cloud', label: '云同步', icon: Cloud },
  { id: 'shortcuts', label: '快捷键', icon: Keyboard },
  { id: 'about', label: '关于', icon: Info }
]

// 编辑器设置 (Proxy to store)
const settings = computed({
  get: () => appStore.settings,
  set: (val) => appStore.saveSettings(val)
})

const saveSettings = () => {
  appStore.saveSettings(settings.value)
}

// 主题统计
const themeStats = computed(() => ({
  totalThemes: 4,
  isSystemTheme: themeStore.appliedTheme === 'system'
}))

// 快捷键列表
const shortcuts = [
  { action: '新建片段', keys: ['⌘', 'N'], description: '创建新的代码片段' },
  { action: '保存', keys: ['⌘', 'S'], description: '保存当前编辑的内容' },
  { action: '搜索', keys: ['⌘', 'K'], description: '打开全局搜索' },
  { action: '切换主题', keys: ['⌘', 'Shift', 'T'], description: '在明暗主题间切换' },
  { action: '命令面板', keys: ['⌘', 'P'], description: '打开命令面板' },
  { action: '关闭', keys: ['Esc'], description: '关闭当前窗口' }
]

// 系统信息
const systemInfo = ref({
  os: 'macOS',
  arch: 'arm64',
  tauriVersion: '2.0.0'
})

// 获取快捷键显示
const getShortcutKey = () => {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
  return isMac ? '⌘ + Shift + T' : 'Ctrl + Shift + T'
}

// 获取当前主题图标
const getCurrentThemeIcon = () => {
  const icons = { light: Sun, dark: Moon, system: Monitor, dimmed: Eye }
  return icons[themeStore.appliedTheme] || Monitor
}

// 获取当前主题标签
const getCurrentThemeLabel = () => {
  const labels = { light: '浅色', dark: '深色', system: '跟随系统', dimmed: '护眼' }
  return labels[themeStore.appliedTheme] || '未知'
}

// 数据操作
const exportData = () => {
  console.log('Export data')
  // TODO: 实现导出功能
}

const importData = () => {
  console.log('Import data')
  // TODO: 实现导入功能
}

const clearAllData = () => {
  if (confirm('确定要清除所有数据吗？此操作不可撤销！')) {
    console.log('Clear all data')
    // TODO: 实现清除功能
  }
}

onMounted(async () => {
  // 获取系统信息
  try {
    const platform = navigator.platform
    systemInfo.value.os = platform.includes('Mac') ? 'macOS' : 
                          platform.includes('Win') ? 'Windows' : 'Linux'
    systemInfo.value.arch = navigator.userAgent.includes('arm') ? 'arm64' : 'x64'
  } catch (e) {
    console.error('Failed to get system info:', e)
  }
})
</script>

<style scoped>
.settings-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-background);
  overflow: hidden;
}

/* 头部 */
.settings-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-background);
}

.header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  border-radius: 14px;
  color: white;
}

.header-info h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.header-info p {
  margin: 4px 0 0;
  font-size: 14px;
  color: var(--color-text-secondary);
}

/* 布局 */
.settings-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* 左侧导航 */
.settings-nav {
  width: 220px;
  padding: 16px;
  background: var(--color-background-secondary);
  border-right: 1px solid var(--color-border);
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 14px 16px;
  background: transparent;
  border: none;
  border-radius: 10px;
  color: var(--color-text-secondary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
  text-align: left;
}

.nav-item:hover {
  background: var(--color-background-tertiary);
  color: var(--color-text-primary);
}

.nav-item.active {
  background: linear-gradient(135deg, rgba(137, 180, 250, 0.15), rgba(116, 199, 236, 0.1));
  color: var(--color-primary);
}

.nav-label {
  flex: 1;
}

.nav-count {
  padding: 2px 8px;
  background: var(--color-border);
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
}

.nav-arrow {
  opacity: 0;
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.nav-item:hover .nav-arrow,
.nav-item.active .nav-arrow {
  opacity: 1;
}

.nav-item.active .nav-arrow {
  transform: translateX(2px);
}

/* 右侧内容 */
.settings-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.category-section {
  max-width: 800px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--color-border);
  color: var(--color-primary);
}

.section-info h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.section-info p {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--color-text-secondary);
}

/* 设置卡片 */
.settings-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.setting-card {
  padding: 20px;
  background: var(--color-background-secondary);
  border: 1px solid var(--color-border);
  border-radius: 12px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.card-badge {
  padding: 2px 8px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  color: white;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 600;
}

.card-desc {
  margin: 0 0 16px;
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.5;
}

.card-action {
  display: flex;
  justify-content: flex-end;
}

/* 子区块 */
.subsection {
  margin-top: 32px;
}

.subsection h4 {
  margin: 0 0 16px;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* 主题统计网格 */
.theme-stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.stat-card.mini {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--color-background-secondary);
  border: 1px solid var(--color-border);
  border-radius: 10px;
}

.stat-card.mini .stat-icon {
  color: var(--color-primary);
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.stat-label {
  font-size: 11px;
  color: var(--color-text-tertiary);
}

/* 设置列表 */
.settings-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.setting-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: var(--color-background-secondary);
  border: 1px solid var(--color-border);
  border-radius: 10px;
}

.item-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: var(--color-background-tertiary);
  border-radius: 10px;
  color: var(--color-primary);
}

.item-info {
  flex: 1;
}

.item-info label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.item-info p {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.item-action {
  display: flex;
  align-items: center;
}

.setting-select {
  padding: 8px 32px 8px 12px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 13px;
  color: var(--color-text-primary);
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236c7086' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
}

/* Toggle Switch */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 26px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--color-border);
  border-radius: 26px;
  transition: background-color 0.2s ease;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  border-radius: 50%;
  transition: transform 0.2s ease;
}

.toggle-switch input:checked + .toggle-slider {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
}

.toggle-switch input:checked + .toggle-slider:before {
  transform: translateX(22px);
}

/* 操作卡片 */
.action-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.action-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px;
  background: var(--color-background-secondary);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
  color: var(--color-primary);
}

.action-card:hover {
  background: var(--color-background-tertiary);
  border-color: var(--color-primary);
  transform: translateY(-2px);
}

.action-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.action-desc {
  font-size: 12px;
  color: var(--color-text-secondary);
  text-align: center;
}

/* 危险区域 */
.danger-zone {
  margin-top: 48px;
  padding-top: 24px;
  border-top: 1px solid var(--color-error);
}

.danger-zone h4 {
  color: var(--color-error);
}

.warning-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgba(243, 139, 168, 0.1);
  border: 1px solid rgba(243, 139, 168, 0.3);
  border-radius: 10px;
  margin-bottom: 16px;
}

.warning-icon {
  color: var(--color-error);
}

.warning-content p {
  margin: 0;
  font-size: 13px;
  color: var(--color-error);
}

.danger-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: var(--color-error);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.danger-btn:hover {
  opacity: 0.9;
}

/* 快捷键网格 */
.shortcuts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px;
}

.shortcut-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: var(--color-background-secondary);
  border: 1px solid var(--color-border);
  border-radius: 10px;
}

.shortcut-keys {
  display: flex;
  gap: 4px;
}

.shortcut-keys kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  padding: 4px 8px;
  background: var(--color-background-tertiary);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-primary);
}

.shortcut-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.shortcut-action {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.shortcut-desc {
  font-size: 12px;
  color: var(--color-text-secondary);
}

/* 关于卡片 */
.about-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
  background: linear-gradient(135deg, var(--color-background-secondary), var(--color-background-tertiary));
  border: 1px solid var(--color-border);
  border-radius: 16px;
  text-align: center;
}

.app-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 100px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  border-radius: 24px;
  color: white;
  margin-bottom: 20px;
}

.app-name {
  margin: 0;
  font-size: 28px;
  font-weight: 800;
  color: var(--color-text-primary);
}

.app-version {
  margin: 4px 0 12px;
  font-size: 14px;
  color: var(--color-text-secondary);
}

.app-desc {
  margin: 0 0 20px;
  font-size: 14px;
  color: var(--color-text-secondary);
}

.tech-stack {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  flex-wrap: wrap;
  justify-content: center;
}

.tech-badge {
  padding: 6px 12px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.about-links {
  display: flex;
  gap: 16px;
}

.about-link {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  color: var(--color-text-secondary);
  text-decoration: none;
  font-size: 13px;
  transition: border-color 0.15s ease, color 0.15s ease;
}

.about-link:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

/* 系统信息 */
.system-info-list {
  background: var(--color-background-secondary);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  overflow: hidden;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid var(--color-border);
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.info-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
}

/* 滚动条 */
.settings-nav::-webkit-scrollbar,
.settings-content::-webkit-scrollbar {
  width: 6px;
}

.settings-nav::-webkit-scrollbar-track,
.settings-content::-webkit-scrollbar-track {
  background: transparent;
}

.settings-nav::-webkit-scrollbar-thumb,
.settings-content::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 3px;
}

.settings-nav::-webkit-scrollbar-thumb:hover,
.settings-content::-webkit-scrollbar-thumb:hover {
  background: var(--color-border-secondary);
}
</style>
