/**
 * SnippetsHub - 代码片段管理工具
 * 
 * @file Sidebar.vue - 侧边栏导航组件
 * @author Noah
 * @description 应用程序的主导航侧边栏，支持折叠和主题切换
 * @created 2026-01-15
 * @modified 2026-01-29
 * @version 1.0.0
 * 
 * 功能特性:
 * - 可折叠的侧边栏设计
 * - 多级导航菜单
 * - 快速操作按钮
 * - 主题切换集成
 * - 状态指示器
 * - 快捷键提示
 * - 响应式布局
 * - 动画过渡效果
 */

<template>
  <div class="sidebar" :class="{ collapsed: isCollapsed }">
    <!-- 侧边栏头部 -->
    <div class="sidebar-header">
      <!-- 展开状态的 Logo -->
      <div v-if="!isCollapsed" class="logo" @click="toggleCollapse">
        <div class="logo-container">
          <Package class="logo-icon" :size="24" />
          <div class="logo-glow"></div>
        </div>
        <Transition name="fade">
          <span class="logo-text">SnippetsHub</span>
        </Transition>
      </div>
      
      <!-- 折叠状态下的 Logo -->
      <div v-else class="logo-collapsed" @click="toggleCollapse">
        <Package class="logo-icon" :size="20" />
        <div class="logo-glow"></div>
      </div>
      
      <!-- 展开/收起按钮 -->
      <button 
        @click="toggleCollapse" 
        class="collapse-btn" 
        :class="{ 'expand-btn': isCollapsed }"
        :title="isCollapsed ? '展开侧边栏' : '收起侧边栏'"
      >
        <PanelLeftOpen v-if="isCollapsed" :size="16" />
        <PanelLeftClose v-else :size="16" />
      </button>
    </div>

    <!-- 快速操作 -->
    <div v-if="!isCollapsed" class="quick-actions">
      <button v-if="currentView !== 'code'" @click="$emit('quick-action', 'new-snippet')" class="quick-btn" title="新建代码片段">
        <Plus :size="16" />
        <span>新建片段</span>
      </button>
      <button @click="$emit('quick-action', 'command-palette')" class="quick-btn" title="命令面板">
        <Search :size="16" />
        <span>搜索</span>
      </button>
    </div>
    
    <!-- 折叠状态下的快速操作 -->
    <div v-else class="quick-actions-collapsed">
      <button v-if="currentView !== 'code'" @click="$emit('quick-action', 'new-snippet')" class="quick-btn-collapsed" title="新建代码片段">
        <Plus :size="16" />
      </button>
      <button @click="$emit('quick-action', 'command-palette')" class="quick-btn-collapsed" title="命令面板">
        <Search :size="16" />
      </button>
    </div>

    <!-- 导航菜单 -->
    <nav class="sidebar-nav">
      <div class="nav-section">
        <div v-if="!isCollapsed" class="section-title">主要功能</div>
        
        <div 
          class="nav-item" 
          :class="{ active: currentView === 'code' }" 
          @click="$emit('navigate', 'code')"
          :title="isCollapsed ? '代码管理' : ''"
        >
          <div class="nav-icon-container">
            <Code class="nav-icon" :size="18" />
            <div class="nav-indicator"></div>
          </div>
          <Transition name="fade">
            <span v-if="!isCollapsed" class="nav-text">代码管理</span>
          </Transition>
          <Transition name="fade">
            <div v-if="!isCollapsed && snippetCount > 0" class="nav-badge">{{ snippetCount }}</div>
          </Transition>
        </div>
        
        <div 
          class="nav-item" 
          :class="{ active: currentView === 'todo' }" 
          @click="$emit('navigate', 'todo')"
          :title="isCollapsed ? 'TODO List' : ''"
        >
          <div class="nav-icon-container">
            <CheckSquare class="nav-icon" :size="18" />
            <div class="nav-indicator"></div>
          </div>
          <Transition name="fade">
            <span v-if="!isCollapsed" class="nav-text">TODO List</span>
          </Transition>
          <Transition name="fade">
            <div v-if="!isCollapsed && todoCount > 0" class="nav-badge todo">{{ todoCount }}</div>
          </Transition>
        </div>
        
        <div 
          class="nav-item" 
          :class="{ active: currentView === 'favorites' }" 
          @click="$emit('navigate', 'favorites')"
          :title="isCollapsed ? '我的收藏' : ''"
        >
          <div class="nav-icon-container">
            <Star class="nav-icon" :size="18" />
            <div class="nav-indicator"></div>
          </div>
          <Transition name="fade">
            <span v-if="!isCollapsed" class="nav-text">我的收藏</span>
          </Transition>
          <Transition name="fade">
            <div v-if="!isCollapsed && favoriteCount > 0" class="nav-badge favorite">{{ favoriteCount }}</div>
          </Transition>
        </div>
        
        <div 
          class="nav-item" 
          :class="{ active: currentView === 'markdown' }" 
          @click="$emit('navigate', 'markdown')"
          :title="isCollapsed ? 'Markdown 编辑器' : ''"
        >
          <div class="nav-icon-container">
            <FileText class="nav-icon" :size="18" />
            <div class="nav-indicator"></div>
          </div>
          <Transition name="fade">
            <span v-if="!isCollapsed" class="nav-text">Markdown</span>
          </Transition>
          <Transition name="fade">
            <div v-if="!isCollapsed && hasUnsavedMarkdown" class="nav-status unsaved">
              <Circle :size="6" />
            </div>
          </Transition>
        </div>
      </div>

      <div class="nav-divider"></div>

      <div class="nav-section">
        <div v-if="!isCollapsed" class="section-title">系统</div>
        
        <div 
          class="nav-item" 
          :class="{ active: currentView === 'settings' }" 
          @click="$emit('navigate', 'settings')"
          :title="isCollapsed ? '设置' : ''"
        >
          <div class="nav-icon-container">
            <Settings class="nav-icon" :size="18" />
            <div class="nav-indicator"></div>
          </div>
          <Transition name="fade">
            <span v-if="!isCollapsed" class="nav-text">设置</span>
          </Transition>
        </div>

        <div 
          class="nav-item" 
          :class="{ active: currentView === 'about' }" 
          @click="$emit('navigate', 'about')"
          :title="isCollapsed ? '关于' : ''"
        >
          <div class="nav-icon-container">
            <Info class="nav-icon" :size="18" />
            <div class="nav-indicator"></div>
          </div>
          <Transition name="fade">
            <span v-if="!isCollapsed" class="nav-text">关于</span>
          </Transition>
        </div>
      </div>
    </nav>

    <!-- 主题切换 -->
    <div class="theme-section">
      <div v-if="!isCollapsed" class="section-title">主题</div>
      <div class="theme-toggle-container">
        <ThemeToggle :size="18" :show-label="!isCollapsed" />
      </div>
    </div>

    <!-- 侧边栏底部 -->
    <div class="sidebar-footer">
      <Transition name="fade">
        <div v-if="!isCollapsed" class="footer-content">
          <div class="version">
            <Zap :size="12" />
            v{{ appVersion }}
          </div>
          <div class="status">
            <div class="status-dot" :class="connectionStatus"></div>
            <span>{{ connectionStatus === 'online' ? '已连接' : '离线' }}</span>
          </div>
        </div>
      </Transition>
      
      <!-- 收起状态下的简化信息 -->
      <div v-if="isCollapsed" class="footer-collapsed">
        <div class="status-dot" :class="connectionStatus" title="连接状态"></div>
      </div>
    </div>

    <!-- 快捷键提示 -->
    <div v-if="showShortcuts && !isCollapsed" class="shortcuts-overlay">
      <div class="shortcuts-content">
        <h4>快捷键</h4>
        <div class="shortcut-item">
          <kbd>⌘</kbd><kbd>1</kbd>
          <span>代码管理</span>
        </div>
        <div class="shortcut-item">
          <kbd>⌘</kbd><kbd>2</kbd>
          <span>TODO List</span>
        </div>
        <div class="shortcut-item">
          <kbd>⌘</kbd><kbd>3</kbd>
          <span>Markdown</span>
        </div>
        <div class="shortcut-item">
          <kbd>⌘</kbd><kbd>K</kbd>
          <span>命令面板</span>
        </div>
        <button @click="showShortcuts = false" class="close-shortcuts">
          <X :size="14" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { 
  Package, Code, CheckSquare, FileText, Settings, Info, 
  Plus, Search, PanelLeftClose, PanelLeftOpen, Circle, Zap, X, Star
} from 'lucide-vue-next'
import ThemeToggle from './ThemeToggle.vue'
import { useSnippetStore } from '../stores/snippetStore'
import { useTodoStore } from '../stores/todoStore'
import { useMarkdownStore } from '../stores/markdownStore'
import { APP_VERSION } from '../constants'

