<template>
  <div class="cloud-sync-panel">
    <!-- 顶部平台切换 -->
    <div class="platform-selector">
      <div 
        v-for="platform in platforms" 
        :key="platform.id"
        class="platform-card"
        :class="{ active: activePlatform === platform.id }"
        @click="activePlatform = platform.id"
      >
        <div class="platform-icon-wrapper" :class="platform.id">
          <component :is="platform.icon" :size="24" />
        </div>
        <div class="platform-info">
          <span class="platform-name">{{ platform.name }}</span>
          <span class="platform-status" :class="{ connected: isConnected(platform.id) }">
            {{ isConnected(platform.id) ? '已连接' : '未配置' }}
          </span>
        </div>
        <div class="active-indicator" v-if="activePlatform === platform.id"></div>
      </div>
    </div>

    <!-- 主内容区域 -->
    <div class="content-area">
      <Transition name="fade" mode="out-in">
        <div :key="activePlatform" class="platform-container">
          
          <!-- header -->
          <div class="panel-header">
            <div>
              <h2>{{ activePlatformData.title }}</h2>
              <p>{{ activePlatformData.description }}</p>
            </div>
            <a :href="activePlatformData.docsUrl" target="_blank" class="help-link">
              <HelpCircle :size="16" />
              <span>配置指南</span>
            </a>
          </div>

          <!-- 未连接状态：配置表单 -->
          <div v-if="!isConnected(activePlatform)" class="config-card">
            <div class="card-body">
              <div class="input-group">
                <label>
                  Access Token
                  <span class="badge-required">必填</span>
                </label>
                <div class="input-wrapper">
                  <Key :size="16" class="input-icon" />
                  <input 
                    :type="showToken ? 'text' : 'password'"
                    v-model="currentConfig.token"
                    :placeholder="activePlatformData.tokenPlaceholder"
                  >
                  <button class="toggle-btn" @click="showToken = !showToken">
                    <component :is="showToken ? EyeOff : Eye" :size="16" />
                  </button>
                </div>
                <div class="helper-text">
                  <Info :size="14" />
                  <span>需要 {{ activePlatformData.scope }} 权限。</span>
                  <a :href="activePlatformData.tokenUrl" target="_blank">点击此处创建 Token &rarr;</a>
                </div>
              </div>

              <div class="input-group" v-if="activePlatform === 'gitlab'">
                <label>
                  GitLab 实例 URL
                  <span class="badge-required">必填</span>
                </label>
                <div class="input-wrapper">
                  <Globe :size="16" class="input-icon" />
                  <input 
                    type="text"
                    v-model="currentConfig.baseUrl"
                    placeholder="https://gitlab.com"
                  >
                </div>
                <div class="helper-text">
                  <Info :size="14" />
                  <span>支持 GitLab.com 或私有部署实例。</span>
                </div>
              </div>

              <div class="input-group">
                <label>默认可见性</label>
                <div class="visibility-selector">
                  <button 
                    v-for="option in visibilityOptions"
                    :key="option.value"
                    class="visibility-option"
                    :class="{ selected: currentConfig.visibility === option.value }"
                    @click="currentConfig.visibility = option.value"
                  >
                    <component :is="option.icon" :size="16" />
                    <span>{{ option.label }}</span>
                  </button>
                </div>
              </div>

              <button class="btn-primary full-width" @click="saveConfig" :disabled="!currentConfig.token || isConnecting">
                <Loader2 v-if="isConnecting" :size="18" class="spin" />
                <span v-else>验证并保存配置</span>
              </button>
            </div>
          </div>

          <!-- 已连接状态：仪表盘 -->
          <div v-else class="connected-dashboard">
            <!-- 用户信息卡片 (紧凑版) -->
            <div class="user-card-compact">
              <div class="user-profile">
                <img :src="currentUser.avatar_url" class="avatar" alt="Avatar">
                <div class="user-details">
                  <span class="username">{{ currentUser.login }}</span>
                  <span class="sync-status">
                    <CheckCircle2 :size="12" />
                    账号正常
                  </span>
                </div>
              </div>
              
              <div class="header-actions">
                <div class="auto-sync-wrapper" @click="handleToggleAutoSync">
                  <span class="label">自动同步</span>
                  <div class="toggle-switch" :class="{ active: isAutoSyncEnabled }">
                    <div class="toggle-thumb"></div>
                  </div>
                </div>
                <div class="divider-vertical"></div>
                <button class="btn-ghost-sm" @click="disconnect" title="断开连接">
                  <LogOut :size="14" />
                  <span>断开</span>
                </button>
              </div>
            </div>

            <!-- 操作区域 -->
            <div class="action-grid">
              
              <!-- 左侧：同步操作 -->
              <div class="action-card upload-card">
                <div class="card-header-small">
                  <Cloud :size="18" />
                  <span>同步中心</span>
                </div>
                
                <div class="upload-form">
                  <div class="select-label">选择本地代码片段</div>
                  <div class="select-wrapper">
                    <select v-model="selectedSnippetId" class="custom-select">
                      <option value="">-- 请选择 --</option>
                      <option v-for="snippet in snippets" :key="snippet.id" :value="snippet.id">
                        {{ getSnippetStatusIcon(snippet.id) }} {{ snippet.title }}
                      </option>
                    </select>
                    <ChevronDown :size="16" class="select-arrow" />
                  </div>

                  <!-- 选中后显示的详细信息 -->
                  <div v-if="selectedSnippet" class="snippet-detail-panel">
                    <div class="sync-status-indicator" :class="getSyncStatus(selectedSnippet.id)">
                      <component :is="getSyncStatusIconComponent(selectedSnippet.id)" :size="14" />
                      <span>{{ getSyncStatusText(selectedSnippet.id) }}</span>
                    </div>

                    <div class="snippet-preview-mini">
                      <code>{{ selectedSnippet.code.substring(0, 80).replace(/\n/g, ' ') }}...</code>
                    </div>

                    <div class="form-row">
                      <input type="text" v-model="uploadDescription" placeholder="Gist 描述" class="simple-input">
                      <input type="text" v-model="uploadFilename" :placeholder="getDefaultFilename() || '文件名'" class="simple-input">
                    </div>

                    <div class="action-buttons">
                      <button 
                        class="btn-primary" 
                        @click="handleSync"
                        :disabled="isUploading"
                        :class="{ 'btn-update': isSynced(selectedSnippet.id) }"
                      >
                        <Loader2 v-if="isUploading" :size="16" class="spin" />
                        <template v-else>
                          <RefreshCw v-if="isSynced(selectedSnippet.id)" :size="16" />
                          <Upload v-else :size="16" />
                          <span>{{ isSynced(selectedSnippet.id) ? '更新云端版本' : '上传到云端' }}</span>
                        </template>
                      </button>
                      
                      <button 
                        v-if="isSynced(selectedSnippet.id)"
                        class="btn-secondary"
                        @click="copyGistLink(selectedSnippet.id)"
                        title="复制云端链接"
                      >
                        <Link2 :size="16" />
                      </button>
                    </div>
                  </div>
                  
                  <div v-else class="empty-selection">
                    <Code2 :size="48" class="empty-icon-faded" />
                    <p>选择一个片段开始同步</p>
                  </div>
                </div>
              </div>

              <!-- 右侧：动态列表 -->
              <div class="action-card history-card">
                <div class="card-header-small">
                  <Activity :size="18" />
                  <span>最近动态</span>
                  <button class="refresh-btn" @click="refreshGists" :disabled="refreshing">
                    <RotateCw :size="14" :class="{ spin: refreshing }" />
                  </button>
                </div>
                
                <div class="gist-list-container">
                  <!-- 骨架屏加载 -->
                  <div v-if="refreshing && recentGists.length === 0" class="skeleton-list">
                    <div class="skeleton-item" v-for="i in 3" :key="i"></div>
                  </div>

                  <!-- 空状态 -->
                  <div v-else-if="recentGists.length === 0" class="empty-list">
                    <Inbox :size="32" />
                    <span>暂无云端记录</span>
                  </div>
                  
                  <!-- 列表 -->
                  <div v-else class="gist-list-modern">
                    <div v-for="gist in recentGists" :key="gist.id" class="gist-item-modern">
                      <div class="gist-icon-area">
                        <FileCode :size="18" />
                      </div>
                      <div class="gist-content-area">
                        <div class="gist-main-info">
                          <span class="gist-title" :title="getDescription(gist)">{{ getDescription(gist) }}</span>
                          <span class="gist-badge" :class="isPublic(gist) ? 'public' : 'secret'">
                            {{ isPublic(gist) ? '公开' : '私密' }}
                          </span>
                        </div>
                        <div class="gist-sub-info">
                          <span>{{ formatDate(gist.updated_at || gist.created_at) }}</span>
                          <span class="dot">•</span>
                          <span>{{ getFileCount(gist) }} 文件</span>
                        </div>
                      </div>
                      <div class="gist-actions-area">
                        <button class="action-btn-mini" @click="copyLink(gist.html_url)" title="复制链接">
                          <Link2 :size="14" />
                        </button>
                        <button class="action-btn-mini" @click="importFromGist(gist)" title="导入本地" :disabled="isImportingGist === gist.id">
                          <Loader2 v-if="isImportingGist === gist.id" :size="14" class="spin" />
                          <Download v-else :size="14" />
                        </button>
                        <a :href="gist.html_url" target="_blank" class="action-btn-mini" title="查看">
                          <ExternalLink :size="14" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Toast 通知 -->
    <Transition name="slide-up">
      <div v-if="showResult" class="notification-toast" :class="resultType">
        <div class="toast-icon">
          <CheckCircle2 v-if="resultType === 'success'" :size="20" />
          <AlertTriangle v-else :size="20" />
        </div>
        <div class="toast-content">
          <h4>{{ resultTitle }}</h4>
          <p>{{ resultMessage }}</p>
        </div>
        <button class="close-toast" @click="showResult = false">
          <X :size="16" />
        </button>
      </div>
    </Transition>
  </div>
