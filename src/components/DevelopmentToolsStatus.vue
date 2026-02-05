/**
 * SnippetsHub - 专业代码片段管理工具
 * 
 * @file DevelopmentToolsStatus.vue - 开发工具状态指示器
 * @author Noah
 * @description 显示可用的开发工具和语言支持状态
 * @created 2026-01-30
 * @version 1.0.0
 * 
 * 功能特性:
 * - 实时显示可用的开发工具
 * - 语言支持状态指示
 * - 安装指南链接
 * - 工具版本信息
 */

<template>
  <div class="dev-tools-status">
    <div class="status-header">
      <div class="status-title">
        <Wrench :size="16" />
        <span>开发工具状态</span>
      </div>
      <button @click="refreshStatus" class="refresh-btn" :disabled="isRefreshing">
        <RotateCcw :size="14" :class="{ 'spinning': isRefreshing }" />
      </button>
    </div>

    <div class="status-summary">
      <div class="summary-item">
        <div class="summary-value">{{ availableCount }}</div>
        <div class="summary-label">可用工具</div>
      </div>
      <div class="summary-item">
        <div class="summary-value">{{ totalCount }}</div>
        <div class="summary-label">总计</div>
      </div>
      <div class="summary-item">
        <div class="summary-value">{{ Math.round((availableCount / totalCount) * 100) }}%</div>
        <div class="summary-label">覆盖率</div>
      </div>
    </div>

    <div class="tools-grid">
      <!-- 代码执行工具 -->
      <div class="tool-category">
        <h4>代码执行</h4>
        <div class="tool-list">
          <div 
            v-for="(executor, language) in codeExecutors" 
            :key="language"
            class="tool-item"
            :class="{ 'available': executor.available }"
          >
            <div class="tool-icon">
              <component :is="executor.available ? CheckCircle : XCircle" :size="16" />
            </div>
            <div class="tool-info">
              <div class="tool-name">{{ executor.name }}</div>
              <div class="tool-version" v-if="executor.available && executor.version">
                {{ executor.version.split('\n')[0].substring(0, 30) }}
              </div>
              <div class="tool-command" v-else>{{ executor.command }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- LSP 服务器 -->
      <div class="tool-category">
        <h4>智能补全 (LSP)</h4>
        <div class="tool-list">
          <div 
            v-for="(server, language) in lspServers" 
            :key="language"
            class="tool-item"
            :class="{ 'available': server.available }"
          >
            <div class="tool-icon">
              <component :is="server.available ? CheckCircle : XCircle" :size="16" />
            </div>
            <div class="tool-info">
              <div class="tool-name">{{ server.name }}</div>
              <div class="tool-command">{{ server.command }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="status-actions">
      <button @click="showInstallGuide" class="action-btn primary">
        <BookOpen :size="14" />
        <span>安装指南</span>
      </button>
      <button @click="openTerminal" class="action-btn">
        <Terminal :size="14" />
        <span>打开终端</span>
      </button>
    </div>

    <!-- 安装指南模态框 -->
    <div v-if="showGuide" class="guide-modal" @click="showGuide = false">
      <div class="guide-content" @click.stop>
        <div class="guide-header">
          <h3>开发工具安装指南</h3>
          <button @click="showGuide = false" class="close-btn">
            <X :size="20" />
          </button>
        </div>
        <div class="guide-body">
          <div class="install-section">
            <h4>🚀 快速安装（推荐）</h4>
            <div class="install-commands">
              <div class="command-group">
                <h5>macOS</h5>
                <pre><code>brew install node python git go rust</code></pre>
              </div>
              <div class="command-group">
                <h5>Windows</h5>
                <pre><code>choco install nodejs python git golang rust</code></pre>
              </div>
              <div class="command-group">
                <h5>Linux</h5>
                <pre><code>sudo apt install nodejs python3 git golang-go rustc</code></pre>
              </div>
            </div>
          </div>
          
          <div class="install-section">
            <h4>📚 语言服务器</h4>
            <div class="lsp-commands">
              <pre><code># TypeScript/JavaScript
npm install -g typescript-language-server

# Python
pip install python-lsp-server

# Rust (自动包含)
rustup component add rust-analyzer</code></pre>
            </div>
          </div>
        </div>
        <div class="guide-footer">
          <button @click="openFullGuide" class="action-btn primary">
            <ExternalLink :size="14" />
            <span>查看完整指南</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { 
  Wrench, RotateCcw, CheckCircle, XCircle, BookOpen, 
  Terminal, X, ExternalLink 
} from 'lucide-vue-next'
import { codeExecutionService } from '../services/codeExecutionService'
import { lspService } from '../services/lspService'
import { useNotifications } from '../composables/useNotifications'

const { error: notifyError } = useNotifications()

const isRefreshing = ref(false)
const showGuide = ref(false)
const codeExecutors = ref({})
const lspServers = ref({})

const availableCount = computed(() => {
  const execCount = Object.values(codeExecutors.value).filter(e => e.available).length
  const lspCount = Object.values(lspServers.value).filter(s => s.available).length
  return execCount + lspCount
})

const totalCount = computed(() => {
  return Object.keys(codeExecutors.value).length + Object.keys(lspServers.value).length
})

onMounted(async () => {
  await loadStatus()
})

const loadStatus = async () => {
  try {
    // 获取代码执行器状态
    const executors = codeExecutionService.executors
    codeExecutors.value = Object.fromEntries(executors.entries())
    
    // 获取LSP服务器状态
    const servers = lspService.servers
    const serverConfigs = lspService.serverConfigs
    
    lspServers.value = Object.fromEntries(
      Object.entries(serverConfigs).map(([lang, config]) => [
        lang,
        {
          ...config,
          available: servers.has(lang)
        }
      ])
    )
  } catch (error) {
    console.error('Failed to load development tools status:', error)
  }
}

const refreshStatus = async () => {
  isRefreshing.value = true
  try {
    // 重新检测工具
    await codeExecutionService.detectAvailableRuntimes()
    await lspService.detectAvailableServers()
    
    // 重新加载状态
    await loadStatus()
    
    success('开发工具状态已刷新')
  } catch (error) {
    console.error('Failed to refresh status:', error)
  } finally {
    isRefreshing.value = false
  }
}

const showInstallGuide = () => {
  showGuide.value = true
}

const openTerminal = () => {
  // 在不同平台打开终端
  if (typeof window !== 'undefined' && window.__TAURI__) {
    // Tauri 环境
    import('@tauri-apps/plugin-shell').then(({ Command }) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const isWindows = navigator.platform.toUpperCase().indexOf('WIN') >= 0
      
      let command
      if (isMac) {
        command = Command.create('open', ['-a', 'Terminal'])
      } else if (isWindows) {
        command = Command.create('cmd', ['/c', 'start', 'cmd'])
      } else {
        command = Command.create('gnome-terminal', [])
      }
      
      command.execute().catch(console.error)
    })
  }
}

const openFullGuide = () => {
  // 打开完整的安装指南
  if (typeof window !== 'undefined' && window.__TAURI__) {
    import('@tauri-apps/plugin-shell').then(({ open }) => {
      open('https://github.com/your-repo/snippetshub/wiki/development-tools')
    })
  }
}
</script>

<style scoped>
.dev-tools-status {
  background: var(--color-background-secondary);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 20px;
  margin: 16px 0;
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.status-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.refresh-btn {
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 6px;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  background: var(--color-background-tertiary);
  color: var(--color-text-primary);
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.status-summary {
  display: flex;
  gap: 24px;
  margin-bottom: 20px;
  padding: 16px;
  background: var(--color-background);
  border-radius: 8px;
}

.summary-item {
  text-align: center;
}

.summary-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: 4px;
}

.summary-label {
  font-size: 12px;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.tools-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.tool-category h4 {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 12px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--color-border);
}

.tool-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tool-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border-radius: 6px;
  transition: all 0.2s;
}

.tool-item.available {
  background: rgba(var(--color-success-rgb), 0.1);
}

.tool-item:not(.available) {
  background: rgba(var(--color-error-rgb), 0.05);
}

.tool-icon {
  flex-shrink: 0;
}

.tool-item.available .tool-icon {
  color: var(--color-success);
}

.tool-item:not(.available) .tool-icon {
  color: var(--color-error);
}

.tool-info {
  flex: 1;
  min-width: 0;
}

.tool-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: 2px;
}