const props = defineProps({
  currentView: String
})

const emit = defineEmits(['navigate', 'quick-action'])

const snippetStore = useSnippetStore()
const todoStore = useTodoStore()
const markdownStore = useMarkdownStore()

const isCollapsed = ref(false)
const showShortcuts = ref(false)
const connectionStatus = ref('online')
const appVersion = APP_VERSION

// 计算属性
const snippetCount = computed(() => snippetStore.snippets?.length || 0)
const todoCount = computed(() => todoStore.incompleteTodos?.length || 0)
const favoriteCount = computed(() => snippetStore.snippets?.filter(s => s.isFavorite)?.length || 0)
const hasUnsavedMarkdown = computed(() => markdownStore.hasUnsavedChanges)

// 方法
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
  // 保存状态到 localStorage
  localStorage.setItem('sidebar-collapsed', isCollapsed.value.toString())
}

const checkConnection = () => {
  connectionStatus.value = navigator.onLine ? 'online' : 'offline'
}

// 生命周期
onMounted(() => {
  // 恢复侧边栏状态
  const saved = localStorage.getItem('sidebar-collapsed')
  if (saved) {
    isCollapsed.value = saved === 'true'
  }
  
  // 监听网络状态
  window.addEventListener('online', checkConnection)
  window.addEventListener('offline', checkConnection)
  checkConnection()
  
  // 监听快捷键
  document.addEventListener('keydown', handleKeydown)
})

