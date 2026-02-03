/**
 * SnippetsHub - 专业代码片段管理工具
 * 
 * @file ImportExportPanel.vue - 数据导入导出组件
 * @author Noah
 * @description 支持将代码片段导出为 JSON 格式备份，或从 JSON 文件恢复数据
 * @created 2026-02-02
 * @version 1.0.0
 * 
 * 功能特性:
 * - 导出选项：全部、收藏、包含元数据
 * - 拖拽导入文件
 * - 导入预览与数据统计
 * - 导入模式：合并或替换
 * - JSON 格式验证
 */
<template>
  <div class="import-export-panel">
    <!-- 导出区域 -->
    <div class="section">
      <div class="section-header">
        <Download :size="20" class="section-icon" />
        <div class="section-info">
          <h4>导出数据</h4>
          <p>将代码片段导出为 JSON 文件进行备份</p>
        </div>
      </div>

      <div class="export-options">
        <label class="option-item">
          <input type="checkbox" v-model="exportOptions.includeAll" @change="handleAllChange">
          <span class="checkbox-custom"></span>
          <span class="option-label">全部片段 ({{ snippetCount }} 个)</span>
        </label>
        <label class="option-item">
          <input type="checkbox" v-model="exportOptions.includeFavorites">
          <span class="checkbox-custom"></span>
          <span class="option-label">仅收藏 ({{ favoriteCount }} 个)</span>
        </label>
        <label class="option-item">
          <input type="checkbox" v-model="exportOptions.includeMetadata">
          <span class="checkbox-custom"></span>
          <span class="option-label">包含元数据 (创建时间、更新时间等)</span>
        </label>
      </div>

      <div class="export-preview" v-if="exportPreview">
        <div class="preview-header">
          <FileJson :size="16" />
          <span>预览</span>
        </div>
        <pre class="preview-code">{{ exportPreview }}</pre>
      </div>

      <button class="action-btn primary" @click="handleExport" :disabled="isExporting">
        <Download :size="18" v-if="!isExporting" />
        <Loader2 :size="18" class="spin" v-else />
        {{ isExporting ? '导出中...' : '导出为 JSON' }}
      </button>
    </div>

    <!-- 分隔线 -->
    <div class="divider">
      <span>或者</span>
    </div>

    <!-- 导入区域 -->
    <div class="section">
      <div class="section-header">
        <Upload :size="20" class="section-icon" />
        <div class="section-info">
          <h4>导入数据</h4>
          <p>从 JSON 文件导入代码片段</p>
        </div>
      </div>

      <div 
        class="drop-zone"
        :class="{ 'drag-over': isDragOver, 'has-file': importFile }"
        @dragover.prevent="isDragOver = true"
        @dragleave.prevent="isDragOver = false"
        @drop.prevent="handleDrop"
        @click="triggerFileInput"
      >
        <input 
          type="file" 
          ref="fileInput" 
          accept=".json"
          @change="handleFileSelect"
          hidden
        >
        
        <template v-if="!importFile">
          <div class="drop-icon">
            <FileUp :size="32" />
          </div>
          <p class="drop-text">拖放 JSON 文件到此处</p>
          <p class="drop-hint">或点击选择文件</p>
        </template>
        
        <template v-else>
          <div class="file-info">
            <FileJson :size="24" class="file-icon" />
            <div class="file-details">
              <span class="file-name">{{ importFile.name }}</span>
              <span class="file-size">{{ formatFileSize(importFile.size) }}</span>
            </div>
            <button class="remove-file" @click.stop="removeFile">
              <X :size="16" />
            </button>
          </div>
        </template>
      </div>

      <!-- 导入预览 -->
      <div class="import-preview" v-if="importData">
        <div class="preview-stats">
          <div class="stat">
            <span class="stat-value">{{ importData.length }}</span>
            <span class="stat-label">个片段</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ getLanguagesCount(importData) }}</span>
            <span class="stat-label">种语言</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ getTotalLines(importData) }}</span>
            <span class="stat-label">行代码</span>
          </div>
        </div>

        <div class="import-options">
          <label class="option-item">
            <input type="radio" v-model="importMode" value="merge">
            <span class="radio-custom"></span>
            <span class="option-label">合并 - 保留现有数据，添加新数据</span>
          </label>
          <label class="option-item">
            <input type="radio" v-model="importMode" value="replace">
            <span class="radio-custom"></span>
            <span class="option-label warning">替换 - 删除现有数据，使用导入数据</span>
          </label>
        </div>

        <div class="import-snippets-list">
          <div class="list-header">
            <span>即将导入的片段</span>
            <span class="count">{{ importData.length }} 个</span>
          </div>
          <div class="list-items">
            <div v-for="(snippet, index) in importData.slice(0, 5)" :key="index" class="snippet-item">
              <Code2 :size="14" class="item-icon" />
              <span class="item-title">{{ snippet.title }}</span>
              <span class="item-lang">{{ snippet.language }}</span>
            </div>
            <div v-if="importData.length > 5" class="more-items">
              还有 {{ importData.length - 5 }} 个片段...
            </div>
          </div>
        </div>
      </div>

      <button 
        class="action-btn primary" 
        @click="handleImport" 
        :disabled="!importData || isImporting"
      >
        <Upload :size="18" v-if="!isImporting" />
        <Loader2 :size="18" class="spin" v-else />
        {{ isImporting ? '导入中...' : `导入 ${importData?.length || 0} 个片段` }}
      </button>
    </div>

    <!-- 导入结果 -->
    <div class="result-modal" v-if="showResult" @click.self="showResult = false">
      <div class="result-content">
        <div class="result-icon" :class="resultType">
          <CheckCircle2 :size="48" v-if="resultType === 'success'" />
          <AlertCircle :size="48" v-else />
        </div>
        <h3>{{ resultTitle }}</h3>
        <p>{{ resultMessage }}</p>
        <button class="result-btn" @click="showResult = false">确定</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { 
  Download, Upload, FileJson, FileUp, X, Loader2, 
  Code2, CheckCircle2, AlertCircle 
} from 'lucide-vue-next'
import { useSnippetStore } from '../stores/snippetStore'