</template>



<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { 
  Github, Globe, GitGraph, Lock, Eye, EyeOff, Save, Upload, Code2, Cloud,
  CheckCircle2, AlertTriangle, ExternalLink, FileCode, Loader2, Download,
  HelpCircle, Key, Info, LogOut, ChevronDown, Activity, RotateCw, Inbox, X,
  RefreshCw, Link2, Check, Gitlab
} from 'lucide-vue-next'
import { useSnippetStore } from '../stores/snippetStore'
import { useCloudStore } from '../stores/cloudStore'

const snippetStore = useSnippetStore()
const cloudStore = useCloudStore()

// --- State ---
const activePlatform = ref('github')
const showToken = ref(false)
const isConnecting = ref(false)
const isUploading = ref(false)
const isImportingGist = ref(null)
const refreshing = ref(false)

// Local Gist Lists (Fetch on demand)
const githubGists = ref([])
const giteeGists = ref([])
const gitlabGists = ref([])

// Upload State
const selectedSnippetId = ref('')
const uploadDescription = ref('')
const uploadFilename = ref('')

// Notification
const showResult = ref(false)
const resultType = ref('success')
const resultTitle = ref('')
const resultMessage = ref('')

// --- Constants ---
const platforms = [
  { id: 'github', name: 'GitHub', icon: Github },
  { id: 'gitee', name: 'Gitee', icon: GitGraph },
  { id: 'gitlab', name: 'GitLab', icon: Gitlab }
]