const handleKeydown = (event) => {
  // Ctrl/Cmd + Shift + S 显示快捷键
  if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'S') {
    event.preventDefault()
    showShortcuts.value = !showShortcuts.value
  }
  
  // Ctrl/Cmd + B 切换侧边栏
  if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
    event.preventDefault()
    toggleCollapse()
  }
}
</script>

<style scoped>
.sidebar {
  width: 280px;
  background: linear-gradient(180deg, 
    var(--color-background-secondary) 0%, 
    var(--color-background-tertiary) 100%
  );
  color: var(--color-text-primary);
  display: flex;
  flex-direction: column;
  height: 100vh;
  border-right: 1px solid var(--color-border);
  position: relative;
  transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.sidebar.collapsed {
  width: 72px;
}

/* 装饰性渐变边框 */
.sidebar::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 1px;
  height: 100%;
  background: linear-gradient(180deg, 
    transparent 0%, 
    rgba(137, 180, 250, 0.4) 30%,
    rgba(116, 199, 236, 0.3) 70%,
    transparent 100%
  );
  opacity: 0.6;
  pointer-events: none;
}

/* 顶部装饰光效 */
.sidebar::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 120px;
  background: radial-gradient(
    ellipse 80% 50% at 50% 0%,
    rgba(137, 180, 250, 0.08) 0%,
    transparent 100%
  );
  pointer-events: none;
}

/* 侧边栏头部 */
.sidebar-header {
  padding: 24px 20px;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  min-height: 72px; /* 确保固定高度 */
}

.sidebar.collapsed .sidebar-header {
  padding: 24px 16px;
  justify-content: center;
  flex-direction: column;
  gap: 12px;
}

.sidebar-header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 20px;
  right: 20px;
  height: 1px;
  background: linear-gradient(90deg, 
    transparent, 
    var(--color-primary) 50%, 
    transparent
  );
  opacity: 0.3;
}

.sidebar.collapsed .sidebar-header::after {
  left: 16px;
  right: 16px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 20px;
  font-weight: 700;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
}