const snippetStore = useSnippetStore()

// 状态
const isExporting = ref(false)
const isImporting = ref(false)
const isDragOver = ref(false)
const importFile = ref(null)
const importData = ref(null)
const importMode = ref('merge')
const fileInput = ref(null)
const showResult = ref(false)
const resultType = ref('success')
const resultTitle = ref('')
const resultMessage = ref('')

// 导出选项
const exportOptions = ref({
  includeAll: true,
  includeFavorites: false,
  includeMetadata: true
})

// 统计
const snippetCount = computed(() => snippetStore.snippets?.length || 0)
const favoriteCount = computed(() => 
  snippetStore.snippets?.filter(s => s.isFavorite)?.length || 0
)

// 导出预览
const exportPreview = computed(() => {
  if (!snippetStore.snippets || snippetStore.snippets.length === 0) return null
  
  const sample = snippetStore.snippets[0]
  const preview = {
    title: sample.title,
    language: sample.language,
    code: sample.code?.substring(0, 50) + '...',
    tags: sample.tags
  }
  
  if (exportOptions.value.includeMetadata) {
    preview.created_at = sample.created_at
    preview.updated_at = sample.updated_at
  }
  
  return JSON.stringify(preview, null, 2)
})

// 处理全选变化
const handleAllChange = () => {
  if (exportOptions.value.includeAll) {
    exportOptions.value.includeFavorites = false
  }
}

