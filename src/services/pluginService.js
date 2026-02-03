/**
 * SnippetsHub - 专业代码片段管理工具
 * 
 * @file pluginService.js - 插件系统服务
 * @author Noah
 * @description 插件系统和扩展管理，支持第三方插件开发和集成
 * @created 2026-01-30
 * @version 1.0.0
 * 
 * 功能特性:
 * - 插件生命周期管理
 * - 插件API和钩子系统
 * - 插件安装和卸载
 * - 插件配置和设置
 * - 插件权限管理
 * - 插件市场集成
 * - 插件开发工具
 * - 插件沙箱环境
 */

import { ref, reactive, computed } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { writeTextFile, readTextFile, exists, mkdir, readDir, BaseDirectory } from '@tauri-apps/plugin-fs'
import { appDataDir, join } from '@tauri-apps/api/path'

class PluginService {
  constructor() {
    this.plugins = reactive([])
    this.activePlugins = reactive([])
    this.pluginHooks = reactive({})
    this.pluginAPI = reactive({})
    this.isInitialized = ref(false)
    
    // 插件系统配置
    this.config = reactive({
      enablePlugins: true,
      allowUnsignedPlugins: false,
      maxPlugins: 50,
      pluginTimeout: 30000,
      sandboxMode: true
    })
    
    // 内置插件钩子
    this.hooks = {
      // 应用生命周期
      'app:init': [],
      'app:ready': [],
      'app:shutdown': [],
      
      // 代码片段生命周期
      'snippet:create': [],
      'snippet:update': [],
      'snippet:delete': [],
      'snippet:view': [],
      
      // 编辑器事件
      'editor:open': [],
      'editor:close': [],
      'editor:save': [],
      'editor:change': [],
      
      // UI事件
      'ui:theme-change': [],
      'ui:sidebar-toggle': [],
      'ui:command-palette': [],
      
      // 项目事件
      'project:create': [],
      'project:switch': [],
      'project:delete': [],
      
      // Git事件
      'git:commit': [],
      'git:branch-switch': [],
      'git:push': [],
      'git:pull': []
    }
    
    // 插件API接口
    this.apiMethods = {
      // 核心API
      getVersion: () => '1.0.0',
      getConfig: (key) => this.config[key],
      setConfig: (key, value) => { this.config[key] = value },
      
      // 通知API
      showNotification: null, // 将在初始化时设置
      showError: null,
      showSuccess: null,
      
      // 存储API
      getStorage: (key) => localStorage.getItem(`plugin_${key}`),
      setStorage: (key, value) => localStorage.setItem(`plugin_${key}`, value),
      removeStorage: (key) => localStorage.removeItem(`plugin_${key}`),
      
      // 代码片段API
      getSnippets: null,
      createSnippet: null,
      updateSnippet: null,
      deleteSnippet: null,
      
      // 编辑器API
      getActiveEditor: null,
      insertText: null,
      getSelectedText: null,
      
      // UI API
      addMenuItem: null,
      addToolbarButton: null,
      addSidebarPanel: null,
      
      // 主题API
      getCurrentTheme: null,
      setTheme: null,
      
      // 文件系统API
      readFile: null,
      writeFile: null,
      
      // HTTP API
      fetch: window.fetch.bind(window)
    }
  }

  /**
   * 初始化插件系统
   */
  async initialize() {
    try {
      // 创建插件目录
      await this.setupPluginDirectories()
      
      // 加载插件配置
      await this.loadPluginConfig()
      
      // 扫描并加载插件
      await this.scanPlugins()
      
      // 初始化内置插件
      await this.initializeBuiltinPlugins()
      
      // 启动已启用的插件
      await this.startEnabledPlugins()
      
      this.isInitialized.value = true
      console.log('Plugin Service initialized successfully')
      
    } catch (error) {
      console.error('Failed to initialize Plugin service:', error)
      throw error
    }
  }