const visibilityOptions = [
  { label: '私密', value: 'secret', icon: Lock },
  { label: '公开', value: 'public', icon: Globe }
]

// --- Computed ---
const activePlatformData = computed(() => {
  if (activePlatform.value === 'github') {
    return {
      title: 'GitHub Gist',
      description: '全球最大的代码托管平台，支持版本控制。',
      docsUrl: 'https://docs.github.com/en/rest/gists',
      tokenUrl: 'https://github.com/settings/tokens/new?scopes=gist',
      tokenPlaceholder: 'ghp_xxxxxxxxxxxx',
      scope: 'gist'
    }
  } else if (activePlatform.value === 'gitee') {
    return {
      title: 'Gitee 代码片段',
      description: '国内访问速度快，支持私有代码片段。',
      docsUrl: 'https://gitee.com/api/v5/swagger#/getV5Gists',
      tokenUrl: 'https://gitee.com/profile/personal_access_tokens/new',
      tokenPlaceholder: '私人令牌',
      scope: 'gists'
    }
  } else {
    return {
      title: 'GitLab Snippets',
      description: 'DevSecOps 平台，支持私有部署。',
      docsUrl: 'https://docs.gitlab.com/ee/api/snippets.html',
      tokenUrl: 'https://gitlab.com/-/profile/personal_access_tokens',
      tokenPlaceholder: 'glpat-xxxxxxxxxxxx',
      scope: 'api'
    }
  }
})

// Store Bindings with simpler computed props
const currentConfig = computed({
  get: () => activePlatform.value === 'github' ? cloudStore.githubConfig : cloudStore.giteeConfig,
  set: (val) => {
    if (activePlatform.value === 'github') cloudStore.saveGithubConfig(val)
    else if (activePlatform.value === 'gitee') cloudStore.saveGiteeConfig(val)
    else cloudStore.saveGitlabConfig(val)
  }
})

const currentUser = computed(() => {
  if (activePlatform.value === 'github') return cloudStore.githubUser
  if (activePlatform.value === 'gitee') return cloudStore.giteeUser
  return cloudStore.gitlabUser
})
const recentGists = computed(() => {
  if (activePlatform.value === 'github') return githubGists.value
  if (activePlatform.value === 'gitee') return giteeGists.value
  return gitlabGists.value
})
const snippets = computed(() => snippetStore.snippets || [])
const selectedSnippet = computed(() => snippets.value.find(s => s.id === selectedSnippetId.value))

const isAutoSyncEnabled = computed(() => cloudStore.autoSyncSettings[activePlatform.value])

// --- Methods ---

const isConnected = (platformId) => {
  if (platformId === 'github') return !!cloudStore.githubUser
  if (platformId === 'gitee') return !!cloudStore.giteeUser
  return !!cloudStore.gitlabUser
}

const showToast = (type, title, message) => {
  resultType.value = type
  resultTitle.value = title
  resultMessage.value = message
  showResult.value = true
  setTimeout(() => { showResult.value = false }, 3000)
}

// Config Saving
const saveConfig = async () => {
  isConnecting.value = true
  try {
    if (activePlatform.value === 'github') {
      await verifyAndSaveGithub()
    } else if (activePlatform.value === 'gitee') {
      await verifyAndSaveGitee()
    } else {
      await verifyAndSaveGitlab()
    }
  } catch (e) {
    showToast('error', '连接失败', e.message)
  } finally {
    isConnecting.value = false
  }
}

