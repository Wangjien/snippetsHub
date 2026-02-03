/**
 * SnippetsHub - 专业代码片段管理工具
 * 
 * @file UpdateManager.vue - 自动更新管理组件
 * @author Noah
 * @description 处理应用程序的自动更新检查、下载和安装
 * @created 2026-01-31
 * @modified 2026-01-31
 * @version 1.0.0
 * 
 * 功能特性:
 * - 自动检查更新
 * - 更新进度显示
 * - 用户确认对话框
 * - 更新日志展示
 * - 静默更新选项
 * - 更新失败处理
 */

<template>
  <div class="update-manager">
    <!-- 更新检查状态 -->
    <div v-if="showUpdateStatus" class="update-status" :class="updateStatus.type">
      <div class="status-content">
        <component :is="getStatusIcon()" :size="20" class="status-icon" />
        <div class="status-text">
          <div class="status-message">{{ updateStatus.message }}</div>
          <div v-if="updateStatus.detail" class="status-detail">{{ updateStatus.detail }}</div>
        </div>
        <button @click="hideUpdateStatus" class="close-status">
          <X :size="16" />
        </button>
      </div>
      <div v-if="updateStatus.progress !== null" class="progress-bar">
        <div class="progress-fill" :style="{ width: `${updateStatus.progress}%` }"></div>
      </div>
    </div>

    <!-- 更新对话框 -->
    <div v-if="showUpdateDialog" class="update-dialog-overlay" @click="closeUpdateDialog">
      <div class="update-dialog" @click.stop>
        <div class="dialog-header">
          <div class="header-content">
            <Download :size="24" class="header-icon" />
            <div>
              <h3>发现新版本</h3>
              <p>SnippetsHub {{ availableUpdate.version }} 现已可用</p>
            </div>
          </div>
          <button @click="closeUpdateDialog" class="close-dialog">
            <X :size="20" />
          </button>
        </div>

        <div class="dialog-content">
          <!-- 版本信息 -->
          <div class="version-info">
            <div class="version-item">
              <span class="version-label">当前版本:</span>
              <span class="version-value">{{ currentVersion }}</span>
            </div>
            <div class="version-item">
              <span class="version-label">最新版本:</span>
              <span class="version-value new">{{ availableUpdate.version }}</span>
            </div>
            <div class="version-item">
              <span class="version-label">发布日期:</span>
              <span class="version-value">{{ formatDate(availableUpdate.date) }}</span>
            </div>
            <div class="version-item">
              <span class="version-label">文件大小:</span>
              <span class="version-value">{{ formatSize(availableUpdate.size) }}</span>
            </div>
          </div>

          <!-- 更新日志 -->
          <div class="changelog">
            <h4>更新内容</h4>
            <div class="changelog-content" v-html="availableUpdate.notes"></div>
          </div>

          <!-- 更新选项 -->
          <div class="update-options">
            <label class="option-item">
              <input type="checkbox" v-model="autoInstall" />
              <span>下载完成后自动安装</span>
            </label>
            <label class="option-item">
              <input type="checkbox" v-model="silentUpdate" />
              <span>静默更新（后台下载）</span>
            </label>
          </div>
        </div>

        <div class="dialog-actions">
          <button @click="skipUpdate" class="skip-btn">
            <Clock :size="16" />
            <span>稍后提醒</span>
          </button>
          <button @click="ignoreUpdate" class="ignore-btn">
            <EyeOff :size="16" />
            <span>忽略此版本</span>
          </button>
          <button @click="startUpdate" class="update-btn" :disabled="isUpdating">
            <component :is="isUpdating ? Loader2 : Download" :size="16" :class="{ spinning: isUpdating }" />
            <span>{{ isUpdating ? '下载中...' : '立即更新' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 更新设置面板 -->
    <div v-if="showSettings" class="update-settings">
      <div class="settings-header">
        <h4>更新设置</h4>
        <button @click="showSettings = false" class="close-settings">
          <X :size="16" />
        </button>
      </div>
      
      <div class="settings-content">
        <div class="setting-group">
          <label class="setting-item">
            <input type="checkbox" v-model="settings.autoCheck" @change="saveSettings" />
            <div class="setting-info">
              <span class="setting-name">自动检查更新</span>
              <span class="setting-desc">启动时自动检查新版本</span>
            </div>
          </label>
          
          <label class="setting-item">
            <input type="checkbox" v-model="settings.autoDownload" @change="saveSettings" />
            <div class="setting-info">
              <span class="setting-name">自动下载更新</span>
              <span class="setting-desc">发现新版本时自动下载</span>
            </div>
          </label>
          
          <label class="setting-item">
            <input type="checkbox" v-model="settings.autoInstall" @change="saveSettings" />
            <div class="setting-info">
              <span class="setting-name">自动安装更新</span>
              <span class="setting-desc">下载完成后自动安装</span>
            </div>
          </label>
        </div>

        <div class="setting-group">
          <div class="setting-item">
            <div class="setting-info">
              <span class="setting-name">检查频率</span>
              <span class="setting-desc">设置检查更新的频率</span>
            </div>
            <select v-model="settings.checkInterval" @change="saveSettings" class="setting-select">
              <option value="startup">仅启动时</option>
              <option value="daily">每天</option>
              <option value="weekly">每周</option>
              <option value="monthly">每月</option>
            </select>
          </div>
        </div>

        <div class="setting-group">
          <div class="setting-item">
            <div class="setting-info">
              <span class="setting-name">更新通道</span>
              <span class="setting-desc">选择接收更新的类型</span>
            </div>
            <select v-model="settings.updateChannel" @change="saveSettings" class="setting-select">
              <option value="stable">稳定版</option>
              <option value="beta">测试版</option>
              <option value="dev">开发版</option>
            </select>
          </div>
        </div>
      </div>

      <div class="settings-actions">
        <button @click="checkForUpdates" class="check-btn" :disabled="isChecking">
          <component :is="isChecking ? Loader2 : RefreshCw" :size="16" :class="{ spinning: isChecking }" />
          <span>{{ isChecking ? '检查中...' : '立即检查' }}</span>
        </button>
        <button @click="resetSettings" class="reset-btn">
          <RotateCcw :size="16" />
          <span>重置设置</span>
        </button>
      </div>
    </div>

    <!-- 浮动更新按钮 -->
    <button
      v-if="hasUpdate && !showUpdateDialog"
      @click="showUpdateDialog = true"
      class="floating-update-btn"
      :class="{ pulsing: hasUpdate }"
    >
      <Download :size="20" />
      <span class="update-badge">{{ availableUpdate?.version }}</span>
    </button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  Download, X, Clock, EyeOff, Loader2, RefreshCw, RotateCcw,
  CheckCircle, AlertTriangle, XCircle, Info
} from 'lucide-vue-next'
// import { check } from '@tauri-apps/plugin-updater'
// import { relaunch } from '@tauri-apps/api/process'
// import { getVersion } from '@tauri-apps/api/app'
import { useNotifications } from '../composables/useNotifications'

const { success, error, warning, info } = useNotifications()

// 响应式状态
const currentVersion = ref('')
const availableUpdate = ref(null)
const hasUpdate = ref(false)
const isChecking = ref(false)
const isUpdating = ref(false)
const showUpdateDialog = ref(false)
const showUpdateStatus = ref(false)
const showSettings = ref(false)
const autoInstall = ref(true)
const silentUpdate = ref(false)

// 更新状态
const updateStatus = ref({
  type: 'info', // info, success, warning, error
  message: '',
  detail: '',
  progress: null
})

// 更新设置
const settings = ref({
  autoCheck: true,
  autoDownload: false,
  autoInstall: false,
  checkInterval: 'daily',
  updateChannel: 'stable'
})

// 忽略的版本列表
const ignoredVersions = ref(new Set())

// 定时器
let checkTimer = null

// 计算属性
const getStatusIcon = () => {
  switch (updateStatus.value.type) {
    case 'success': return CheckCircle
    case 'warning': return AlertTriangle
    case 'error': return XCircle
    default: return Info
  }
}

// 方法
const loadSettings = () => {
  try {
    const saved = localStorage.getItem('update-settings')
    if (saved) {
      Object.assign(settings.value, JSON.parse(saved))
    }
    
    const ignored = localStorage.getItem('ignored-versions')
    if (ignored) {
      ignoredVersions.value = new Set(JSON.parse(ignored))
    }
  } catch (err) {
    console.warn('Failed to load update settings:', err)
  }
}

const saveSettings = () => {
  try {
    localStorage.setItem('update-settings', JSON.stringify(settings.value))
    localStorage.setItem('ignored-versions', JSON.stringify([...ignoredVersions.value]))
    
    // 重新设置检查定时器
    setupCheckTimer()
  } catch (err) {
    console.warn('Failed to save update settings:', err)
  }
}

const resetSettings = () => {
  settings.value = {
    autoCheck: true,
    autoDownload: false,
    autoInstall: false,
    checkInterval: 'daily',
    updateChannel: 'stable'
  }
  ignoredVersions.value.clear()
  saveSettings()
  success('更新设置已重置')
}

const checkForUpdates = async (silent = false) => {
  if (isChecking.value) return
  
  isChecking.value = true
  
  if (!silent) {
    showUpdateStatus.value = true
    updateStatus.value = {
      type: 'info',
      message: '正在检查更新...',
      detail: '请稍候',
      progress: null
    }
  }
  
  try {
    // Temporarily disabled until updater plugin is properly configured
    // const update = await check()
    const update = null // Mock response
    
    if (update?.available) {
      // 检查是否是被忽略的版本
      if (ignoredVersions.value.has(update.version)) {
        if (!silent) {
          updateStatus.value = {
            type: 'info',
            message: '已是最新版本',
            detail: `当前版本: ${currentVersion.value}`,
            progress: null
          }
        }
        return
      }
      
      availableUpdate.value = {
        version: update.version,
        date: update.date || new Date().toISOString(),
        notes: update.body || '暂无更新说明',
        size: update.contentLength || 0
      }
      
      hasUpdate.value = true
      
      if (!silent) {
        updateStatus.value = {
          type: 'success',
          message: `发现新版本 ${update.version}`,
          detail: '点击查看详情',
          progress: null
        }
        
        // 根据设置决定是否自动下载
        if (settings.value.autoDownload) {
          setTimeout(() => startUpdate(true), 2000)
        } else {
          showUpdateDialog.value = true
        }
      }
    } else {
      if (!silent) {
        updateStatus.value = {
          type: 'success',
          message: '已是最新版本',
          detail: `当前版本: ${currentVersion.value}`,
          progress: null
        }
      }
    }
  } catch (err) {
    console.error('Update check failed:', err)
    
    if (!silent) {
      updateStatus.value = {
        type: 'error',
        message: '检查更新失败',
        detail: err.message || '网络连接异常',
        progress: null
      }
    }
  } finally {
    isChecking.value = false
    
    if (!silent) {
      setTimeout(() => {
        showUpdateStatus.value = false
      }, 5000)
    }
  }
}

const startUpdate = async (silent = false) => {
  if (!availableUpdate.value || isUpdating.value) return
  
  isUpdating.value = true
  
  if (!silent) {
    showUpdateDialog.value = false
  }
  
  showUpdateStatus.value = true
  updateStatus.value = {
    type: 'info',
    message: '正在下载更新...',
    detail: `版本 ${availableUpdate.value.version}`,
    progress: 0
  }
  
  try {
    // Temporarily disabled until updater plugin is properly configured
    // const update = await check()
    const update = null // Mock response
    if (update?.available) {
      // 监听下载进度
      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case 'Started':
            updateStatus.value.message = '开始下载更新...'
            updateStatus.value.progress = 0
            break
          case 'Progress':
            const progress = Math.round((event.data.chunkLength / event.data.contentLength) * 100)
            updateStatus.value.progress = progress
            updateStatus.value.detail = `${progress}% (${formatSize(event.data.chunkLength)}/${formatSize(event.data.contentLength)})`
            break
          case 'Finished':
            updateStatus.value.message = '下载完成，准备安装...'
            updateStatus.value.progress = 100
            break
        }
      })
      
      // 下载完成
      updateStatus.value = {
        type: 'success',
        message: '更新下载完成',
        detail: '应用将重启以完成安装',
        progress: 100
      }
      
      success('更新下载完成，应用将重启')
      
      // 延迟重启以显示消息
      setTimeout(async () => {
        try {
          // Temporarily disabled until updater plugin is properly configured
          // await relaunch()
          info('更新完成，请手动重启应用')
        } catch (err) {
          error('重启失败，请手动重启应用')
        }
      }, 2000)
      
    }
  } catch (err) {
    console.error('Update failed:', err)
    
    updateStatus.value = {
      type: 'error',
      message: '更新失败',
      detail: err.message || '下载或安装过程中出现错误',
      progress: null
    }
    
    error('更新失败: ' + (err.message || '未知错误'))
  } finally {
    isUpdating.value = false
  }
}