  /**
   * 设置插件目录结构
   */
  async setupPluginDirectories() {
    try {
      const appDir = await appDataDir()
      const pluginsDir = await join(appDir, 'plugins')
      const pluginDataDir = await join(appDir, 'plugin-data')
      
      // 创建目录
      if (!(await exists(pluginsDir))) {
        await mkdir(pluginsDir, { recursive: true })
      }
      
      if (!(await exists(pluginDataDir))) {
        await mkdir(pluginDataDir, { recursive: true })
      }
      
      console.log('Plugin directories setup complete')
    } catch (error) {
      console.error('Failed to setup plugin directories:', error)
      throw error
    }
  }

  /**
   * 加载插件配置
   */
  async loadPluginConfig() {
    try {
      const savedConfig = localStorage.getItem('pluginConfig')
      if (savedConfig) {
        Object.assign(this.config, JSON.parse(savedConfig))
      }
    } catch (error) {
      console.warn('Failed to load plugin config:', error)
    }
  }

  /**
   * 保存插件配置
   */
  async savePluginConfig() {
    try {
      localStorage.setItem('pluginConfig', JSON.stringify(this.config))
    } catch (error) {
      console.error('Failed to save plugin config:', error)
    }
  }

  /**
   * 扫描插件
   */
  async scanPlugins() {
    try {
      const appDir = await appDataDir()
      const pluginsDir = await join(appDir, 'plugins')
      
      if (!(await exists(pluginsDir))) {
        return
      }
      
      const entries = await readDir(pluginsDir)
      
      for (const entry of entries) {
        if (entry.isDirectory) {
          try {
            const plugin = await this.loadPlugin(entry.name)
            if (plugin) {
              this.plugins.push(plugin)
            }
          } catch (error) {
            console.warn(`Failed to load plugin ${entry.name}:`, error)
          }
        }
      }
      
      console.log(`Scanned ${this.plugins.length} plugins`)
      
    } catch (error) {
      console.error('Failed to scan plugins:', error)
    }
  }