const verifyAndSaveGithub = async () => {
  // Store handles save to localstorage, we just need to verify and set user
  const token = cloudStore.githubConfig.token
  const res = await fetch('https://api.github.com/user', {
    headers: { 'Authorization': `token ${token}` }
  })
  if (!res.ok) throw new Error('Token 无效')
  cloudStore.githubUser = await res.json()
  cloudStore.saveGithubConfig(cloudStore.githubConfig) // Persist
  await refreshGists()
  showToast('success', '连接成功', `已连接为 ${cloudStore.githubUser.login}`)
}

const verifyAndSaveGitee = async () => {
  const token = cloudStore.giteeConfig.token
  const res = await fetch(`https://gitee.com/api/v5/user?access_token=${token}`)
  if (!res.ok) throw new Error('Token 无效')
  cloudStore.giteeUser = await res.json()
  cloudStore.saveGiteeConfig(cloudStore.giteeConfig) // Persist
  await refreshGists()
  showToast('success', '连接成功', `已连接为 ${cloudStore.giteeUser.login}`)
}

const verifyAndSaveGitlab = async () => {
  const config = cloudStore.gitlabConfig
  const baseUrl = (config.baseUrl || 'https://gitlab.com').replace(/\/$/, '')
  const res = await fetch(`${baseUrl}/api/v4/user`, {
    headers: { 'PRIVATE-TOKEN': config.token }
  })
  if (!res.ok) throw new Error('GitLab 连接失败，检查 Token 或 URL')
  cloudStore.gitlabUser = await res.json()
  cloudStore.saveGitlabConfig(config)
  await refreshGists()
  showToast('success', '连接成功', `已连接为 ${cloudStore.gitlabUser.username}`)
}

const disconnect = () => {
  if (activePlatform.value === 'github') {
    cloudStore.githubUser = null
    githubGists.value = []
    cloudStore.githubConfig.token = ''
    cloudStore.saveGithubConfig(cloudStore.githubConfig)
  } else if (activePlatform.value === 'gitee') {
    cloudStore.giteeUser = null
    giteeGists.value = []
    cloudStore.giteeConfig.token = ''
    cloudStore.saveGiteeConfig(cloudStore.giteeConfig)
  } else {
    cloudStore.gitlabUser = null
    gitlabGists.value = []
    cloudStore.gitlabConfig.token = ''
    cloudStore.saveGitlabConfig(cloudStore.gitlabConfig)
  }
}

const handleToggleAutoSync = () => {
  cloudStore.toggleAutoSync(activePlatform.value, !isAutoSyncEnabled.value)
  showToast('success', isAutoSyncEnabled.value ? '已开启自动同步' : '已关闭自动同步', 
    isAutoSyncEnabled.value ? '本地修改将自动推送' : '需手动点击同步按钮')
}

// Data Handling
const refreshGists = async () => {
  refreshing.value = true
  try {
    if (activePlatform.value === 'github' && cloudStore.githubUser) {
      const res = await fetch('https://api.github.com/gists?per_page=10', {
        headers: { 'Authorization': `token ${cloudStore.githubConfig.token}` }
      })
      if (res.ok) githubGists.value = await res.json()
    } else if (activePlatform.value === 'gitee' && cloudStore.giteeUser) {
      const res = await fetch(`https://gitee.com/api/v5/gists?access_token=${cloudStore.giteeConfig.token}&page=1&per_page=10`)
      if (res.ok) giteeGists.value = await res.json()
    } else if (activePlatform.value === 'gitlab' && cloudStore.gitlabUser) {
      const baseUrl = (cloudStore.gitlabConfig.baseUrl || 'https://gitlab.com').replace(/\/$/, '')
      const res = await fetch(`${baseUrl}/api/v4/snippets?per_page=10`, {
        headers: { 'PRIVATE-TOKEN': cloudStore.gitlabConfig.token }
      })
      if (res.ok) {
        // Adapt GitLab structure to Gist-like structure for display
        const list = await res.json()
        gitlabGists.value = list.map(item => ({
          id: item.id,
          description: item.title, // GitLab uses title
          html_url: item.web_url,
          updated_at: item.updated_at,
          created_at: item.created_at,
          public: item.visibility === 'public',
          files: { [item.file_name]: { content: null } } // Mock files obj for display count
        }))
      }
    }
  } catch (e) {
    console.error(e)
  } finally {
    refreshing.value = false
  }
}

// Status Helpers using Store
const isSynced = (snippetId) => cloudStore.isSyncedToPlatform(snippetId, activePlatform.value)

const getSyncStatus = (snippetId) => isSynced(snippetId) ? 'synced' : 'unsynced'
const getSyncStatusText = (snippetId) => isSynced(snippetId) ? '已关联云端版本 (点击更新)' : '未同步到当前平台 (点击上传)'
const getSyncStatusIconComponent = (snippetId) => isSynced(snippetId) ? Cloud : Upload
const getSnippetStatusIcon = (snippetId) => isSynced(snippetId) ? '☁️' : '📄'