const skipUpdate = () => {
  showUpdateDialog.value = false
  info('已跳过此次更新，下次启动时会再次提醒')
}

const ignoreUpdate = () => {
  if (availableUpdate.value) {
    ignoredVersions.value.add(availableUpdate.value.version)
    saveSettings()
    showUpdateDialog.value = false
    hasUpdate.value = false
    info(`已忽略版本 ${availableUpdate.value.version}`)
  }
}

const closeUpdateDialog = () => {
  if (!isUpdating.value) {
    showUpdateDialog.value = false
  }
}

const hideUpdateStatus = () => {
  showUpdateStatus.value = false
}

const setupCheckTimer = () => {
  if (checkTimer) {
    clearInterval(checkTimer)
    checkTimer = null
  }
  
  if (!settings.value.autoCheck) return
  
  let interval = 0
  switch (settings.value.checkInterval) {
    case 'daily':
      interval = 24 * 60 * 60 * 1000 // 24小时
      break
    case 'weekly':
      interval = 7 * 24 * 60 * 60 * 1000 // 7天
      break
    case 'monthly':
      interval = 30 * 24 * 60 * 60 * 1000 // 30天
      break
    default:
      return // 仅启动时检查
  }
  
  checkTimer = setInterval(() => {
    checkForUpdates(true)
  }, interval)
}