.logo:hover {
  transform: scale(1.05);
}

.logo-collapsed {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(var(--color-primary), 0.1);
}

.logo-collapsed:hover {
  transform: scale(1.1);
  background: rgba(var(--color-primary), 0.2);
}

.logo-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-icon {
  color: var(--color-primary);
  filter: drop-shadow(0 0 12px rgba(var(--color-primary), 0.4));
  z-index: 2;
  position: relative;
}

.logo-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 32px;
  height: 32px;
  background: radial-gradient(circle, 
    rgba(var(--color-primary), 0.2) 0%, 
    transparent 70%
  );
  border-radius: 50%;
  animation: glow 3s ease-in-out infinite alternate;
}

@keyframes glow {
  0% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
  100% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.8; }
}

.logo-text {
  background: linear-gradient(135deg, 
    var(--color-primary) 0%, 
    var(--color-primary-hover) 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 800;
  letter-spacing: -0.5px;
}

.collapse-btn {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 8px;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease, transform 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
}

.collapse-btn:hover {
  background: var(--color-border);
  color: var(--color-text-primary);
  transform: scale(1.1);
}

.sidebar.collapsed .collapse-btn {
  position: static;
  margin: 0;
}

/* 快速操作 */
.quick-actions {
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  gap: 8px;
}

.quick-actions-collapsed {
  padding: 16px;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
}

.sidebar.collapsed .quick-actions {
  display: none;
}

.sidebar.collapsed .quick-actions-collapsed {
  display: flex;
}

.quick-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 12px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease, transform 0.15s ease;
}

.quick-btn:hover {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(var(--color-primary), 0.3);
}

.quick-btn-collapsed {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease, transform 0.15s ease;
}

.quick-btn-collapsed:hover {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(var(--color-primary), 0.3);
}

/* 导航菜单 */
.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 16px 12px;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.sidebar-nav::-webkit-scrollbar {
  display: none;
}

.nav-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 11px;
  font-weight: 700;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 12px;
  padding: 0 16px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  margin: 4px 0;
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease;
  position: relative;
  border: 1px solid transparent;
}

.nav-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, 
    rgba(var(--color-primary), 0.05) 0%, 
    rgba(var(--color-primary), 0.02) 100%
  );
  border-radius: 12px;
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: -1;
}

.nav-item:hover::before {
  opacity: 1;
}

.nav-item:hover {
  background: var(--color-background);
  border-color: rgba(var(--color-primary), 0.2);
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(var(--color-primary), 0.1);
}

.nav-item.active {
  background: transparent;
  color: var(--color-primary);
  transform: translateX(6px);
  border-color: var(--color-primary);
  box-shadow: 
    0 8px 25px rgba(0, 0, 0, 0.1),
    0 3px 10px rgba(0, 0, 0, 0.1);
}

.nav-item.active::before {
  opacity: 0.1;
  background: var(--color-primary);
}

.nav-icon-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.nav-icon {
  transition: background-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
}

.nav-item:hover .nav-icon {
  transform: scale(1.1);
}

.nav-item.active .nav-icon {
  filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.5));
}

.nav-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 24px;
  height: 24px;
  background: radial-gradient(circle, 
    rgba(var(--color-primary), 0.2) 0%, 
    transparent 70%
  );
  border-radius: 50%;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.nav-item.active .nav-indicator {
  opacity: 1;
  background: radial-gradient(circle, 
    var(--color-primary) 0%, 
    transparent 70%
  );
}

.nav-text {
  flex: 1;
  font-weight: 500;
  font-size: 14px;
}

.nav-badge {
  background: var(--color-warning);
  color: var(--color-background);
  font-size: 11px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
  line-height: 1.2;
}

.nav-badge.todo {
  background: var(--color-success);
}

.nav-badge.favorite {
  background: var(--color-warning);
  color: var(--color-background);
}

.nav-item.active .nav-badge {
  background: rgba(255, 255, 255, 0.9);
  color: var(--color-primary);
}