// 导出功能 - 使用浏览器原生下载
const handleExport = async () => {
  try {
    isExporting.value = true
    
    let dataToExport = snippetStore.snippets || []
    
    if (exportOptions.value.includeFavorites && !exportOptions.value.includeAll) {
      dataToExport = dataToExport.filter(s => s.isFavorite)
    }
    
    if (!exportOptions.value.includeMetadata) {
      dataToExport = dataToExport.map(s => ({
        title: s.title,
        description: s.description,
        code: s.code,
        language: s.language,
        tags: s.tags,
        isFavorite: s.isFavorite
      }))
    }
    
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      count: dataToExport.length,
      snippets: dataToExport
    }
    
    // 使用浏览器原生下载
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `snippetshub-snippets-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    showResultModal('success', '导出成功', `已导出 ${dataToExport.length} 个代码片段`)
  } catch (error) {
    console.error('Export error:', error)
    showResultModal('error', '导出失败', error.message || '导出过程中发生错误')
  } finally {
    isExporting.value = false
  }
}

// 触发文件选择
const triggerFileInput = () => {
  fileInput.value?.click()
}

// 处理文件选择
const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    processFile(file)
  }
}

// 处理拖放
const handleDrop = (event) => {
  isDragOver.value = false
  const file = event.dataTransfer.files[0]
  if (file && file.type === 'application/json') {
    processFile(file)
  }
}

// 处理文件
const processFile = async (file) => {
  importFile.value = file
  
  try {
    const text = await file.text()
    const data = JSON.parse(text)
    
    // 验证数据格式
    if (data.snippets && Array.isArray(data.snippets)) {
      importData.value = data.snippets
    } else if (Array.isArray(data)) {
      importData.value = data
    } else {
      throw new Error('无效的数据格式')
    }
  } catch (error) {
    console.error('Parse error:', error)
    importData.value = null
    showResultModal('error', '解析失败', '无法解析文件内容，请确保是有效的 JSON 格式')
  }
}

// 移除文件
const removeFile = () => {
  importFile.value = null
  importData.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

// 获取语言数量
const getLanguagesCount = (data) => {
  const languages = new Set(data.map(s => s.language))
  return languages.size
}

// 获取总行数
const getTotalLines = (data) => {
  return data.reduce((total, s) => {
    return total + (s.code?.split('\n')?.length || 0)
  }, 0)
}

// 导入功能
const handleImport = async () => {
  if (!importData.value) return
  
  try {
    isImporting.value = true
    
    if (importMode.value === 'replace') {
      // 先删除所有现有数据
      for (const snippet of snippetStore.snippets) {
        await snippetStore.deleteSnippet(snippet.id)
      }
    }
    
    // 导入新数据
    let successCount = 0
    for (const snippet of importData.value) {
      try {
        await snippetStore.createSnippet({
          title: snippet.title || '未命名片段',
          description: snippet.description || '',
          code: snippet.code || '',
          language: snippet.language || 'text',
          tags: snippet.tags || [],
          isFavorite: snippet.isFavorite || false
        })
        successCount++
      } catch (e) {
        console.error('Import snippet error:', e)
      }
    }
    
    // 刷新列表
    await snippetStore.loadSnippets()
    
    // 清理状态
    removeFile()
    
    showResultModal('success', '导入成功', `成功导入 ${successCount} 个代码片段`)
  } catch (error) {
    console.error('Import error:', error)
    showResultModal('error', '导入失败', error.message || '导入过程中发生错误')
  } finally {
    isImporting.value = false
  }
}

// 显示结果弹窗
const showResultModal = (type, title, message) => {
  resultType.value = type
  resultTitle.value = title
  resultMessage.value = message
  showResult.value = true
}
</script>

<style scoped>
.import-export-panel {
  padding: 24px;
}

.section {
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 20px;
}

.section-icon {
  color: var(--color-primary);
  margin-top: 2px;
}

.section-info h4 {
  margin: 0 0 4px;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.section-info p {
  margin: 0;
  font-size: 13px;
  color: var(--color-text-secondary);
}

/* 导出选项 */
.export-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.option-item input[type="checkbox"],
.option-item input[type="radio"] {
  display: none;
}

.checkbox-custom,
.radio-custom {
  width: 20px;
  height: 20px;
  border: 2px solid var(--color-border);
  border-radius: 6px;
  transition: all 0.15s ease;
  position: relative;
}

.radio-custom {
  border-radius: 50%;
}

.option-item input:checked + .checkbox-custom,
.option-item input:checked + .radio-custom {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.option-item input:checked + .checkbox-custom::after {
  content: '';
  position: absolute;
  left: 6px;
  top: 2px;
  width: 5px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.option-item input:checked + .radio-custom::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  width: 8px;
  height: 8px;
  background: white;
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.option-label {
  font-size: 14px;
  color: var(--color-text-primary);
}

.option-label.warning {
  color: var(--color-error);
}

/* 导出预览 */
.export-preview {
  background: var(--color-background-secondary);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  margin-bottom: 20px;
  overflow: hidden;
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: var(--color-background-tertiary);
  border-bottom: 1px solid var(--color-border);
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.preview-code {
  margin: 0;
  padding: 16px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: var(--color-text-primary);
  overflow-x: auto;
  max-height: 150px;
}

/* 分隔线 */
.divider {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 32px 0;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--color-border);
}

.divider span {
  font-size: 12px;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* 拖放区域 */
.drop-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  border: 2px dashed var(--color-border);
  border-radius: 12px;
  background: var(--color-background-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 20px;
}

.drop-zone:hover,
.drop-zone.drag-over {
  border-color: var(--color-primary);
  background: rgba(137, 180, 250, 0.05);
}

.drop-zone.has-file {
  padding: 20px;
  border-style: solid;
  border-color: var(--color-success);
  background: rgba(166, 227, 161, 0.05);
}

.drop-icon {
  color: var(--color-text-tertiary);
  margin-bottom: 12px;
}

.drop-text {
  margin: 0 0 4px;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
}

.drop-hint {
  margin: 0;
  font-size: 12px;
  color: var(--color-text-tertiary);
}

/* 文件信息 */
.file-info {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
}

.file-icon {
  color: var(--color-success);
}

.file-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.file-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
}

.file-size {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.remove-file {
  padding: 6px;
  background: none;
  border: none;
  color: var(--color-text-tertiary);
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.15s ease;
}

.remove-file:hover {
  background: var(--color-error);
  color: white;
}

/* 导入预览 */
.import-preview {
  margin-bottom: 20px;
}

.preview-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  background: var(--color-background-secondary);
  border: 1px solid var(--color-border);
  border-radius: 10px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-primary);
}

.stat-label {
  font-size: 12px;
  color: var(--color-text-secondary);
}

/* 导入选项 */
.import-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

/* 片段列表 */
.import-snippets-list {
  background: var(--color-background-secondary);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 20px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--color-background-tertiary);
  border-bottom: 1px solid var(--color-border);
  font-size: 12px;
  font-weight: 500;
}

.list-header .count {
  color: var(--color-text-secondary);
}

.list-items {
  max-height: 200px;
  overflow-y: auto;
}

.snippet-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--color-border);
}

.snippet-item:last-child {
  border-bottom: none;
}

.item-icon {
  color: var(--color-primary);
}

.item-title {
  flex: 1;
  font-size: 13px;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-lang {
  font-size: 11px;
  padding: 2px 8px;
  background: var(--color-background-tertiary);
  border-radius: 4px;
  color: var(--color-text-secondary);
}

.more-items {
  padding: 12px 16px;
  font-size: 12px;
  color: var(--color-text-tertiary);
  text-align: center;
  background: var(--color-background-tertiary);
}

/* 操作按钮 */
.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 14px 20px;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.action-btn.primary {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  color: white;
}

.action-btn.primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(137, 180, 250, 0.3);
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 结果弹窗 */
.result-modal {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.result-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
  background: var(--color-background);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
  max-width: 400px;
  text-align: center;
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.result-icon {
  margin-bottom: 16px;
}

.result-icon.success {
  color: var(--color-success);
}

.result-icon.error {
  color: var(--color-error);
}

.result-content h3 {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.result-content p {
  margin: 0 0 24px;
  font-size: 14px;
  color: var(--color-text-secondary);
}

.result-btn {
  padding: 12px 32px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s ease;
}

.result-btn:hover {
  transform: scale(1.02);
}
</style>