.tool-version,
.tool-command {
  font-size: 11px;
  color: var(--color-text-tertiary);
  font-family: 'Fira Code', monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-background);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 13px;
}

.action-btn:hover {
  background: var(--color-background-tertiary);
  color: var(--color-text-primary);
}

.action-btn.primary {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.action-btn.primary:hover {
  background: var(--color-primary-hover);
}

/* 模态框样式 */
.guide-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--color-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.guide-content {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.guide-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--color-border);
}

.guide-header h3 {
  margin: 0;
  color: var(--color-text-primary);
}

.close-btn {
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: var(--color-background-tertiary);
  color: var(--color-text-primary);
}

.guide-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.install-section {
  margin-bottom: 24px;
}

.install-section h4 {
  margin: 0 0 12px 0;
  color: var(--color-text-primary);
}

.install-commands,
.lsp-commands {
  background: var(--color-background-secondary);
  border-radius: 8px;
  padding: 16px;
}

.command-group {
  margin-bottom: 16px;
}

.command-group:last-child {
  margin-bottom: 0;
}

.command-group h5 {
  margin: 0 0 8px 0;
  color: var(--color-text-secondary);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

pre {
  margin: 0;
  font-family: 'Fira Code', monospace;
  font-size: 12px;
  color: var(--color-text-primary);
  background: var(--color-background);
  padding: 12px;
  border-radius: 6px;
  overflow-x: auto;
}

.guide-footer {
  padding: 20px;
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .tools-grid {
    grid-template-columns: 1fr;
  }
  
  .status-summary {
    flex-direction: column;
    gap: 12px;
  }
  
  .status-actions {
    flex-direction: column;
  }
}
</style>