// Upload/Sync Logic
const handleSync = async () => {
  if (!selectedSnippet.value) return
  isUploading.value = true
  try {
    const filename = uploadFilename.value || getDefaultFilename()
    const description = uploadDescription.value || selectedSnippet.value.title
    const snippetId = selectedSnippet.value.id
    
    // Check global store for sync status
    const existingRemoteId = cloudStore.getSyncStatus(snippetId, activePlatform.value)
    
    let resultRemoteId = null
    
    if (activePlatform.value === 'github') {
      if (existingRemoteId) {
        await updateGithub(existingRemoteId, filename, description)
        resultRemoteId = existingRemoteId
        showToast('success', '更新成功', 'GitHub Gist 已更新')
      } else {
        const newId = await createGithub(filename, description)
        resultRemoteId = newId
        showToast('success', '上传成功', '已创建新的 GitHub Gist')
      }
    } else if (activePlatform.value === 'gitee') {
      if (existingRemoteId) {
        await updateGitee(existingRemoteId, filename, description)
        resultRemoteId = existingRemoteId
        showToast('success', '更新成功', 'Gitee 代码片段已更新')
      } else {
        const newId = await createGitee(filename, description)
        resultRemoteId = newId
        showToast('success', '上传成功', '已创建新的 Gitee 代码片段')
      }
    } else if (activePlatform.value === 'gitlab') {
      // Use the store action directly for GitLab as it's fully implemented there
      const res = await cloudStore.syncSnippet(selectedSnippet.value, 'gitlab')
      if (res) {
          resultRemoteId = res.id
          showToast('success', res.action === 'create' ? '上传成功' : '更新成功', 'GitLab Snippet 已同步')
      }
    }
    
    if (resultRemoteId) {
      cloudStore.updateSyncStatus(snippetId, activePlatform.value, resultRemoteId)
    }

    selectedSnippetId.value = ''
    uploadDescription.value = ''
    uploadFilename.value = ''
    await refreshGists()
    
  } catch (e) {
    showToast('error', '同步失败', e.message)
  } finally {
    isUploading.value = false
  }
}