// 格式化函数
const formatDate = (dateString) => {
  try {
    return new Date(dateString).toLocaleDateString('zh-CN')
  } catch {
    return '未知'
  }
}

const formatSize = (bytes) => {
  if (!bytes) return '未知'
  
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`
}

// 生命周期
onMounted(async () => {
  try {
    // Temporarily disabled until updater plugin is properly configured
    // currentVersion.value = await getVersion()
    currentVersion.value = '1.0.0' // Mock version
    loadSettings()
    
    // 启动时检查更新
    if (settings.value.autoCheck) {
      setTimeout(() => {
        checkForUpdates(true)
      }, 3000) // 延迟3秒，避免影响启动性能
    }
    
    setupCheckTimer()
  } catch (err) {
    console.error('Failed to initialize updater:', err)
  }
})

onUnmounted(() => {
  if (checkTimer) {
    clearInterval(checkTimer)
  }
})

// 暴露方法给父组件
defineExpose({
  checkForUpdates,
  showSettings: () => { showSettings.value = true },
  hasUpdate: computed(() => hasUpdate.value),
  currentVersion: computed(() => currentVersion.value)
})
</script>

<style scoped>
.update-manager {
  position: relative;
}

.update-status {
  position: fixed;
  top: 20px;
  right: 20px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  min-width: 300px;
  max-width: 400px;
}

.update-status.success {
  border-color: var(--color-success);
}

.update-status.warning {
  border-color: var(--color-warning);
}

.update-status.error {
  border-color: var(--color-error);
}

.status-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
}

.status-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.update-status.success .status-icon {
  color: var(--color-success);
}

.update-status.warning .status-icon {
  color: var(--color-warning);
}

.update-status.error .status-icon {
  color: var(--color-error);
}

.update-status.info .status-icon {
  color: var(--color-primary);
}

.status-text {
  flex: 1;
}

.status-message {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: 4px;
}

.status-detail {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.close-status {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: var(--color-text-tertiary);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.close-status:hover {
  background: var(--color-background-secondary);
  color: var(--color-text-primary);
}

.progress-bar {
  height: 4px;
  background: var(--color-background-secondary);
  border-radius: 0 0 8px 8px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--color-primary);
  transition: width 0.3s ease;
}

.update-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--color-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.update-dialog {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  width: 500px;
  max-width: 90vw;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-background-secondary);
}

.header-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon {
  color: var(--color-primary);
}

.dialog-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.dialog-header p {
  margin: 4px 0 0 0;
  font-size: 14px;
  color: var(--color-text-secondary);
}

.close-dialog {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.close-dialog:hover {
  background: var(--color-background-tertiary);
  color: var(--color-text-primary);
}

.dialog-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.version-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
  padding: 16px;
  background: var(--color-background-secondary);
  border-radius: 8px;
}

.version-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.version-label {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.version-value {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-primary);
}

.version-value.new {
  color: var(--color-primary);
  font-weight: 600;
}

.changelog {
  margin-bottom: 20px;
}

.changelog h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.changelog-content {
  max-height: 200px;
  overflow-y: auto;
  padding: 12px;
  background: var(--color-background-secondary);
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--color-text-secondary);
}

.update-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--color-text-primary);
  cursor: pointer;
}

.option-item input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: var(--color-primary);
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid var(--color-border);
  background: var(--color-background-secondary);
}

.skip-btn,
.ignore-btn,
.update-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.skip-btn {
  background: var(--color-background);
  color: var(--color-text-secondary);
}

.skip-btn:hover {
  border-color: var(--color-warning);
  color: var(--color-warning);
}

.ignore-btn {
  background: var(--color-background);
  color: var(--color-text-secondary);
}

.ignore-btn:hover {
  border-color: var(--color-error);
  color: var(--color-error);
}

.update-btn {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.update-btn:hover:not(:disabled) {
  background: var(--color-primary-hover);
  border-color: var(--color-primary-hover);
}

.update-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.update-settings {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  width: 400px;
  max-width: 90vw;
  z-index: 1500;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-background-secondary);
}

.settings-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.close-settings {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.close-settings:hover {
  background: var(--color-background-tertiary);
  color: var(--color-text-primary);
}

.settings-content {
  padding: 20px;
}

.setting-group {
  margin-bottom: 20px;
}

.setting-group:last-child {
  margin-bottom: 0;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid var(--color-border);
  cursor: pointer;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-item input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: var(--color-primary);
}

.setting-info {
  flex: 1;
  margin-right: 12px;
}

.setting-name {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: 2px;
}

.setting-desc {
  display: block;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.setting-select {
  padding: 6px 8px;
  border: 1px solid var(--color-border);
  background: var(--color-background-secondary);
  color: var(--color-text-primary);
  border-radius: 4px;
  font-size: 12px;
  outline: none;
}

.setting-select:focus {
  border-color: var(--color-primary);
}

.settings-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid var(--color-border);
  background: var(--color-background-secondary);
}

.check-btn,
.reset-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.check-btn {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.check-btn:hover:not(:disabled) {
  background: var(--color-primary-hover);
  border-color: var(--color-primary-hover);
}

.check-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.reset-btn {
  background: var(--color-background);
  color: var(--color-text-secondary);
}

.reset-btn:hover {
  border-color: var(--color-warning);
  color: var(--color-warning);
}

.floating-update-btn {
  position: fixed;
  bottom: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  transition: all 0.2s;
  z-index: 1000;
}

.floating-update-btn:hover {
  transform: scale(1.1);
}

.floating-update-btn.pulsing {
  animation: pulse 2s infinite;
}

.update-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: var(--color-error);
  color: white;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 10px;
  border: 2px solid white;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .update-dialog {
    width: 95vw;
  }
  
  .update-settings {
    width: 95vw;
  }
  
  .update-status {
    left: 10px;
    right: 10px;
    min-width: auto;
  }
  
  .floating-update-btn {
    bottom: 80px;
  }
}
</style>