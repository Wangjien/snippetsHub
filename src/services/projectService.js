/**
 * SnippetsHub - 专业代码片段管理工具
 * 
 * @file projectService.js - 项目管理服务
 * @author Noah
 * @description 工作区和项目管理系统，支持文件夹嵌套和项目组织
 * @created 2026-01-30
 * @version 1.0.0
 * 
 * 功能特性:
 * - 工作区概念和管理
 * - 项目文件夹嵌套结构
 * - 项目模板和脚手架
 * - 依赖管理和配置
 * - 项目设置和元数据
 * - 文件监控和同步
 * - 项目搜索和过滤
 * - 导入导出功能
 */

import { ref, reactive, computed } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { writeTextFile, readTextFile, exists, mkdir, readDir, BaseDirectory } from '@tauri-apps/plugin-fs'
import { appDataDir, join } from '@tauri-apps/api/path'

class ProjectService {
  constructor() {
    this.workspaces = reactive([])
    this.currentWorkspace = ref(null)
    this.projects = reactive([])
    this.currentProject = ref(null)
    this.projectTree = reactive({})
    this.isInitialized = ref(false)
    
    // 项目模板配置
    this.projectTemplates = {
      'web-frontend': {
        name: 'Web Frontend',
        description: '前端Web项目模板',
        icon: '🌐',
        structure: {
          'src/': {
            'components/': {},
            'pages/': {},
            'utils/': {},
            'styles/': {},
            'assets/': {}
          },
          'public/': {},
          'tests/': {},
          'docs/': {},
          'package.json': {
            content: JSON.stringify({
              name: 'web-frontend-project',
              version: '1.0.0',
              description: 'Web frontend project',
              main: 'src/index.js',
              scripts: {
                start: 'npm run dev',
                dev: 'vite',
                build: 'vite build',
                test: 'vitest'
              },
              dependencies: {},
              devDependencies: {}
            }, null, 2)
          },
          'README.md': {
            content: '# Web Frontend Project\n\n项目描述\n\n## 安装\n\n```bash\nnpm install\n```\n\n## 运行\n\n```bash\nnpm run dev\n```'
          }
        },
        languages: ['javascript', 'typescript', 'html', 'css'],
        tags: ['web', 'frontend', 'javascript']
      },
      'backend-api': {
        name: 'Backend API',
        description: '后端API项目模板',
        icon: '🔧',
        structure: {
          'src/': {
            'controllers/': {},
            'models/': {},
            'services/': {},
            'middleware/': {},
            'routes/': {},
            'utils/': {}
          },
          'tests/': {},
          'docs/': {},
          'config/': {},
          'package.json': {
            content: JSON.stringify({
              name: 'backend-api-project',
              version: '1.0.0',
              description: 'Backend API project',
              main: 'src/index.js',
              scripts: {
                start: 'node src/index.js',
                dev: 'nodemon src/index.js',
                test: 'jest'
              },
              dependencies: {},
              devDependencies: {}
            }, null, 2)
          }
        },
        languages: ['javascript', 'typescript'],
        tags: ['backend', 'api', 'server']
      },
      'python-data': {
        name: 'Python Data Science',
        description: 'Python数据科学项目模板',
        icon: '📊',
        structure: {
          'src/': {
            'data/': {},
            'models/': {},
            'notebooks/': {},
            'utils/': {},
            'visualization/': {}
          },
          'tests/': {},
          'docs/': {},
          'requirements.txt': {
            content: 'pandas\nnumpy\nmatplotlib\nseaborn\njupyter\nscikit-learn'
          },
          'README.md': {
            content: '# Python Data Science Project\n\n数据科学项目\n\n## 安装\n\n```bash\npip install -r requirements.txt\n```'
          }
        },
        languages: ['python'],
        tags: ['python', 'data-science', 'ml']
      },
      'rust-cli': {
        name: 'Rust CLI',
        description: 'Rust命令行工具项目模板',
        icon: '🦀',
        structure: {
          'src/': {
            'main.rs': {
              content: 'fn main() {\n    println!("Hello, world!");\n}'
            },
            'lib.rs': {
              content: '// Library code here'
            }
          },
          'tests/': {},
          'Cargo.toml': {
            content: `[package]
name = "rust-cli-project"
version = "0.1.0"
edition = "2021"

[dependencies]
clap = "4.0"
serde = { version = "1.0", features = ["derive"] }
tokio = { version = "1.0", features = ["full"] }
`
          },
          'README.md': {
            content: '# Rust CLI Project\n\nRust命令行工具\n\n## 构建\n\n```bash\ncargo build\n```\n\n## 运行\n\n```bash\ncargo run\n```'
          }
        },
        languages: ['rust'],
        tags: ['rust', 'cli', 'tool']
      },
      'mobile-app': {
        name: 'Mobile App',
        description: '移动应用项目模板',
        icon: '📱',
        structure: {
          'src/': {
            'screens/': {},
            'components/': {},
            'services/': {},
            'utils/': {},
            'assets/': {}
          },
          'tests/': {},
          'docs/': {},
          'package.json': {
            content: JSON.stringify({
              name: 'mobile-app-project',
              version: '1.0.0',
              description: 'Mobile app project',
              main: 'src/App.js',
              scripts: {
                start: 'expo start',
                android: 'expo start --android',
                ios: 'expo start --ios',
                web: 'expo start --web'
              },
              dependencies: {},
              devDependencies: {}
            }, null, 2)
          }
        },
        languages: ['javascript', 'typescript'],
        tags: ['mobile', 'react-native', 'app']
      }
    }
  }

