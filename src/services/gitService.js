/**
 * SnippetsHub - 专业代码片段管理工具
 * 
 * @file gitService.js - Git版本控制服务
 * @author Noah
 * @description Git集成服务，提供版本控制、提交历史管理和协作功能
 * @created 2026-01-30
 * @version 1.0.0
 * 
 * 功能特性:
 * - Git仓库管理和初始化
 * - 提交历史查看和管理
 * - 分支创建和切换
 * - 文件状态跟踪
 * - 差异对比和合并
 * - 远程仓库同步
 * - 冲突解决工具
 * - 代码审查功能
 */

import { ref, reactive } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { Command } from '@tauri-apps/plugin-shell'
import { writeTextFile, readTextFile, exists, mkdir, BaseDirectory } from '@tauri-apps/plugin-fs'
import { appDataDir, join } from '@tauri-apps/api/path'

class GitService {
  constructor() {
    this.repositories = reactive([])
    this.currentRepository = ref(null)
    this.branches = reactive([])
    this.currentBranch = ref(null)
    this.commits = reactive([])
    this.fileStatus = reactive([])
    this.isInitialized = ref(false)
    this.gitAvailable = ref(false)
    
    // Git配置
    this.gitConfig = reactive({
      userName: '',
      userEmail: '',
      defaultBranch: 'main',
      autoCommit: false,
      autoSync: false,
      commitMessageTemplate: ''
    })
  }

  /**
   * 初始化Git服务
   */
  async initialize() {
    try {
      // 检查Git是否可用
      await this.checkGitAvailability()
      
      if (!this.gitAvailable.value) {
        console.warn('Git is not available on this system')
        return
      }
      
      // 加载Git配置
      await this.loadGitConfig()
      
      // 加载仓库列表
      await this.loadRepositories()
      
      // 设置默认仓库
      await this.setupDefaultRepository()
      
      this.isInitialized.value = true
      console.log('Git Service initialized successfully')
      
    } catch (error) {
      console.error('Failed to initialize Git service:', error)
      throw error
    }
  }

  /**
   * 检查Git可用性
   */
  async checkGitAvailability() {
    try {
      const isAvailable = await invoke('check_command_available', {
        command: 'git'
      })
      
      if (isAvailable) {
        // 获取Git版本
        const versionCommand = Command.create('git', ['--version'])
        const result = await versionCommand.execute()
        
        this.gitAvailable.value = true
        console.log('Git available:', result.stdout.trim())
      } else {
        this.gitAvailable.value = false
      }
    } catch (error) {
      console.warn('Git availability check failed:', error)
      this.gitAvailable.value = false
    }
  }

  /**
   * 加载Git配置
   */
  async loadGitConfig() {
    try {
      // 从本地存储加载配置
      const savedConfig = localStorage.getItem('gitConfig')
      if (savedConfig) {
        Object.assign(this.gitConfig, JSON.parse(savedConfig))
      }
      
      // 尝试从Git全局配置获取用户信息
      if (!this.gitConfig.userName || !this.gitConfig.userEmail) {
        try {
          const nameCommand = Command.create('git', ['config', '--global', 'user.name'])
          const nameResult = await nameCommand.execute()
          if (nameResult.code === 0) {
            this.gitConfig.userName = nameResult.stdout.trim()
          }
          
          const emailCommand = Command.create('git', ['config', '--global', 'user.email'])
          const emailResult = await emailCommand.execute()
          if (emailResult.code === 0) {
            this.gitConfig.userEmail = emailResult.stdout.trim()
          }
        } catch (error) {
          console.warn('Failed to get Git global config:', error)
        }
      }
      
    } catch (error) {
      console.warn('Failed to load Git config:', error)
    }
  }

  /**
   * 保存Git配置
   */
  async saveGitConfig() {
    try {
      localStorage.setItem('gitConfig', JSON.stringify(this.gitConfig))
      
      // 如果有当前仓库，更新仓库配置
      if (this.currentRepository.value) {
        await this.setRepositoryConfig(
          this.currentRepository.value.path,
          this.gitConfig.userName,
          this.gitConfig.userEmail
        )
      }
      
    } catch (error) {
      console.error('Failed to save Git config:', error)
      throw error
    }
  }