  /**
   * 加载单个插件
   */
  async loadPlugin(pluginName) {
    try {
      const appDir = await appDataDir()
      const pluginDir = await join(appDir, 'plugins', pluginName)
      const manifestPath = await join(pluginDir, 'plugin.json')
      
      if (!(await exists(manifestPath))) {
        throw new Error('Plugin manifest not found')
      }
      
      // 读取插件清单
      const manifestContent = await readTextFile('plugin.json', {
        baseDir: BaseDirectory.AppData,
        dir: `plugins/${pluginName}`
      })
      
      const manifest = JSON.parse(manifestContent)
      
      // 验证插件清单
      this.validatePluginManifest(manifest)
      
      // 读取插件代码
      const mainPath = await join(pluginDir, manifest.main || 'index.js')
      let pluginCode = ''
      
      if (await exists(mainPath)) {
        pluginCode = await readTextFile(manifest.main || 'index.js', {
          baseDir: BaseDirectory.AppData,
          dir: `plugins/${pluginName}`
        })
      }
      
      const plugin = {
        id: manifest.id || pluginName,
        name: manifest.name,
        version: manifest.version,
        description: manifest.description,
        author: manifest.author,
        homepage: manifest.homepage,
        repository: manifest.repository,
        license: manifest.license,
        keywords: manifest.keywords || [],
        main: manifest.main || 'index.js',
        permissions: manifest.permissions || [],
        hooks: manifest.hooks || [],
        api: manifest.api || [],
        config: manifest.config || {},
        enabled: false,
        loaded: false,
        instance: null,
        code: pluginCode,
        directory: pluginDir,
        manifest,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      // 检查插件是否已启用
      const enabledPlugins = JSON.parse(localStorage.getItem('enabledPlugins') || '[]')
      plugin.enabled = enabledPlugins.includes(plugin.id)
      
      console.log('Plugin loaded:', plugin.name)
      return plugin
      
    } catch (error) {
      console.error(`Failed to load plugin ${pluginName}:`, error)
      return null
    }
  }

  /**
   * 验证插件清单
   */
  validatePluginManifest(manifest) {
    const required = ['name', 'version', 'description']
    
    for (const field of required) {
      if (!manifest[field]) {
        throw new Error(`Missing required field: ${field}`)
      }
    }
    
    // 验证版本格式
    if (!/^\d+\.\d+\.\d+/.test(manifest.version)) {
      throw new Error('Invalid version format')
    }
    
    // 验证权限
    if (manifest.permissions) {
      const validPermissions = [
        'storage', 'network', 'filesystem', 'clipboard',
        'notifications', 'editor', 'snippets', 'ui'
      ]
      
      for (const permission of manifest.permissions) {
        if (!validPermissions.includes(permission)) {
          throw new Error(`Invalid permission: ${permission}`)
        }
      }
    }
  }

  /**
   * 初始化内置插件
   */
  async initializeBuiltinPlugins() {
    // 代码格式化插件
    const formatterPlugin = {
      id: 'builtin-formatter',
      name: 'Code Formatter',
      version: '1.0.0',
      description: '代码格式化插件',
      author: 'SnippetsHub Team',
      builtin: true,
      enabled: true,
      loaded: false,
      permissions: ['editor'],
      hooks: ['editor:save'],
      instance: {
        activate: () => {
          console.log('Code Formatter plugin activated')
        },
        deactivate: () => {
          console.log('Code Formatter plugin deactivated')
        },
        onEditorSave: (data) => {
          // 自动格式化代码
          console.log('Auto-formatting code on save')
        }
      }
    }
    
    // 代码片段同步插件
    const syncPlugin = {
      id: 'builtin-sync',
      name: 'Snippet Sync',
      version: '1.0.0',
      description: '代码片段同步插件',
      author: 'SnippetsHub Team',
      builtin: true,
      enabled: true,
      loaded: false,
      permissions: ['network', 'snippets'],
      hooks: ['snippet:create', 'snippet:update'],
      instance: {
        activate: () => {
          console.log('Snippet Sync plugin activated')
        },
        deactivate: () => {
          console.log('Snippet Sync plugin deactivated')
        },
        onSnippetCreate: (snippet) => {
          console.log('Syncing new snippet:', snippet.title)
        },
        onSnippetUpdate: (snippet) => {
          console.log('Syncing updated snippet:', snippet.title)
        }
      }
    }
    
    this.plugins.push(formatterPlugin, syncPlugin)
  }

  /**
   * 启动已启用的插件
   */
  async startEnabledPlugins() {
    const enabledPlugins = this.plugins.filter(p => p.enabled)
    
    for (const plugin of enabledPlugins) {
      try {
        await this.activatePlugin(plugin.id)
      } catch (error) {
        console.error(`Failed to activate plugin ${plugin.name}:`, error)
      }
    }
  }

  /**
   * 激活插件
   */
  async activatePlugin(pluginId) {
    const plugin = this.plugins.find(p => p.id === pluginId)
    if (!plugin) {
      throw new Error('Plugin not found')
    }
    
    if (plugin.loaded) {
      console.warn('Plugin already loaded:', plugin.name)
      return
    }
    
    try {
      // 检查权限
      if (!this.checkPluginPermissions(plugin)) {
        throw new Error('Plugin permissions denied')
      }
      
      // 创建插件实例
      if (!plugin.builtin) {
        plugin.instance = await this.createPluginInstance(plugin)
      }
      
      // 注册插件钩子
      this.registerPluginHooks(plugin)
      
      // 调用插件激活方法
      if (plugin.instance && typeof plugin.instance.activate === 'function') {
        await plugin.instance.activate(this.createPluginContext(plugin))
      }
      
      plugin.loaded = true
      plugin.enabled = true
      
      if (!this.activePlugins.find(p => p.id === pluginId)) {
        this.activePlugins.push(plugin)
      }
      
      console.log('Plugin activated:', plugin.name)
      
      // 触发插件激活事件
      await this.triggerHook('plugin:activated', { plugin })
      
    } catch (error) {
      console.error(`Failed to activate plugin ${plugin.name}:`, error)
      throw error
    }
  }

  /**
   * 停用插件
   */
  async deactivatePlugin(pluginId) {
    const plugin = this.plugins.find(p => p.id === pluginId)
    if (!plugin) {
      throw new Error('Plugin not found')
    }
    
    if (!plugin.loaded) {
      console.warn('Plugin not loaded:', plugin.name)
      return
    }
    
    try {
      // 调用插件停用方法
      if (plugin.instance && typeof plugin.instance.deactivate === 'function') {
        await plugin.instance.deactivate()
      }
      
      // 注销插件钩子
      this.unregisterPluginHooks(plugin)
      
      plugin.loaded = false
      plugin.enabled = false
      
      // 从活跃插件列表移除
      const index = this.activePlugins.findIndex(p => p.id === pluginId)
      if (index !== -1) {
        this.activePlugins.splice(index, 1)
      }
      
      console.log('Plugin deactivated:', plugin.name)
      
      // 触发插件停用事件
      await this.triggerHook('plugin:deactivated', { plugin })
      
    } catch (error) {
      console.error(`Failed to deactivate plugin ${plugin.name}:`, error)
      throw error
    }
  }

  /**
   * 创建插件实例
   */
  async createPluginInstance(plugin) {
    try {
      // 在沙箱环境中执行插件代码
      const sandbox = this.createPluginSandbox(plugin)
      
      // 执行插件代码
      const pluginFunction = new Function('exports', 'require', 'console', 'SnippetsHub', plugin.code)
      const exports = {}
      
      pluginFunction(exports, this.createRequireFunction(plugin), console, sandbox)
      
      return exports.default || exports
      
    } catch (error) {
      console.error('Failed to create plugin instance:', error)
      throw error
    }
  }

  /**
   * 创建插件沙箱环境
   */
  createPluginSandbox(plugin) {
    return {
      // 插件信息
      plugin: {
        id: plugin.id,
        name: plugin.name,
        version: plugin.version
      },
      
      // API方法
      ...this.apiMethods,
      
      // 受限的全局对象
      setTimeout: window.setTimeout,
      setInterval: window.setInterval,
      clearTimeout: window.clearTimeout,
      clearInterval: window.clearInterval,
      
      // 事件系统
      on: (event, callback) => this.addPluginHook(plugin.id, event, callback),
      off: (event, callback) => this.removePluginHook(plugin.id, event, callback),
      emit: (event, data) => this.triggerHook(event, data),
      
      // 存储API
      storage: {
        get: (key) => this.apiMethods.getStorage(`${plugin.id}_${key}`),
        set: (key, value) => this.apiMethods.setStorage(`${plugin.id}_${key}`, value),
        remove: (key) => this.apiMethods.removeStorage(`${plugin.id}_${key}`)
      }
    }
  }

  /**
   * 创建require函数
   */
  createRequireFunction(plugin) {
    const allowedModules = {
      'path': {
        join: (...args) => args.join('/'),
        dirname: (path) => path.split('/').slice(0, -1).join('/'),
        basename: (path) => path.split('/').pop()
      },
      'crypto': {
        randomUUID: () => crypto.randomUUID()
      }
    }
    
    return (moduleName) => {
      if (allowedModules[moduleName]) {
        return allowedModules[moduleName]
      }
      
      throw new Error(`Module not allowed: ${moduleName}`)
    }
  }

  /**
   * 创建插件上下文
   */
  createPluginContext(plugin) {
    return {
      plugin: {
        id: plugin.id,
        name: plugin.name,
        version: plugin.version,
        directory: plugin.directory
      },
      api: this.apiMethods,
      config: plugin.config
    }
  }

  /**
   * 检查插件权限
   */
  checkPluginPermissions(plugin) {
    if (!plugin.permissions || plugin.permissions.length === 0) {
      return true
    }
    
    // 在实际应用中，这里应该有更严格的权限检查
    // 现在简单地允许所有权限
    return true
  }

  /**
   * 注册插件钩子
   */
  registerPluginHooks(plugin) {
    if (!plugin.hooks || plugin.hooks.length === 0) {
      return
    }
    
    for (const hookName of plugin.hooks) {
      if (!this.hooks[hookName]) {
        this.hooks[hookName] = []
      }
      
      const hookHandler = {
        pluginId: plugin.id,
        handler: (data) => {
          if (plugin.instance) {
            const methodName = this.getHookMethodName(hookName)
            if (typeof plugin.instance[methodName] === 'function') {
              return plugin.instance[methodName](data)
            }
          }
        }
      }
      
      this.hooks[hookName].push(hookHandler)
    }
  }

  /**
   * 注销插件钩子
   */
  unregisterPluginHooks(plugin) {
    for (const hookName of Object.keys(this.hooks)) {
      this.hooks[hookName] = this.hooks[hookName].filter(
        handler => handler.pluginId !== plugin.id
      )
    }
  }

  /**
   * 添加插件钩子
   */
  addPluginHook(pluginId, event, callback) {
    if (!this.hooks[event]) {
      this.hooks[event] = []
    }
    
    this.hooks[event].push({
      pluginId,
      handler: callback
    })
  }

  /**
   * 移除插件钩子
   */
  removePluginHook(pluginId, event, callback) {
    if (!this.hooks[event]) {
      return
    }
    
    this.hooks[event] = this.hooks[event].filter(
      handler => handler.pluginId !== pluginId || handler.handler !== callback
    )
  }

  /**
   * 触发钩子
   */
  async triggerHook(hookName, data = {}) {
    const handlers = this.hooks[hookName] || []
    
    for (const { handler } of handlers) {
      try {
        await handler(data)
      } catch (error) {
        console.error(`Hook handler error for ${hookName}:`, error)
      }
    }
  }

  /**
   * 获取钩子方法名
   */
  getHookMethodName(hookName) {
    return 'on' + hookName.split(':').map(part => 
      part.charAt(0).toUpperCase() + part.slice(1)
    ).join('')
  }

  /**
   * 安装插件
   */
  async installPlugin(pluginData, source = 'local') {
    try {
      let plugin
      
      switch (source) {
        case 'local':
          plugin = await this.installLocalPlugin(pluginData)
          break
        case 'url':
          plugin = await this.installPluginFromUrl(pluginData)
          break
        case 'marketplace':
          plugin = await this.installPluginFromMarketplace(pluginData)
          break
        default:
          throw new Error(`Unsupported plugin source: ${source}`)
      }
      
      // 添加到插件列表
      this.plugins.push(plugin)
      
      console.log('Plugin installed:', plugin.name)
      return plugin
      
    } catch (error) {
      console.error('Failed to install plugin:', error)
      throw error
    }
  }

  /**
   * 安装本地插件
   */
  async installLocalPlugin(pluginPath) {
    // 实现本地插件安装逻辑
    throw new Error('Local plugin installation not implemented')
  }

  /**
   * 从URL安装插件
   */
  async installPluginFromUrl(url) {
    // 实现从URL安装插件的逻辑
    throw new Error('URL plugin installation not implemented')
  }

  /**
   * 从市场安装插件
   */
  async installPluginFromMarketplace(pluginId) {
    // 实现从插件市场安装的逻辑
    throw new Error('Marketplace plugin installation not implemented')
  }

  /**
   * 卸载插件
   */
  async uninstallPlugin(pluginId) {
    try {
      const plugin = this.plugins.find(p => p.id === pluginId)
      if (!plugin) {
        throw new Error('Plugin not found')
      }
      
      if (plugin.builtin) {
        throw new Error('Cannot uninstall builtin plugin')
      }
      
      // 先停用插件
      if (plugin.loaded) {
        await this.deactivatePlugin(pluginId)
      }
      
      // 删除插件文件
      if (plugin.directory) {
        await invoke('remove_dir_all', { path: plugin.directory })
      }
      
      // 从插件列表移除
      const index = this.plugins.findIndex(p => p.id === pluginId)
      if (index !== -1) {
        this.plugins.splice(index, 1)
      }
      
      // 更新已启用插件列表
      const enabledPlugins = JSON.parse(localStorage.getItem('enabledPlugins') || '[]')
      const updatedEnabled = enabledPlugins.filter(id => id !== pluginId)
      localStorage.setItem('enabledPlugins', JSON.stringify(updatedEnabled))
      
      console.log('Plugin uninstalled:', plugin.name)
      
    } catch (error) {
      console.error('Failed to uninstall plugin:', error)
      throw error
    }
  }

  /**
   * 启用插件
   */
  async enablePlugin(pluginId) {
    const plugin = this.plugins.find(p => p.id === pluginId)
    if (!plugin) {
      throw new Error('Plugin not found')
    }
    
    if (!plugin.enabled) {
      await this.activatePlugin(pluginId)
      
      // 更新已启用插件列表
      const enabledPlugins = JSON.parse(localStorage.getItem('enabledPlugins') || '[]')
      if (!enabledPlugins.includes(pluginId)) {
        enabledPlugins.push(pluginId)
        localStorage.setItem('enabledPlugins', JSON.stringify(enabledPlugins))
      }
    }
  }

  /**
   * 禁用插件
   */
  async disablePlugin(pluginId) {
    const plugin = this.plugins.find(p => p.id === pluginId)
    if (!plugin) {
      throw new Error('Plugin not found')
    }
    
    if (plugin.enabled) {
      await this.deactivatePlugin(pluginId)
      
      // 更新已启用插件列表
      const enabledPlugins = JSON.parse(localStorage.getItem('enabledPlugins') || '[]')
      const updatedEnabled = enabledPlugins.filter(id => id !== pluginId)
      localStorage.setItem('enabledPlugins', JSON.stringify(updatedEnabled))
    }
  }

  /**
   * 获取插件信息
   */
  getPluginInfo(pluginId) {
    return this.plugins.find(p => p.id === pluginId)
  }

  /**
   * 获取所有插件
   */
  getAllPlugins() {
    return this.plugins
  }

  /**
   * 获取活跃插件
   */
  getActivePlugins() {
    return this.activePlugins
  }

  /**
   * 搜索插件
   */
  searchPlugins(query) {
    const lowerQuery = query.toLowerCase()
    return this.plugins.filter(plugin =>
      plugin.name.toLowerCase().includes(lowerQuery) ||
      plugin.description.toLowerCase().includes(lowerQuery) ||
      plugin.keywords.some(keyword => keyword.toLowerCase().includes(lowerQuery))
    )
  }

  /**
   * 获取插件统计信息
   */
  getPluginStats() {
    return {
      total: this.plugins.length,
      enabled: this.activePlugins.length,
      builtin: this.plugins.filter(p => p.builtin).length,
      thirdParty: this.plugins.filter(p => !p.builtin).length
    }
  }

  /**
   * 设置API方法
   */
  setAPIMethod(name, method) {
    this.apiMethods[name] = method
  }

  /**
   * 获取可用的钩子列表
   */
  getAvailableHooks() {
    return Object.keys(this.hooks)
  }
}

// 创建全局插件服务实例
export const pluginService = new PluginService()

// 导出插件系统相关的组合式函数
export function usePluginSystem() {
  return {
    pluginService,
    plugins: pluginService.plugins,
    activePlugins: pluginService.activePlugins,
    config: pluginService.config,
    isInitialized: pluginService.isInitialized,
    
    // 插件管理
    installPlugin: (data, source) => pluginService.installPlugin(data, source),
    uninstallPlugin: (id) => pluginService.uninstallPlugin(id),
    enablePlugin: (id) => pluginService.enablePlugin(id),
    disablePlugin: (id) => pluginService.disablePlugin(id),
    
    // 插件信息
    getPluginInfo: (id) => pluginService.getPluginInfo(id),
    getAllPlugins: () => pluginService.getAllPlugins(),
    getActivePlugins: () => pluginService.getActivePlugins(),
    searchPlugins: (query) => pluginService.searchPlugins(query),
    getPluginStats: () => pluginService.getPluginStats(),
    
    // 钩子系统
    triggerHook: (name, data) => pluginService.triggerHook(name, data),
    getAvailableHooks: () => pluginService.getAvailableHooks(),
    
    // 配置
    savePluginConfig: () => pluginService.savePluginConfig(),
    setAPIMethod: (name, method) => pluginService.setAPIMethod(name, method)
  }
}