// API Methods
const createGithub = async (filename, description) => {
  const res = await fetch('https://api.github.com/gists', {
    method: 'POST',
    headers: { 
      'Authorization': `token ${cloudStore.githubConfig.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      description,
      public: cloudStore.githubConfig.visibility === 'public',
      files: { [filename]: { content: selectedSnippet.value.code } }
    })
  })
  if (!res.ok) throw new Error('GitHub 创建失败')
  const data = await res.json()
  return data.id
}

const updateGithub = async (gistId, filename, description) => {
  const res = await fetch(`https://api.github.com/gists/${gistId}`, {
    method: 'PATCH',
    headers: { 
      'Authorization': `token ${cloudStore.githubConfig.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      description,
      files: { [filename]: { content: selectedSnippet.value.code } }
    })
  })
  if (!res.ok) throw new Error('GitHub 更新失败')
  return gistId
}

const createGitee = async (filename, description) => {
  const formData = new FormData()
  formData.append('access_token', cloudStore.giteeConfig.token)
  formData.append('description', description)
  formData.append('public', cloudStore.giteeConfig.visibility === 'public' ? 'true' : 'false')
  formData.append('files[' + filename + ']', selectedSnippet.value.code)
  
  const res = await fetch('https://gitee.com/api/v5/gists', { method: 'POST', body: formData })
  if (!res.ok) throw new Error('Gitee 创建失败')
  const data = await res.json()
  return data.id
}

const updateGitee = async (gistId, filename, description) => {
  const formData = new FormData()
  formData.append('access_token', cloudStore.giteeConfig.token)
  formData.append('description', description)
  formData.append('files[' + filename + ']', selectedSnippet.value.code)
  
  const res = await fetch(`https://gitee.com/api/v5/gists/${gistId}`, { method: 'PATCH', body: formData })
  if (!res.ok) throw new Error('Gitee 更新失败')
  return gistId
}

const importFromGist = async (gist) => {
  isImportingGist.value = gist.id
  try {
    let files = gist.files
    let detailUrl = gist.url
    let headers = {}
    if (activePlatform.value === 'github') headers['Authorization'] = `token ${cloudStore.githubConfig.token}`
    else detailUrl += `?access_token=${cloudStore.giteeConfig.token}`

    const res = await fetch(detailUrl, { headers })
    if(!res.ok) throw new Error('获取详情失败')
    const detail = await res.json()
    files = detail.files
    
    let count = 0
    for(const fname in files) {
      const f = files[fname]
       const snippet = await snippetStore.createSnippet({
        title: gist.description || fname,
        description: `Synced from ${activePlatformData.value.title}: ${fname}`,
        code: f.content,
        language: getExtension(fname, true),
        tags: ['cloud-import'],
        isFavorite: false
      })
      cloudStore.updateSyncStatus(snippet.id, activePlatform.value, gist.id)
      count++
    }
    showToast('success', '导入成功', `已导入并关联 ${count} 个文件`)
  } catch(e) { showToast('error', '导入失败', e.message) } finally { isImportingGist.value = null }
}

const copyLink = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    showToast('success', '已复制', '链接已复制到剪贴板')
  } catch (e) {
    showToast('error', '复制失败', '无法访问剪贴板')
  }
}

const copyGistLink = (snippetId) => {
  const remoteId = cloudStore.getSyncStatus(snippetId, activePlatform.value)
  if (!remoteId) return
  let url = activePlatform.value === 'github' ? `https://gist.github.com/${remoteId}` : ''
  if (!url) {
    const found = recentGists.value.find(g => g.id === remoteId)
    if (found) url = found.html_url
    if (found) url = found.html_url
    else url = `https://gitee.com/gists/${remoteId}` // Try best guess
  }
  
  if (activePlatform.value === 'gitlab' && !url) {
     const found = recentGists.value.find(g => g.id === remoteId)
     if (found) url = found.html_url
     // Can't guess URL easily for private instances
  }
  if (url) copyLink(url)
}

// Helpers
const getDefaultFilename = () => {
  if (!selectedSnippet.value) return ''
  return selectedSnippet.value.title.replace(/\s+/g, '_') + '.' + getExtension(selectedSnippet.value.language, true)
}

const getExtension = (langOrName, isLang = false) => {
  const map = { javascript: 'js', python: 'py', vue: 'vue', html: 'html', css: 'css', json: 'json', markdown: 'md', text: 'txt', typescript: 'ts', rust: 'rs', go: 'go', swift: 'swift', kotlin: 'kt' }
  if(isLang) return map[langOrName.toLowerCase()] || 'txt'
  return langOrName.split('.').pop()
}

const getDescription = (gist) => gist.description || '无描述'
const isPublic = (gist) => gist.public
const getFileCount = (gist) => gist.files ? Object.keys(gist.files).length : 0
const formatDate = (d) => new Date(d).toLocaleDateString()

onMounted(() => {
  cloudStore.init()
  // Try to restore session if token exists
  if (cloudStore.githubConfig.token) verifyAndSaveGithub().catch(()=>{})
  if (cloudStore.githubConfig.token) verifyAndSaveGithub().catch(()=>{})
  if (cloudStore.giteeConfig.token) verifyAndSaveGitee().catch(()=>{})
  if (cloudStore.gitlabConfig.token) verifyAndSaveGitlab().catch(()=>{})
})

watch(selectedSnippetId, () => {
  if(selectedSnippet.value) {
    uploadDescription.value = selectedSnippet.value.title || ''
    uploadFilename.value = ''
  }
})
</script>

<style scoped>
.cloud-sync-panel { padding: 0; height: 100%; display: flex; flex-direction: column; }

/* Platform Selector */
.platform-selector { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
.platform-card { position: relative; display: flex; align-items: center; gap: 16px; padding: 20px; background: var(--color-background-secondary); border: 1px solid var(--color-border); border-radius: 12px; cursor: pointer; transition: all 0.2s ease; }
.platform-card:hover { border-color: var(--color-primary); transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
.platform-card.active { background: linear-gradient(135deg, rgba(var(--color-primary), 0.05), rgba(var(--color-primary), 0.02)); border-color: var(--color-primary); }
.platform-icon-wrapper { padding: 10px; border-radius: 10px; background: var(--color-background); color: var(--color-text-secondary); transition: all 0.2s; }
.platform-card.active .platform-icon-wrapper { background: var(--color-primary); color: white; }
.platform-info { display: flex; flex-direction: column; gap: 4px; }
.platform-name { font-weight: 600; font-size: 15px; color: var(--color-text-primary); }
.platform-status { font-size: 12px; color: var(--color-text-tertiary); display: flex; align-items: center; gap: 4px; }
.platform-status.connected { color: var(--color-success); }
.platform-status.connected::before { content: ''; display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }

/* Panel Header */
.panel-header { margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; }
.panel-header h2 { font-size: 18px; font-weight: 700; margin: 0 0 4px 0; color: var(--color-text-primary); }
.panel-header p { color: var(--color-text-secondary); font-size: 14px; margin: 0; }
.help-link { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--color-primary); text-decoration: none; padding: 6px 12px; background: rgba(var(--color-primary), 0.1); border-radius: 20px; transition: all 0.2s; }
.help-link:hover { background: rgba(var(--color-primary), 0.2); }

/* Config Card */
.config-card, .user-card-compact, .action-card { background: var(--color-background-secondary); border: 1px solid var(--color-border); border-radius: 12px; overflow: hidden; }
.card-body { padding: 24px; }
.input-group { margin-bottom: 20px; }
.input-group label { display: block; font-size: 13px; font-weight: 600; color: var(--color-text-primary); margin-bottom: 8px; }
.badge-required { font-size: 11px; color: var(--color-error); background: rgba(var(--color-error), 0.1); padding: 1px 4px; border-radius: 4px; margin-left: 4px; font-weight: normal; }
.input-wrapper { position: relative; display: flex; align-items: center; }
.input-icon { position: absolute; left: 12px; color: var(--color-text-tertiary); }
.input-wrapper input { width: 100%; padding: 12px 40px 12px 36px; border: 1px solid var(--color-border); border-radius: 8px; background: var(--color-background); color: var(--color-text-primary); font-size: 14px; transition: all 0.2s; }
.input-wrapper input:focus { border-color: var(--color-primary); outline: none; box-shadow: 0 0 0 2px rgba(var(--color-primary), 0.1); }
.toggle-btn { position: absolute; right: 8px; background: none; border: none; color: var(--color-text-tertiary); cursor: pointer; padding: 4px; }
.helper-text { display: flex; align-items: center; gap: 6px; margin-top: 8px; font-size: 12px; color: var(--color-text-tertiary); }
.helper-text a { color: var(--color-primary); text-decoration: none; }
.visibility-selector { display: flex; gap: 12px; }
.visibility-option { flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px; border: 1px solid var(--color-border); border-radius: 8px; background: var(--color-background); color: var(--color-text-secondary); cursor: pointer; font-size: 13px; transition: all 0.2s; }
.visibility-option.selected { background: var(--color-primary); border-color: var(--color-primary); color: white; }

/* Dashboard */
.user-card-compact { display: flex; justify-content: space-between; align-items: center; padding: 12px 20px; margin-bottom: 20px; border: 1px solid var(--color-border); }
.user-profile { display: flex; align-items: center; gap: 12px; }
.avatar { width: 36px; height: 36px; border-radius: 50%; border: 2px solid var(--color-background); box-shadow: 0 0 0 1px var(--color-border); }
.user-details { display: flex; flex-direction: column; }
.username { font-weight: 600; font-size: 14px; color: var(--color-text-primary); }
.sync-status { display: flex; align-items: center; gap: 4px; font-size: 11px; color: var(--color-success); margin-top: 2px; }
.btn-ghost-sm { background: transparent; border: 1px solid transparent; color: var(--color-text-secondary); padding: 6px 10px; border-radius: 6px; cursor: pointer; font-size: 12px; display: flex; align-items: center; gap: 4px; transition: all 0.2s; }
.btn-ghost-sm:hover { background: var(--color-background-tertiary); color: var(--color-error); }

.header-actions { display: flex; align-items: center; gap: 12px; }
.divider-vertical { width: 1px; height: 16px; background: var(--color-border); }

.auto-sync-wrapper { display: flex; align-items: center; gap: 8px; cursor: pointer; user-select: none; }
.auto-sync-wrapper .label { font-size: 12px; color: var(--color-text-secondary); }
.auto-sync-wrapper:hover .label { color: var(--color-text-primary); }

.toggle-switch { width: 32px; height: 18px; background: var(--color-background-tertiary); border-radius: 9px; position: relative; transition: all 0.2s; border: 1px solid var(--color-border); }
.toggle-switch.active { background: var(--color-success); border-color: var(--color-success); }
.toggle-thumb { width: 14px; height: 14px; background: white; border-radius: 50%; position: absolute; top: 1px; left: 1px; transition: all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1); box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.toggle-switch.active .toggle-thumb { transform: translateX(14px); }

.action-grid { display: grid; grid-template-columns: 1fr; gap: 20px; }
@media (min-width: 900px) { .action-grid { grid-template-columns: 4fr 6fr; } }

.card-header-small { padding: 14px 16px; border-bottom: 1px solid var(--color-border); background: var(--color-background-tertiary); display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: var(--color-text-secondary); }

/* Left Upload Panel */
.upload-form { padding: 20px; display: flex; flex-direction: column; gap: 16px; min-height: 300px; }
.select-label { font-size: 12px; font-weight: 600; color: var(--color-text-secondary); margin-bottom: -8px; }
.select-wrapper { position: relative; }
.custom-select { width: 100%; padding: 12px; border: 1px solid var(--color-border); border-radius: 8px; background: var(--color-background); color: var(--color-text-primary); font-size: 14px; appearance: none; cursor: pointer; }
.select-arrow { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); color: var(--color-text-tertiary); pointer-events: none; }
.empty-selection { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--color-text-tertiary); gap: 12px; min-height: 200px; }
.empty-icon-faded { opacity: 0.1; }

.snippet-detail-panel { display: flex; flex-direction: column; gap: 14px; animation: fade-in 0.3s ease; }
.sync-status-indicator { display: flex; align-items: center; gap: 6px; font-size: 12px; padding: 6px 10px; border-radius: 6px; background: var(--color-background-tertiary); }
.sync-status-indicator.synced { color: var(--color-success); background: rgba(var(--color-success), 0.1); }
.sync-status-indicator.unsynced { color: var(--color-text-tertiary); }
.snippet-preview-mini { padding: 12px; background: var(--color-background-tertiary); border-radius: 8px; font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--color-text-secondary); border: 1px solid var(--color-border); max-height: 100px; overflow: hidden; }
.form-row { display: flex; gap: 10px; flex-direction: column; }
.simple-input { width: 100%; padding: 10px; border: 1px solid var(--color-border); border-radius: 8px; background: var(--color-background); color: var(--color-text-primary); font-size: 13px; }
.action-buttons { display: flex; gap: 10px; margin-top: 4px; }
.btn-primary { flex: 1; background: var(--color-primary); color: white; border: none; padding: 12px 16px; border-radius: 8px; font-weight: 600; font-size: 14px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; }
.btn-primary:hover:not(:disabled) { filter: brightness(1.1); transform: translateY(-1px); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-update { background: linear-gradient(135deg, var(--color-success), #10b981); }
.btn-secondary { width: 42px; display: flex; align-items: center; justify-content: center; background: var(--color-background); border: 1px solid var(--color-border); border-radius: 8px; color: var(--color-text-secondary); cursor: pointer; transition: all 0.2s; }
.btn-secondary:hover { border-color: var(--color-primary); color: var(--color-primary); }

/* Right History Panel */
.refresh-btn { margin-left: auto; background: none; border: none; cursor: pointer; color: var(--color-text-tertiary); transition: color 0.2s; }
.refresh-btn:hover { color: var(--color-primary); }
.gist-list-container { max-height: 500px; min-height: 300px; overflow-y: auto; }
.empty-list { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 300px; color: var(--color-text-tertiary); gap: 12px; }
.skeleton-list { padding: 16px; display: flex; flex-direction: column; gap: 16px; }
.skeleton-item { height: 60px; background: var(--color-background-tertiary); border-radius: 8px; animation: pulse 1.5s infinite; }

.gist-item-modern { display: flex; padding: 16px; border-bottom: 1px solid var(--color-border); gap: 14px; transition: background 0.15s; }
.gist-item-modern:last-child { border-bottom: none; }
.gist-item-modern:hover { background: var(--color-background-tertiary); }
.gist-icon-area { color: var(--color-primary); padding-top: 2px; }
.gist-content-area { flex: 1; min-width: 0; }
.gist-main-info { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.gist-title { font-size: 14px; font-weight: 600; color: var(--color-text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.gist-badge { font-size: 10px; padding: 2px 8px; border-radius: 20px; font-weight: 500; }
.gist-badge.public { background: rgba(var(--color-success), 0.1); color: var(--color-success); border: 1px solid rgba(var(--color-success), 0.2); }
.gist-badge.secret { background: rgba(var(--color-warning), 0.1); color: var(--color-warning); border: 1px solid rgba(var(--color-warning), 0.2); }
.gist-sub-info { font-size: 12px; color: var(--color-text-tertiary); display: flex; align-items: center; }
.dot { margin: 0 6px; opacity: 0.5; }
.gist-actions-area { display: flex; align-items: center; gap: 4px; margin-left: 8px; }
.action-btn-mini { width: 32px; height: 32px; border-radius: 6px; color: var(--color-text-secondary); border: none; background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
.action-btn-mini:hover { background: var(--color-background); color: var(--color-primary); box-shadow: 0 2px 8px rgba(0,0,0,0.05); }

/* Animations */
@keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 0.3; } 100% { opacity: 0.6; } }
@keyframes fade-in { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
.full-width { width: 100%; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

/* Toast */
.notification-toast { position: fixed; bottom: 32px; right: 32px; display: flex; gap: 12px; padding: 16px; background: var(--color-background); border: 1px solid var(--color-border); border-radius: 12px; box-shadow: 0 8px 30px rgba(0,0,0,0.15); z-index: 2000; min-width: 320px; animation: slide-up-fade 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.toast-content h4 { margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: var(--color-text-primary); }
.toast-content p { margin: 0; font-size: 13px; color: var(--color-text-secondary); }
.notification-toast.success { border-left: 4px solid var(--color-success); }
.notification-toast.error { border-left: 4px solid var(--color-error); }
.notification-toast.success .toast-icon { color: var(--color-success); }
.notification-toast.error .toast-icon { color: var(--color-error); }
.close-toast { background: none; border: none; color: var(--color-text-tertiary); cursor: pointer; height: fit-content; margin-left: auto; padding: 4px; }
.close-toast:hover { color: var(--color-text-primary); background: var(--color-background-tertiary); border-radius: 4px; }

/* Transitions */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.slide-up-enter-active, .slide-up-leave-active { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.slide-up-enter-from, .slide-up-leave-to { transform: translateY(20px); opacity: 0; }
/* GitLab Specific */
.platform-card.active .platform-icon-wrapper.gitlab { background: #FC6D26; color: white; }
.platform-status.connected.gitlab { color: #FC6D26; }
</style>