.nav-status {
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-status.unsaved {
  color: var(--color-warning);
  animation: pulse 2s infinite;
}

.nav-divider {
  height: 1px;
  background: linear-gradient(90deg, 
    transparent, 
    var(--color-border) 50%, 
    transparent
  );
  margin: 16px 8px;
}

/* 主题切换区域 */
.theme-section {
  padding: 16px 20px;
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
}

.sidebar.collapsed .theme-section {
  padding: 16px;
  display: flex;
  justify-content: center;
}

.sidebar.collapsed .section-title {
  display: none;
}

.theme-toggle-container {
  display: flex;
  justify-content: center;
}

/* 侧边栏底部 */
.sidebar-footer {
  padding: 16px 20px;
  background: var(--color-background-tertiary);
  border-top: 1px solid var(--color-border);
}

.sidebar.collapsed .sidebar-footer {
  padding: 16px;
  display: flex;
  justify-content: center;
}

.footer-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sidebar.collapsed .footer-content {
  display: none;
}

.version {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--color-text-tertiary);
  font-weight: 600;
}

.status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--color-text-tertiary);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  transition: background-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
}

.status-dot.online {
  background: var(--color-success);
  box-shadow: 0 0 8px rgba(var(--color-success), 0.5);
}

.status-dot.offline {
  background: var(--color-error);
  box-shadow: 0 0 8px rgba(var(--color-error), 0.5);
}

.footer-collapsed {
  display: none;
}

.sidebar.collapsed .footer-collapsed {
  display: flex;
  justify-content: center;
}

/* 快捷键提示 */
.shortcuts-overlay {
  position: absolute;
  top: 0;
  left: 100%;
  width: 240px;
  height: 100%;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-left: none;
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.1);
  z-index: 100;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(-20px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.shortcuts-content {
  padding: 24px;
  height: 100%;
  overflow-y: auto;
}

.shortcuts-content h4 {
  margin: 0 0 20px 0;
  color: var(--color-text-primary);
  font-size: 16px;
  font-weight: 600;
}

.shortcut-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid var(--color-border);
}

.shortcut-item:last-child {
  border-bottom: none;
}

.shortcut-item span {
  color: var(--color-text-secondary);
  font-size: 13px;
}

kbd {
  background: var(--color-border);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 11px;
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-secondary);
  margin-right: 2px;
}

.close-shortcuts {
  position: absolute;
  top: 20px;
  right: 20px;
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.15s ease, color 0.15s ease, transform 0.15s ease;
}

.close-shortcuts:hover {
  background: var(--color-border);
  color: var(--color-text-primary);
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: background-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

/* 收起状态样式 */
.sidebar.collapsed .nav-item {
  justify-content: center;
  padding: 12px;
}

.sidebar.collapsed .quick-actions {
  flex-direction: column;
  padding: 12px;
}

.sidebar.collapsed .quick-btn {
  padding: 10px;
}

.sidebar.collapsed .theme-section {
  padding: 16px 12px;
  display: flex;
  justify-content: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sidebar {
    width: 100%;
    position: fixed;
    top: 0;
    left: 0;
    z-index: 1000;
    transform: translateX(-100%);
  }
  
  .sidebar.open {
    transform: translateX(0);
  }
  
  .sidebar.collapsed {
    width: 100%;
    transform: translateX(-100%);
  }
}

/* 暗色主题优化 */
.theme-dark .sidebar {
  background: linear-gradient(180deg, 
    var(--color-background-secondary) 0%, 
    var(--color-background-tertiary) 100%
  );
}

.theme-dark .logo-glow {
  background: radial-gradient(circle, 
    rgba(var(--color-primary), 0.3) 0%, 
    transparent 70%
  );
}

/* 高对比度模式 */
@media (prefers-contrast: high) {
  .nav-item {
    border-width: 2px;
  }
  
  .nav-item.active {
    outline: 2px solid var(--color-primary);
  }
}

/* 减少动画模式 */
@media (prefers-reduced-motion: reduce) {
  .sidebar,
  .nav-item,
  .logo,
  .quick-btn,
  .collapse-btn,
  .expand-btn {
    transition: none;
  }
  
  .logo-glow {
    animation: none;
  }
  
  .nav-status.unsaved {
    animation: none;
  }
}
</style>