  /**
   * 初始化项目管理服务
   */
  async initialize() {
    try {
      // 创建项目数据目录
      await this.setupProjectDirectories()
      
      // 加载工作区和项目
      await this.loadWorkspaces()
      await this.loadProjects()
      
      // 设置默认工作区
      await this.ensureDefaultWorkspace()
      
      this.isInitialized.value = true
      console.log('Project Service initialized successfully')
      
    } catch (error) {
      console.error('Failed to initialize Project service:', error)
      throw error
    }
  }

  /**
   * 设置项目目录结构
   */
  async setupProjectDirectories() {
    try {
      const appDir = await appDataDir()
      const projectsDir = await join(appDir, 'projects')
      const workspacesDir = await join(appDir, 'workspaces')
      
      // 创建目录
      if (!(await exists(projectsDir))) {
        await mkdir(projectsDir, { recursive: true })
      }
      
      if (!(await exists(workspacesDir))) {
        await mkdir(workspacesDir, { recursive: true })
      }
      
      console.log('Project directories setup complete')
    } catch (error) {
      console.error('Failed to setup project directories:', error)
      throw error
    }
  }

  /**
   * 加载工作区列表
   */
  async loadWorkspaces() {
    try {
      const workspacesData = await invoke('get_workspaces')
      this.workspaces.splice(0, this.workspaces.length, ...workspacesData)
      
      // 如果有当前工作区ID，设置当前工作区
      const currentWorkspaceId = localStorage.getItem('currentWorkspaceId')
      if (currentWorkspaceId) {
        const workspace = this.workspaces.find(w => w.id === currentWorkspaceId)
        if (workspace) {
          this.currentWorkspace.value = workspace
        }
      }
      
    } catch (error) {
      console.warn('Failed to load workspaces:', error)
      // 如果数据库中没有工作区，创建默认工作区
      this.workspaces.splice(0)
    }
  }

  /**
   * 加载项目列表
   */
  async loadProjects() {
    try {
      const projectsData = await invoke('get_projects')
      this.projects.splice(0, this.projects.length, ...projectsData)
      
      // 构建项目树结构
      this.buildProjectTree()
      
    } catch (error) {
      console.warn('Failed to load projects:', error)
      this.projects.splice(0)
    }
  }

  /**
   * 确保存在默认工作区
   */
  async ensureDefaultWorkspace() {
    if (this.workspaces.length === 0) {
      const defaultWorkspace = await this.createWorkspace({
        name: '默认工作区',
        description: '默认的代码片段工作区',
        color: '#89b4fa',
        isDefault: true
      })
      
      this.currentWorkspace.value = defaultWorkspace
    } else if (!this.currentWorkspace.value) {
      // 设置第一个工作区为当前工作区
      this.currentWorkspace.value = this.workspaces[0]
    }
  }

