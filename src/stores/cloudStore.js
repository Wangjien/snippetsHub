/**
 * SnippetsHub - 代码片段管理工具
 * 
 * @file cloudStore.js - 云同步状态管理
 * @author Noah
 * @description 负责代码片段在 GitHub, Gitee, GitLab 等平台的同步与管理
 * @created 2026-01-23
 * @modified 2026-02-03
 * @version 1.0.0
 * 
 * 功能特性:
 * - 多平台 OAuth 配置管理
 * - Gist/Snippet 创建与更新
 * - 同步状态跟踪与持久化
 * - 自动同步配置
 * - 平台特定的 API 封装
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCloudStore = defineStore('cloud', () => {
    // Sync Map: { [snippetId]: { github: 'gist_id', gitee: 'gist_id', gitlab: 'snippet_id', lastSync: timestamp } }
    const syncMap = ref({})

    const githubConfig = ref({ token: '', visibility: 'secret' })
    const giteeConfig = ref({ token: '', visibility: 'private' })
    const gitlabConfig = ref({ token: '', visibility: 'private', baseUrl: 'https://gitlab.com' })

    const githubUser = ref(null)
    const giteeUser = ref(null)
    const gitlabUser = ref(null)

    // Auto Sync Settings
    const autoSyncSettings = ref({ github: false, gitee: false, gitlab: false })

    // Initialize
    const init = () => {
        // Load Sync Map
        try {
            const map = localStorage.getItem('snippetshub_sync_map')
            if (map) syncMap.value = JSON.parse(map)
        } catch (e) {
            console.error('Failed to load sync map', e)
        }

        // Load Configs
        const gh = localStorage.getItem('github-config')
        if (gh) githubConfig.value = JSON.parse(gh)

        const gt = localStorage.getItem('gitee-config')
        if (gt) giteeConfig.value = JSON.parse(gt)

        const gl = localStorage.getItem('gitlab-config')
        if (gl) gitlabConfig.value = { baseUrl: 'https://gitlab.com', ...JSON.parse(gl) }

        const autoSync = localStorage.getItem('auto_sync_settings')
        if (autoSync) autoSyncSettings.value = JSON.parse(autoSync)
    }

    // Actions
    const updateSyncStatus = (snippetId, platform, remoteId) => {
        if (!syncMap.value[snippetId]) syncMap.value[snippetId] = {}
        syncMap.value[snippetId][platform] = remoteId
        syncMap.value[snippetId].lastSync = Date.now()
        localStorage.setItem('snippetshub_sync_map', JSON.stringify(syncMap.value))
    }

    const getSyncStatus = (snippetId, platform) => {
        return syncMap.value[snippetId]?.[platform]
    }

    const isSynced = (snippetId) => {
        // Check if synced to ANY platform
        if (!snippetId || !syncMap.value[snippetId]) return false
        return !!(syncMap.value[snippetId].github || syncMap.value[snippetId].gitee || syncMap.value[snippetId].gitlab)
    }

    const isSyncedToPlatform = (snippetId, platform) => {
        return !!syncMap.value[snippetId]?.[platform]
    }

    // Config Saving
    const saveGithubConfig = (config) => {
        githubConfig.value = config
        localStorage.setItem('github-config', JSON.stringify(config))
    }

    const saveGiteeConfig = (config) => {
        giteeConfig.value = config
        localStorage.setItem('gitee-config', JSON.stringify(config))
    }

    const saveGitlabConfig = (config) => {
        gitlabConfig.value = config
        localStorage.setItem('gitlab-config', JSON.stringify(config))
    }

    const toggleAutoSync = (platform, enabled) => {
        autoSyncSettings.value[platform] = enabled
        localStorage.setItem('auto_sync_settings', JSON.stringify(autoSyncSettings.value))
    }

    // --- API Actions ---

    // GitHub API
    const createGithub = async (snippet, config) => {
        const filename = snippet.title.replace(/\s+/g, '_') + '.' + getExtension(snippet.language, true)
        const res = await fetch('https://api.github.com/gists', {
            method: 'POST',
            headers: {
                'Authorization': `token ${config.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                description: snippet.description || snippet.title,
                public: config.visibility === 'public',
                files: { [filename]: { content: snippet.code } }
            })
        })
        if (!res.ok) throw new Error('GitHub 创建失败')
        const data = await res.json()
        return data.id
    }

    const updateGithub = async (gistId, snippet, config) => {
        const filename = snippet.title.replace(/\s+/g, '_') + '.' + getExtension(snippet.language, true)
        const res = await fetch(`https://api.github.com/gists/${gistId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `token ${config.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                description: snippet.description || snippet.title,
                files: { [filename]: { content: snippet.code } }
            })
        })
        if (!res.ok) throw new Error('GitHub 更新失败')
        return gistId
    }

    // Gitee API
    const createGitee = async (snippet, config) => {
        const filename = snippet.title.replace(/\s+/g, '_') + '.' + getExtension(snippet.language, true)
        const formData = new FormData()
        formData.append('access_token', config.token)
        formData.append('description', snippet.description || snippet.title)
        formData.append('public', config.visibility === 'public' ? 'true' : 'false')
        formData.append('files[' + filename + ']', snippet.code)

        const res = await fetch('https://gitee.com/api/v5/gists', { method: 'POST', body: formData })
        if (!res.ok) throw new Error('Gitee 创建失败')
        const data = await res.json()
        return data.id
    }

    const updateGitee = async (gistId, snippet, config) => {
        const filename = snippet.title.replace(/\s+/g, '_') + '.' + getExtension(snippet.language, true)
        const formData = new FormData()
        formData.append('access_token', config.token)
        formData.append('description', snippet.description || snippet.title)
        formData.append('files[' + filename + ']', snippet.code)

        const res = await fetch(`https://gitee.com/api/v5/gists/${gistId}`, { method: 'PATCH', body: formData })
        if (!res.ok) throw new Error('Gitee 更新失败')
        return gistId
    }

    // GitLab API
    const createGitlab = async (snippet, config) => {
        const filename = snippet.title.replace(/\s+/g, '_') + '.' + getExtension(snippet.language, true)
        const baseUrl = (config.baseUrl || 'https://gitlab.com').replace(/\/$/, '')
        const res = await fetch(`${baseUrl}/api/v4/snippets`, {
            method: 'POST',
            headers: {
                'PRIVATE-TOKEN': config.token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: snippet.title,
                description: snippet.description || snippet.title,
                visibility: config.visibility,
                files: [{ file_path: filename, content: snippet.code }]
            })
        })
        if (!res.ok) throw new Error('GitLab 创建失败')
        const data = await res.json()
        return data.id
    }

    const updateGitlab = async (snippetId, snippet, config) => {
        const filename = snippet.title.replace(/\s+/g, '_') + '.' + getExtension(snippet.language, true)
        const baseUrl = (config.baseUrl || 'https://gitlab.com').replace(/\/$/, '')
        const res = await fetch(`${baseUrl}/api/v4/snippets/${snippetId}`, {
            method: 'PUT',
            headers: {
                'PRIVATE-TOKEN': config.token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: snippet.title,
                description: snippet.description || snippet.title,
                files: [{ action: 'update', file_path: filename, content: snippet.code }]
            })
        })
        if (!res.ok) throw new Error('GitLab 更新失败')
        return snippetId
    }

    // Main Action: Sync Snippet
    const syncSnippet = async (snippet, platform) => {
        let config, resultId = null
        const existingRemoteId = getSyncStatus(snippet.id, platform)

        if (platform === 'github') {
            config = githubConfig.value
            if (!config.token) throw new Error(`未配置 GitHub Token`)
            resultId = existingRemoteId
                ? await updateGithub(existingRemoteId, snippet, config)
                : await createGithub(snippet, config)
        } else if (platform === 'gitee') {
            config = giteeConfig.value
            if (!config.token) throw new Error(`未配置 Gitee Token`)
            resultId = existingRemoteId
                ? await updateGitee(existingRemoteId, snippet, config)
                : await createGitee(snippet, config)
        } else if (platform === 'gitlab') {
            config = gitlabConfig.value
            if (!config.token) throw new Error(`未配置 GitLab Token`)
            resultId = existingRemoteId
                ? await updateGitlab(existingRemoteId, snippet, config)
                : await createGitlab(snippet, config)
        }

        if (resultId) {
            updateSyncStatus(snippet.id, platform, resultId)
            return { action: existingRemoteId ? 'update' : 'create', id: resultId }
        }
    }

    // Helper
    const getExtension = (langOrName, isLang = false) => {
        const map = { javascript: 'js', python: 'py', vue: 'vue', html: 'html', css: 'css', json: 'json', markdown: 'md', text: 'txt', typescript: 'ts', rust: 'rs', go: 'go', swift: 'swift', kotlin: 'kt' }
        if (isLang) return map[langOrName.toLowerCase()] || 'txt'
        return langOrName.split('.').pop()
    }

    return {
        syncMap,
        githubConfig,
        giteeConfig,
        gitlabConfig,
        githubUser,
        giteeUser,
        gitlabUser,
        init,
        updateSyncStatus,
        getSyncStatus,
        isSynced,
        isSyncedToPlatform,
        saveGithubConfig,
        saveGiteeConfig,
        saveGitlabConfig,
        toggleAutoSync,
        autoSyncSettings,
        syncSnippet
    }
})