  /**
   * 加载仓库列表
   */
  async loadRepositories() {
    try {
      const reposData = await invoke('get_git_repositories')
      this.repositories.splice(0, this.repositories.length, ...reposData)
      
    } catch (error) {
      console.warn('Failed to load repositories:', error)
      this.repositories.splice(0)
    }
  }

  /**
   * 设置默认仓库
   */
  async setupDefaultRepository() {
    try {
      const appDir = await appDataDir()
      const defaultRepoPath = await join(appDir, 'git-repo')
      
      // 检查默认仓库是否存在
      let defaultRepo = this.repositories.find(r => r.path === defaultRepoPath)
      
      if (!defaultRepo) {
        // 创建默认仓库
        defaultRepo = await this.initializeRepository(defaultRepoPath, {
          name: 'SnippetsHub Repository',
          description: 'SnippetsHub代码片段仓库',
          isDefault: true
        })
      }
      
      // 设置为当前仓库
      await this.switchRepository(defaultRepo.id)
      
    } catch (error) {
      console.error('Failed to setup default repository:', error)
    }
  }

  /**
   * 初始化Git仓库
   */
  async initializeRepository(path, options = {}) {
    try {
      // 创建目录
      if (!(await exists(path))) {
        await mkdir(path, { recursive: true })
      }
      
      // 初始化Git仓库
      const initCommand = Command.create('git', ['init'], { cwd: path })
      const initResult = await initCommand.execute()
      
      if (initResult.code !== 0) {
        throw new Error(`Git init failed: ${initResult.stderr}`)
      }
      
      // 设置仓库配置
      if (this.gitConfig.userName && this.gitConfig.userEmail) {
        await this.setRepositoryConfig(path, this.gitConfig.userName, this.gitConfig.userEmail)
      }
      
      // 设置默认分支
      const defaultBranch = this.gitConfig.defaultBranch || 'main'
      const branchCommand = Command.create('git', ['checkout', '-b', defaultBranch], { cwd: path })
      await branchCommand.execute()
      
      // 创建初始提交
      const readmePath = await join(path, 'README.md')
      const readmeContent = `# ${options.name || 'SnippetsHub Repository'}\n\n${options.description || '代码片段仓库'}\n\n创建时间: ${new Date().toLocaleString()}\n`
      
      await writeTextFile('README.md', readmeContent, {
        baseDir: BaseDirectory.AppData,
        dir: path.split('/').pop()
      })
      
      // 添加并提交README
      await this.addFiles(path, ['README.md'])
      await this.commit(path, 'Initial commit', { allowEmpty: true })
      
      // 保存仓库信息
      const repository = {
        id: `repo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: options.name || 'New Repository',
        description: options.description || '',
        path,
        isDefault: options.isDefault || false,
        remotes: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      await invoke('create_git_repository', { repository })
      this.repositories.push(repository)
      
      console.log('Git repository initialized:', repository.name)
      return repository
      
    } catch (error) {
      console.error('Failed to initialize repository:', error)
      throw error
    }
  }

  /**
   * 设置仓库配置
   */
  async setRepositoryConfig(repoPath, userName, userEmail) {
    try {
      const nameCommand = Command.create('git', ['config', 'user.name', userName], { cwd: repoPath })
      await nameCommand.execute()
      
      const emailCommand = Command.create('git', ['config', 'user.email', userEmail], { cwd: repoPath })
      await emailCommand.execute()
      
    } catch (error) {
      console.error('Failed to set repository config:', error)
      throw error
    }
  }

  /**
   * 切换仓库
   */
  async switchRepository(repositoryId) {
    const repository = this.repositories.find(r => r.id === repositoryId)
    if (!repository) {
      throw new Error('Repository not found')
    }
    
    this.currentRepository.value = repository
    
    // 加载仓库状态
    await this.loadRepositoryStatus()
    
    console.log('Switched to repository:', repository.name)
  }

  /**
   * 加载仓库状态
   */
  async loadRepositoryStatus() {
    if (!this.currentRepository.value) return
    
    try {
      const repoPath = this.currentRepository.value.path
      
      // 加载分支列表
      await this.loadBranches(repoPath)
      
      // 加载当前分支
      await this.loadCurrentBranch(repoPath)
      
      // 加载提交历史
      await this.loadCommits(repoPath)
      
      // 加载文件状态
      await this.loadFileStatus(repoPath)
      
    } catch (error) {
      console.error('Failed to load repository status:', error)
    }
  }

  /**
   * 加载分支列表
   */
  async loadBranches(repoPath) {
    try {
      const branchCommand = Command.create('git', ['branch', '-a'], { cwd: repoPath })
      const result = await branchCommand.execute()
      
      if (result.code === 0) {
        const branches = result.stdout
          .split('\n')
          .map(line => line.trim())
          .filter(line => line && !line.startsWith('remotes/origin/HEAD'))
          .map(line => {
            const isCurrent = line.startsWith('*')
            const name = line.replace(/^\*\s*/, '').replace(/^remotes\/origin\//, '')
            const isRemote = line.includes('remotes/')
            
            return {
              name,
              isCurrent,
              isRemote,
              fullName: line.replace(/^\*\s*/, '')
            }
          })
        
        this.branches.splice(0, this.branches.length, ...branches)
      }
      
    } catch (error) {
      console.error('Failed to load branches:', error)
    }
  }

  /**
   * 加载当前分支
   */
  async loadCurrentBranch(repoPath) {
    try {
      const branchCommand = Command.create('git', ['branch', '--show-current'], { cwd: repoPath })
      const result = await branchCommand.execute()
      
      if (result.code === 0) {
        const branchName = result.stdout.trim()
        this.currentBranch.value = this.branches.find(b => b.name === branchName) || null
      }
      
    } catch (error) {
      console.error('Failed to load current branch:', error)
    }
  }

  /**
   * 加载提交历史
   */
  async loadCommits(repoPath, limit = 50) {
    try {
      const logCommand = Command.create('git', [
        'log',
        '--oneline',
        '--graph',
        '--decorate',
        '--all',
        `-${limit}`,
        '--pretty=format:%H|%an|%ae|%ad|%s',
        '--date=iso'
      ], { cwd: repoPath })
      
      const result = await logCommand.execute()
      
      if (result.code === 0) {
        const commits = result.stdout
          .split('\n')
          .filter(line => line.trim())
          .map(line => {
            const [hash, author, email, date, message] = line.split('|')
            return {
              hash: hash?.trim(),
              shortHash: hash?.trim().substring(0, 7),
              author: author?.trim(),
              email: email?.trim(),
              date: new Date(date?.trim()),
              message: message?.trim(),
              files: []
            }
          })
          .filter(commit => commit.hash)
        
        this.commits.splice(0, this.commits.length, ...commits)
      }
      
    } catch (error) {
      console.error('Failed to load commits:', error)
    }
  }

  /**
   * 加载文件状态
   */
  async loadFileStatus(repoPath) {
    try {
      const statusCommand = Command.create('git', ['status', '--porcelain'], { cwd: repoPath })
      const result = await statusCommand.execute()
      
      if (result.code === 0) {
        const files = result.stdout
          .split('\n')
          .filter(line => line.trim())
          .map(line => {
            const status = line.substring(0, 2)
            const filePath = line.substring(3)
            
            return {
              path: filePath,
              status,
              staged: status[0] !== ' ' && status[0] !== '?',
              modified: status[1] !== ' ',
              untracked: status === '??',
              deleted: status.includes('D'),
              renamed: status.includes('R'),
              copied: status.includes('C')
            }
          })
        
        this.fileStatus.splice(0, this.fileStatus.length, ...files)
      }
      
    } catch (error) {
      console.error('Failed to load file status:', error)
    }
  }

  /**
   * 添加文件到暂存区
   */
  async addFiles(repoPath, files) {
    try {
      const addCommand = Command.create('git', ['add', ...files], { cwd: repoPath })
      const result = await addCommand.execute()
      
      if (result.code !== 0) {
        throw new Error(`Git add failed: ${result.stderr}`)
      }
      
      // 重新加载文件状态
      await this.loadFileStatus(repoPath)
      
      return true
      
    } catch (error) {
      console.error('Failed to add files:', error)
      throw error
    }
  }

  /**
   * 提交更改
   */
  async commit(repoPath, message, options = {}) {
    try {
      const args = ['commit', '-m', message]
      
      if (options.allowEmpty) {
        args.push('--allow-empty')
      }
      
      if (options.amend) {
        args.push('--amend')
      }
      
      const commitCommand = Command.create('git', args, { cwd: repoPath })
      const result = await commitCommand.execute()
      
      if (result.code !== 0) {
        throw new Error(`Git commit failed: ${result.stderr}`)
      }
      
      // 重新加载仓库状态
      await this.loadRepositoryStatus()
      
      console.log('Commit created:', message)
      return result.stdout
      
    } catch (error) {
      console.error('Failed to commit:', error)
      throw error
    }
  }

  /**
   * 创建分支
   */
  async createBranch(repoPath, branchName, fromBranch = null) {
    try {
      const args = ['checkout', '-b', branchName]
      if (fromBranch) {
        args.push(fromBranch)
      }
      
      const branchCommand = Command.create('git', args, { cwd: repoPath })
      const result = await branchCommand.execute()
      
      if (result.code !== 0) {
        throw new Error(`Git branch creation failed: ${result.stderr}`)
      }
      
      // 重新加载分支列表
      await this.loadBranches(repoPath)
      await this.loadCurrentBranch(repoPath)
      
      console.log('Branch created:', branchName)
      return true
      
    } catch (error) {
      console.error('Failed to create branch:', error)
      throw error
    }
  }

  /**
   * 切换分支
   */
  async switchBranch(repoPath, branchName) {
    try {
      const checkoutCommand = Command.create('git', ['checkout', branchName], { cwd: repoPath })
      const result = await checkoutCommand.execute()
      
      if (result.code !== 0) {
        throw new Error(`Git checkout failed: ${result.stderr}`)
      }
      
      // 重新加载当前分支和文件状态
      await this.loadCurrentBranch(repoPath)
      await this.loadFileStatus(repoPath)
      
      console.log('Switched to branch:', branchName)
      return true
      
    } catch (error) {
      console.error('Failed to switch branch:', error)
      throw error
    }
  }

  /**
   * 删除分支
   */
  async deleteBranch(repoPath, branchName, force = false) {
    try {
      const args = ['branch', force ? '-D' : '-d', branchName]
      const deleteCommand = Command.create('git', args, { cwd: repoPath })
      const result = await deleteCommand.execute()
      
      if (result.code !== 0) {
        throw new Error(`Git branch deletion failed: ${result.stderr}`)
      }
      
      // 重新加载分支列表
      await this.loadBranches(repoPath)
      
      console.log('Branch deleted:', branchName)
      return true
      
    } catch (error) {
      console.error('Failed to delete branch:', error)
      throw error
    }
  }

  /**
   * 合并分支
   */
  async mergeBranch(repoPath, branchName, options = {}) {
    try {
      const args = ['merge', branchName]
      
      if (options.noFastForward) {
        args.push('--no-ff')
      }
      
      if (options.squash) {
        args.push('--squash')
      }
      
      const mergeCommand = Command.create('git', args, { cwd: repoPath })
      const result = await mergeCommand.execute()
      
      if (result.code !== 0) {
        // 检查是否有冲突
        if (result.stderr.includes('CONFLICT')) {
          await this.loadFileStatus(repoPath)
          throw new Error(`Merge conflicts detected. Please resolve conflicts and commit.`)
        } else {
          throw new Error(`Git merge failed: ${result.stderr}`)
        }
      }
      
      // 重新加载仓库状态
      await this.loadRepositoryStatus()
      
      console.log('Branch merged:', branchName)
      return result.stdout
      
    } catch (error) {
      console.error('Failed to merge branch:', error)
      throw error
    }
  }

  /**
   * 获取文件差异
   */
  async getFileDiff(repoPath, filePath, staged = false) {
    try {
      const args = ['diff']
      if (staged) {
        args.push('--staged')
      }
      args.push(filePath)
      
      const diffCommand = Command.create('git', args, { cwd: repoPath })
      const result = await diffCommand.execute()
      
      return result.stdout
      
    } catch (error) {
      console.error('Failed to get file diff:', error)
      return ''
    }
  }

  /**
   * 获取提交差异
   */
  async getCommitDiff(repoPath, commitHash) {
    try {
      const diffCommand = Command.create('git', ['show', commitHash], { cwd: repoPath })
      const result = await diffCommand.execute()
      
      return result.stdout
      
    } catch (error) {
      console.error('Failed to get commit diff:', error)
      return ''
    }
  }

  /**
   * 添加远程仓库
   */
  async addRemote(repoPath, name, url) {
    try {
      const remoteCommand = Command.create('git', ['remote', 'add', name, url], { cwd: repoPath })
      const result = await remoteCommand.execute()
      
      if (result.code !== 0) {
        throw new Error(`Failed to add remote: ${result.stderr}`)
      }
      
      console.log('Remote added:', name, url)
      return true
      
    } catch (error) {
      console.error('Failed to add remote:', error)
      throw error
    }
  }

  /**
   * 推送到远程仓库
   */
  async push(repoPath, remote = 'origin', branch = null) {
    try {
      const args = ['push', remote]
      if (branch) {
        args.push(branch)
      }
      
      const pushCommand = Command.create('git', args, { cwd: repoPath })
      const result = await pushCommand.execute()
      
      if (result.code !== 0) {
        throw new Error(`Git push failed: ${result.stderr}`)
      }
      
      console.log('Pushed to remote:', remote)
      return result.stdout
      
    } catch (error) {
      console.error('Failed to push:', error)
      throw error
    }
  }

  /**
   * 从远程仓库拉取
   */
  async pull(repoPath, remote = 'origin', branch = null) {
    try {
      const args = ['pull', remote]
      if (branch) {
        args.push(branch)
      }
      
      const pullCommand = Command.create('git', args, { cwd: repoPath })
      const result = await pullCommand.execute()
      
      if (result.code !== 0) {
        throw new Error(`Git pull failed: ${result.stderr}`)
      }
      
      // 重新加载仓库状态
      await this.loadRepositoryStatus()
      
      console.log('Pulled from remote:', remote)
      return result.stdout
      
    } catch (error) {
      console.error('Failed to pull:', error)
      throw error
    }
  }

  /**
   * 重置文件
   */
  async resetFile(repoPath, filePath, hard = false) {
    try {
      const args = ['checkout']
      if (hard) {
        args.push('HEAD')
      }
      args.push(filePath)
      
      const resetCommand = Command.create('git', args, { cwd: repoPath })
      const result = await resetCommand.execute()
      
      if (result.code !== 0) {
        throw new Error(`Git reset failed: ${result.stderr}`)
      }
      
      // 重新加载文件状态
      await this.loadFileStatus(repoPath)
      
      console.log('File reset:', filePath)
      return true
      
    } catch (error) {
      console.error('Failed to reset file:', error)
      throw error
    }
  }

  /**
   * 获取仓库统计信息
   */
  async getRepositoryStats(repoPath) {
    try {
      // 获取提交数量
      const commitCountCommand = Command.create('git', ['rev-list', '--count', 'HEAD'], { cwd: repoPath })
      const commitCountResult = await commitCountCommand.execute()
      const commitCount = commitCountResult.code === 0 ? parseInt(commitCountResult.stdout.trim()) : 0
      
      // 获取贡献者数量
      const contributorsCommand = Command.create('git', ['shortlog', '-sn'], { cwd: repoPath })
      const contributorsResult = await contributorsCommand.execute()
      const contributors = contributorsResult.code === 0 
        ? contributorsResult.stdout.split('\n').filter(line => line.trim()).length 
        : 0
      
      // 获取文件数量
      const fileCountCommand = Command.create('git', ['ls-files'], { cwd: repoPath })
      const fileCountResult = await fileCountCommand.execute()
      const fileCount = fileCountResult.code === 0 
        ? fileCountResult.stdout.split('\n').filter(line => line.trim()).length 
        : 0
      
      return {
        commits: commitCount,
        contributors,
        files: fileCount,
        branches: this.branches.length,
        lastCommit: this.commits[0]?.date || null
      }
      
    } catch (error) {
      console.error('Failed to get repository stats:', error)
      return {
        commits: 0,
        contributors: 0,
        files: 0,
        branches: 0,
        lastCommit: null
      }
    }
  }

  /**
   * 自动提交代码片段
   */
  async autoCommitSnippet(snippet) {
    if (!this.gitConfig.autoCommit || !this.currentRepository.value) {
      return false
    }
    
    try {
      const repoPath = this.currentRepository.value.path
      const fileName = `snippets/${snippet.id}.md`
      const filePath = await join(repoPath, fileName)
      
      // 创建snippets目录
      const snippetsDir = await join(repoPath, 'snippets')
      if (!(await exists(snippetsDir))) {
        await mkdir(snippetsDir, { recursive: true })
      }
      
      // 生成Markdown内容
      const content = this.generateSnippetMarkdown(snippet)
      
      // 写入文件
      await writeTextFile(fileName, content, {
        baseDir: BaseDirectory.AppData,
        dir: `git-repo`
      })
      
      // 添加到Git
      await this.addFiles(repoPath, [fileName])
      
      // 提交
      const message = snippet.id ? 
        `Update snippet: ${snippet.title}` : 
        `Add snippet: ${snippet.title}`
      
      await this.commit(repoPath, message)
      
      console.log('Auto-committed snippet:', snippet.title)
      return true
      
    } catch (error) {
      console.error('Failed to auto-commit snippet:', error)
      return false
    }
  }

  /**
   * 生成代码片段的Markdown内容
   */
  generateSnippetMarkdown(snippet) {
    let content = `# ${snippet.title}\n\n`
    
    if (snippet.description) {
      content += `${snippet.description}\n\n`
    }
    
    content += `**语言:** ${snippet.language}\n\n`
    
    if (snippet.tags && snippet.tags.length > 0) {
      content += `**标签:** ${snippet.tags.join(', ')}\n\n`
    }
    
    content += `**创建时间:** ${new Date(snippet.createdAt).toLocaleString()}\n\n`
    content += `**更新时间:** ${new Date(snippet.updatedAt).toLocaleString()}\n\n`
    
    content += '## 代码\n\n'
    content += '```' + snippet.language + '\n'
    content += snippet.code + '\n'
    content += '```\n'
    
    return content
  }
}

// 创建全局Git服务实例
export const gitService = new GitService()

// 导出Git相关的组合式函数
export function useGitIntegration() {
  return {
    gitService,
    repositories: gitService.repositories,
    currentRepository: gitService.currentRepository,
    branches: gitService.branches,
    currentBranch: gitService.currentBranch,
    commits: gitService.commits,
    fileStatus: gitService.fileStatus,
    gitConfig: gitService.gitConfig,
    isInitialized: gitService.isInitialized,
    gitAvailable: gitService.gitAvailable,
    
    // 仓库管理
    initializeRepository: (path, options) => gitService.initializeRepository(path, options),
    switchRepository: (id) => gitService.switchRepository(id),
    loadRepositoryStatus: () => gitService.loadRepositoryStatus(),
    
    // 文件操作
    addFiles: (files) => gitService.addFiles(gitService.currentRepository.value?.path, files),
    commit: (message, options) => gitService.commit(gitService.currentRepository.value?.path, message, options),
    resetFile: (filePath, hard) => gitService.resetFile(gitService.currentRepository.value?.path, filePath, hard),
    
    // 分支操作
    createBranch: (name, from) => gitService.createBranch(gitService.currentRepository.value?.path, name, from),
    switchBranch: (name) => gitService.switchBranch(gitService.currentRepository.value?.path, name),
    deleteBranch: (name, force) => gitService.deleteBranch(gitService.currentRepository.value?.path, name, force),
    mergeBranch: (name, options) => gitService.mergeBranch(gitService.currentRepository.value?.path, name, options),
    
    // 差异和历史
    getFileDiff: (filePath, staged) => gitService.getFileDiff(gitService.currentRepository.value?.path, filePath, staged),
    getCommitDiff: (hash) => gitService.getCommitDiff(gitService.currentRepository.value?.path, hash),
    
    // 远程操作
    addRemote: (name, url) => gitService.addRemote(gitService.currentRepository.value?.path, name, url),
    push: (remote, branch) => gitService.push(gitService.currentRepository.value?.path, remote, branch),
    pull: (remote, branch) => gitService.pull(gitService.currentRepository.value?.path, remote, branch),
    
    // 工具方法
    getRepositoryStats: () => gitService.getRepositoryStats(gitService.currentRepository.value?.path),
    autoCommitSnippet: (snippet) => gitService.autoCommitSnippet(snippet),
    saveGitConfig: () => gitService.saveGitConfig()
  }
}