  /**
   * 创建工作区
   */
  async createWorkspace(workspaceData) {
    try {
      const workspace = {
        id: `workspace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: workspaceData.name,
        description: workspaceData.description || '',
        color: workspaceData.color || '#89b4fa',
        isDefault: workspaceData.isDefault || false,
        settings: workspaceData.settings || {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      // 保存到数据库
      await invoke('create_workspace', { workspace })
      
      // 添加到本地列表
      this.workspaces.push(workspace)
      
      console.log('Workspace created:', workspace.name)
      return workspace
      
    } catch (error) {
      console.error('Failed to create workspace:', error)
      throw error
    }
  }

  /**
   * 更新工作区
   */
  async updateWorkspace(workspaceId, updates) {
    try {
      const workspace = this.workspaces.find(w => w.id === workspaceId)
      if (!workspace) {
        throw new Error('Workspace not found')
      }
      
      // 更新本地数据
      Object.assign(workspace, updates, {
        updatedAt: new Date().toISOString()
      })
      
      // 保存到数据库
      await invoke('update_workspace', { 
        workspaceId, 
        updates: {
          ...updates,
          updatedAt: workspace.updatedAt
        }
      })
      
      console.log('Workspace updated:', workspace.name)
      return workspace
      
    } catch (error) {
      console.error('Failed to update workspace:', error)
      throw error
    }
  }

  /**
   * 删除工作区
   */
  async deleteWorkspace(workspaceId) {
    try {
      const workspace = this.workspaces.find(w => w.id === workspaceId)
      if (!workspace) {
        throw new Error('Workspace not found')
      }
      
      if (workspace.isDefault) {
        throw new Error('Cannot delete default workspace')
      }
      
      // 删除工作区中的所有项目
      const workspaceProjects = this.projects.filter(p => p.workspaceId === workspaceId)
      for (const project of workspaceProjects) {
        await this.deleteProject(project.id)
      }
      
      // 从数据库删除
      await invoke('delete_workspace', { workspaceId })
      
      // 从本地列表移除
      const index = this.workspaces.findIndex(w => w.id === workspaceId)
      if (index !== -1) {
        this.workspaces.splice(index, 1)
      }
      
      // 如果删除的是当前工作区，切换到默认工作区
      if (this.currentWorkspace.value?.id === workspaceId) {
        this.currentWorkspace.value = this.workspaces.find(w => w.isDefault) || this.workspaces[0]
      }
      
      console.log('Workspace deleted:', workspace.name)
      
    } catch (error) {
      console.error('Failed to delete workspace:', error)
      throw error
    }
  }

  /**
   * 切换当前工作区
   */
  async switchWorkspace(workspaceId) {
    const workspace = this.workspaces.find(w => w.id === workspaceId)
    if (!workspace) {
      throw new Error('Workspace not found')
    }
    
    this.currentWorkspace.value = workspace
    localStorage.setItem('currentWorkspaceId', workspaceId)
    
    // 重新加载项目
    await this.loadProjects()
    
    console.log('Switched to workspace:', workspace.name)
  }

  /**
   * 创建项目
   */
  async createProject(projectData) {
    try {
      const project = {
        id: `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        workspaceId: projectData.workspaceId || this.currentWorkspace.value?.id,
        name: projectData.name,
        description: projectData.description || '',
        type: projectData.type || 'general',
        template: projectData.template || null,
        parentId: projectData.parentId || null,
        path: projectData.path || '',
        color: projectData.color || '#89b4fa',
        icon: projectData.icon || '📁',
        tags: projectData.tags || [],
        settings: projectData.settings || {},
        metadata: projectData.metadata || {},
        isFolder: projectData.isFolder || false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      // 如果使用模板，创建项目结构
      if (project.template && this.projectTemplates[project.template]) {
        await this.createProjectFromTemplate(project, project.template)
      }
      
      // 保存到数据库
      await invoke('create_project', { project })
      
      // 添加到本地列表
      this.projects.push(project)
      
      // 重新构建项目树
      this.buildProjectTree()
      
      console.log('Project created:', project.name)
      return project
      
    } catch (error) {
      console.error('Failed to create project:', error)
      throw error
    }
  }

  /**
   * 从模板创建项目
   */
  async createProjectFromTemplate(project, templateName) {
    const template = this.projectTemplates[templateName]
    if (!template) {
      throw new Error(`Template not found: ${templateName}`)
    }
    
    try {
      const appDir = await appDataDir()
      const projectDir = await join(appDir, 'projects', project.id)
      
      // 创建项目目录
      await mkdir(projectDir, { recursive: true })
      
      // 创建项目结构
      await this.createProjectStructure(projectDir, template.structure)
      
      // 更新项目元数据
      project.metadata = {
        ...project.metadata,
        template: templateName,
        languages: template.languages,
        structure: template.structure
      }
      
      project.tags = [...project.tags, ...template.tags]
      
      console.log(`Project created from template: ${templateName}`)
      
    } catch (error) {
      console.error('Failed to create project from template:', error)
      throw error
    }
  }

  /**
   * 创建项目文件结构
   */
  async createProjectStructure(basePath, structure) {
    for (const [name, content] of Object.entries(structure)) {
      const itemPath = await join(basePath, name)
      
      if (name.endsWith('/')) {
        // 目录
        await mkdir(itemPath, { recursive: true })
        if (typeof content === 'object' && content !== null) {
          await this.createProjectStructure(itemPath, content)
        }
      } else if (typeof content === 'object' && content.content) {
        // 文件
        await writeTextFile(name, content.content, {
          baseDir: BaseDirectory.AppData,
          dir: `projects/${basePath.split('/').pop()}`
        })
      } else if (typeof content === 'object') {
        // 目录（没有尾随斜杠）
        await mkdir(itemPath, { recursive: true })
        await this.createProjectStructure(itemPath, content)
      }
    }
  }

  /**
   * 更新项目
   */
  async updateProject(projectId, updates) {
    try {
      const project = this.projects.find(p => p.id === projectId)
      if (!project) {
        throw new Error('Project not found')
      }
      
      // 更新本地数据
      Object.assign(project, updates, {
        updatedAt: new Date().toISOString()
      })
      
      // 保存到数据库
      await invoke('update_project', { 
        projectId, 
        updates: {
          ...updates,
          updatedAt: project.updatedAt
        }
      })
      
      // 重新构建项目树
      this.buildProjectTree()
      
      console.log('Project updated:', project.name)
      return project
      
    } catch (error) {
      console.error('Failed to update project:', error)
      throw error
    }
  }

  /**
   * 删除项目
   */
  async deleteProject(projectId) {
    try {
      const project = this.projects.find(p => p.id === projectId)
      if (!project) {
        throw new Error('Project not found')
      }
      
      // 删除子项目
      const childProjects = this.projects.filter(p => p.parentId === projectId)
      for (const child of childProjects) {
        await this.deleteProject(child.id)
      }
      
      // 删除项目文件夹（如果存在）
      try {
        const appDir = await appDataDir()
        const projectDir = await join(appDir, 'projects', projectId)
        if (await exists(projectDir)) {
          await invoke('remove_dir_all', { path: projectDir })
        }
      } catch (error) {
        console.warn('Failed to delete project directory:', error)
      }
      
      // 从数据库删除
      await invoke('delete_project', { projectId })
      
      // 从本地列表移除
      const index = this.projects.findIndex(p => p.id === projectId)
      if (index !== -1) {
        this.projects.splice(index, 1)
      }
      
      // 重新构建项目树
      this.buildProjectTree()
      
      console.log('Project deleted:', project.name)
      
    } catch (error) {
      console.error('Failed to delete project:', error)
      throw error
    }
  }

  /**
   * 构建项目树结构
   */
  buildProjectTree() {
    const tree = {}
    const workspaceProjects = this.projects.filter(p => 
      p.workspaceId === this.currentWorkspace.value?.id
    )
    
    // 首先添加根级项目
    const rootProjects = workspaceProjects.filter(p => !p.parentId)
    
    const buildNode = (project) => {
      const children = workspaceProjects.filter(p => p.parentId === project.id)
      return {
        ...project,
        children: children.map(buildNode)
      }
    }
    
    tree.projects = rootProjects.map(buildNode)
    
    Object.assign(this.projectTree, tree)
  }

  /**
   * 移动项目
   */
  async moveProject(projectId, newParentId) {
    try {
      const project = this.projects.find(p => p.id === projectId)
      if (!project) {
        throw new Error('Project not found')
      }
      
      // 检查循环引用
      if (newParentId && this.wouldCreateCycle(projectId, newParentId)) {
        throw new Error('Cannot move project: would create circular reference')
      }
      
      // 更新父级ID
      await this.updateProject(projectId, { parentId: newParentId })
      
      console.log('Project moved:', project.name)
      
    } catch (error) {
      console.error('Failed to move project:', error)
      throw error
    }
  }

  /**
   * 检查是否会创建循环引用
   */
  wouldCreateCycle(projectId, newParentId) {
    if (!newParentId) return false
    
    let currentId = newParentId
    while (currentId) {
      if (currentId === projectId) return true
      
      const parent = this.projects.find(p => p.id === currentId)
      currentId = parent?.parentId
    }
    
    return false
  }

  /**
   * 搜索项目
   */
  searchProjects(query, options = {}) {
    const {
      workspaceId = this.currentWorkspace.value?.id,
      type = null,
      tags = [],
      includeContent = false
    } = options
    
    let results = this.projects.filter(p => p.workspaceId === workspaceId)
    
    if (query) {
      const lowerQuery = query.toLowerCase()
      results = results.filter(p => 
        p.name.toLowerCase().includes(lowerQuery) ||
        p.description.toLowerCase().includes(lowerQuery) ||
        p.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      )
    }
    
    if (type) {
      results = results.filter(p => p.type === type)
    }
    
    if (tags.length > 0) {
      results = results.filter(p => 
        tags.some(tag => p.tags.includes(tag))
      )
    }
    
    return results
  }

  /**
   * 获取项目路径
   */
  getProjectPath(projectId) {
    const path = []
    let currentId = projectId
    
    while (currentId) {
      const project = this.projects.find(p => p.id === currentId)
      if (!project) break
      
      path.unshift(project.name)
      currentId = project.parentId
    }
    
    return path.join(' / ')
  }

  /**
   * 导出项目
   */
  async exportProject(projectId, format = 'json') {
    try {
      const project = this.projects.find(p => p.id === projectId)
      if (!project) {
        throw new Error('Project not found')
      }
      
      // 获取项目的所有子项目
      const getAllChildren = (parentId) => {
        const children = this.projects.filter(p => p.parentId === parentId)
        const result = [...children]
        
        for (const child of children) {
          result.push(...getAllChildren(child.id))
        }
        
        return result
      }
      
      const allProjects = [project, ...getAllChildren(projectId)]
      
      // 获取项目相关的代码片段
      const snippets = await invoke('get_snippets_by_project', { projectId })
      
      const exportData = {
        project: {
          ...project,
          children: allProjects.filter(p => p.id !== projectId)
        },
        snippets,
        exportedAt: new Date().toISOString(),
        version: '1.0.0'
      }
      
      switch (format) {
        case 'json':
          return JSON.stringify(exportData, null, 2)
          
        case 'markdown':
          return this.generateMarkdownExport(exportData)
          
        default:
          throw new Error(`Unsupported export format: ${format}`)
      }
      
    } catch (error) {
      console.error('Failed to export project:', error)
      throw error
    }
  }

  /**
   * 生成Markdown格式的项目导出
   */
  generateMarkdownExport(exportData) {
    const { project, snippets } = exportData
    
    let markdown = `# ${project.name}\n\n`
    
    if (project.description) {
      markdown += `${project.description}\n\n`
    }
    
    if (project.tags.length > 0) {
      markdown += `**标签:** ${project.tags.join(', ')}\n\n`
    }
    
    markdown += `**创建时间:** ${new Date(project.createdAt).toLocaleString()}\n\n`
    
    if (snippets.length > 0) {
      markdown += `## 代码片段 (${snippets.length})\n\n`
      
      for (const snippet of snippets) {
        markdown += `### ${snippet.title}\n\n`
        
        if (snippet.description) {
          markdown += `${snippet.description}\n\n`
        }
        
        markdown += `**语言:** ${snippet.language}\n\n`
        
        if (snippet.tags.length > 0) {
          markdown += `**标签:** ${snippet.tags.join(', ')}\n\n`
        }
        
        markdown += '```' + snippet.language + '\n'
        markdown += snippet.code + '\n'
        markdown += '```\n\n'
        
        markdown += '---\n\n'
      }
    }
    
    return markdown
  }

  /**
   * 导入项目
   */
  async importProject(data, format = 'json') {
    try {
      let projectData
      
      switch (format) {
        case 'json':
          projectData = typeof data === 'string' ? JSON.parse(data) : data
          break
          
        default:
          throw new Error(`Unsupported import format: ${format}`)
      }
      
      // 创建主项目
      const mainProject = await this.createProject({
        ...projectData.project,
        workspaceId: this.currentWorkspace.value?.id,
        id: undefined, // 生成新ID
        parentId: null
      })
      
      // 创建子项目
      if (projectData.project.children) {
        for (const child of projectData.project.children) {
          await this.createProject({
            ...child,
            workspaceId: this.currentWorkspace.value?.id,
            parentId: mainProject.id,
            id: undefined // 生成新ID
          })
        }
      }
      
      // 导入代码片段
      if (projectData.snippets) {
        for (const snippet of projectData.snippets) {
          await invoke('create_snippet', {
            snippet: {
              ...snippet,
              id: undefined, // 生成新ID
              projectId: mainProject.id
            }
          })
        }
      }
      
      console.log('Project imported successfully:', mainProject.name)
      return mainProject
      
    } catch (error) {
      console.error('Failed to import project:', error)
      throw error
    }
  }

  /**
   * 获取项目统计信息
   */
  getProjectStats(projectId) {
    const project = this.projects.find(p => p.id === projectId)
    if (!project) return null
    
    const getAllChildren = (parentId) => {
      const children = this.projects.filter(p => p.parentId === parentId)
      const result = [...children]
      
      for (const child of children) {
        result.push(...getAllChildren(child.id))
      }
      
      return result
    }
    
    const children = getAllChildren(projectId)
    const folders = children.filter(p => p.isFolder)
    const subProjects = children.filter(p => !p.isFolder)
    
    return {
      totalChildren: children.length,
      folders: folders.length,
      projects: subProjects.length,
      languages: [...new Set(children.flatMap(p => p.metadata?.languages || []))],
      tags: [...new Set(children.flatMap(p => p.tags))],
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    }
  }

  /**
   * 获取可用的项目模板
   */
  getProjectTemplates() {
    return Object.entries(this.projectTemplates).map(([key, template]) => ({
      id: key,
      ...template
    }))
  }

  /**
   * 获取当前工作区的项目
   */
  getCurrentWorkspaceProjects() {
    return this.projects.filter(p => p.workspaceId === this.currentWorkspace.value?.id)
  }

  /**
   * 获取项目树
   */
  getProjectTree() {
    return this.projectTree
  }
}

// 创建全局项目管理服务实例
export const projectService = new ProjectService()

// 导出项目管理相关的组合式函数
export function useProjectManagement() {
  return {
    projectService,
    workspaces: projectService.workspaces,
    currentWorkspace: projectService.currentWorkspace,
    projects: projectService.projects,
    currentProject: projectService.currentProject,
    projectTree: projectService.projectTree,
    isInitialized: projectService.isInitialized,
    
    // 工作区方法
    createWorkspace: (data) => projectService.createWorkspace(data),
    updateWorkspace: (id, updates) => projectService.updateWorkspace(id, updates),
    deleteWorkspace: (id) => projectService.deleteWorkspace(id),
    switchWorkspace: (id) => projectService.switchWorkspace(id),
    
    // 项目方法
    createProject: (data) => projectService.createProject(data),
    updateProject: (id, updates) => projectService.updateProject(id, updates),
    deleteProject: (id) => projectService.deleteProject(id),
    moveProject: (id, parentId) => projectService.moveProject(id, parentId),
    
    // 工具方法
    searchProjects: (query, options) => projectService.searchProjects(query, options),
    getProjectPath: (id) => projectService.getProjectPath(id),
    exportProject: (id, format) => projectService.exportProject(id, format),
    importProject: (data, format) => projectService.importProject(data, format),
    getProjectStats: (id) => projectService.getProjectStats(id),
    getProjectTemplates: () => projectService.getProjectTemplates(),
    getCurrentWorkspaceProjects: () => projectService.getCurrentWorkspaceProjects(),
    getProjectTree: () => projectService.getProjectTree()
  }
}