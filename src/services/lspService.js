/**
 * SnippetsHub - 专业代码片段管理工具
 * 
 * @file lspService.js - Language Server Protocol 服务
 * @author Noah
 * @description LSP客户端实现，提供智能代码分析、补全、诊断等功能
 * @created 2026-01-29
 * @version 1.0.0
 * 
 * 功能特性:
 * - LSP客户端实现
 * - 多语言服务器管理
 * - 实时代码诊断
 * - 智能代码补全
 * - 代码导航和重构
 * - 符号搜索和引用
 * - 代码格式化
 * - 错误和警告提示
 */

import { ref, reactive } from 'vue'
import { invoke } from '@tauri-apps/api/core'

class LSPService {
  constructor() {
    this.servers = new Map()
    this.connections = new Map()
    this.capabilities = new Map()
    this.diagnostics = reactive(new Map())
    this.isInitialized = ref(false)
    
    // 支持的语言服务器配置
    this.serverConfigs = {
      typescript: {
        name: 'typescript-language-server',
        command: 'typescript-language-server',
        args: ['--stdio'],
        filetypes: ['typescript', 'javascript', 'typescriptreact', 'javascriptreact'],
        rootPatterns: ['package.json', 'tsconfig.json', 'jsconfig.json']
      },
      python: {
        name: 'pylsp',
        command: 'pylsp',
        args: [],
        filetypes: ['python'],
        rootPatterns: ['pyproject.toml', 'setup.py', 'requirements.txt']
      },
      rust: {
        name: 'rust-analyzer',
        command: 'rust-analyzer',
        args: [],
        filetypes: ['rust'],
        rootPatterns: ['Cargo.toml', 'Cargo.lock']
      },
      go: {
        name: 'gopls',
        command: 'gopls',
        args: [],
        filetypes: ['go'],
        rootPatterns: ['go.mod', 'go.sum']
      },
      java: {
        name: 'jdtls',
        command: 'jdtls',
        args: [],
        filetypes: ['java'],
        rootPatterns: ['pom.xml', 'build.gradle', '.project']
      },
      cpp: {
        name: 'clangd',
        command: 'clangd',
        args: ['--background-index'],
        filetypes: ['c', 'cpp', 'objc', 'objcpp'],
        rootPatterns: ['compile_commands.json', '.clangd', 'CMakeLists.txt']
      }
    }
  }

  /**
   * 初始化LSP服务
   */
  async initialize() {
    try {
      // 检查可用的语言服务器
      await this.detectAvailableServers()
      
      // 初始化核心服务器
      await this.initializeCoreServers()
      
      this.isInitialized.value = true
      console.log('LSP Service initialized successfully')
      
    } catch (error) {
      console.error('Failed to initialize LSP service:', error)
      throw error
    }
  }

  /**
   * 检测可用的语言服务器
   */
  async detectAvailableServers() {
    const availableServers = []
    const unavailableServers = []
    
    console.log('🔍 检测可用的语言服务器...')
    
    for (const [language, config] of Object.entries(this.serverConfigs)) {
      try {
        // 通过Tauri检查命令是否可用
        const isAvailable = await invoke('check_command_available', {
          command: config.command
        })
        
        if (isAvailable) {
          availableServers.push(language)
          console.log(`✅ ${config.name} (${language}) - LSP服务器可用`)
        } else {
          unavailableServers.push({ language, name: config.name, command: config.command })
        }
      } catch (error) {
        unavailableServers.push({ language, name: config.name, command: config.command })
      }
    }
    
    // 友好的总结信息
    console.log(`\n📊 LSP服务器检测完成:`)
    console.log(`✅ 可用: ${availableServers.length} 个服务器`)
    console.log(`⚠️  不可用: ${unavailableServers.length} 个服务器`)
    
    if (unavailableServers.length > 0) {
      console.log(`\n💡 要启用智能代码补全，请安装以下语言服务器:`)
      unavailableServers.forEach(({ name, command }) => {
        console.log(`   • ${name}: 安装 '${command}' 命令`)
      })
      console.log(`\n📖 安装指南: https://github.com/your-repo/snippetshub/wiki/language-servers`)
    }
    
    return availableServers
  }

  /**
   * 初始化核心语言服务器
   */
  async initializeCoreServers() {
    const coreLanguages = ['typescript', 'python', 'rust']
    
    for (const language of coreLanguages) {
      try {
        await this.startLanguageServer(language)
      } catch (error) {
        console.warn(`Failed to start ${language} language server:`, error)
      }
    }
  }

  /**
   * 启动语言服务器
   */
  async startLanguageServer(language) {
    const config = this.serverConfigs[language]
    if (!config) {
      throw new Error(`No configuration found for language: ${language}`)
    }

    try {
      // 通过Tauri启动语言服务器进程
      const serverId = await invoke('start_language_server', {
        language,
        command: config.command,
        args: config.args
      })

      // 发送初始化请求
      const initializeParams = {
        processId: null,
        clientInfo: {
          name: 'SnippetsHub',
          version: '1.0.0'
        },
        capabilities: {
          textDocument: {
            synchronization: {
              dynamicRegistration: false,
              willSave: true,
              willSaveWaitUntil: true,
              didSave: true
            },
            completion: {
              dynamicRegistration: false,
              completionItem: {
                snippetSupport: true,
                commitCharactersSupport: true,
                documentationFormat: ['markdown', 'plaintext']
              }
            },
            hover: {
              dynamicRegistration: false,
              contentFormat: ['markdown', 'plaintext']
            },
            signatureHelp: {
              dynamicRegistration: false,
              signatureInformation: {
                documentationFormat: ['markdown', 'plaintext']
              }
            },
            definition: { dynamicRegistration: false },
            references: { dynamicRegistration: false },
            documentHighlight: { dynamicRegistration: false },
            documentSymbol: { dynamicRegistration: false },
            codeAction: { dynamicRegistration: false },
            codeLens: { dynamicRegistration: false },
            formatting: { dynamicRegistration: false },
            rangeFormatting: { dynamicRegistration: false },
            rename: { dynamicRegistration: false },
            publishDiagnostics: { relatedInformation: true }
          },
          workspace: {
            applyEdit: true,
            workspaceEdit: {
              documentChanges: true
            },
            didChangeConfiguration: {
              dynamicRegistration: false
            },
            didChangeWatchedFiles: {
              dynamicRegistration: false
            },
            symbol: { dynamicRegistration: false },
            executeCommand: { dynamicRegistration: false }
          }
        },
        trace: 'off',
        workspaceFolders: null
      }

      const response = await this.sendRequest(serverId, 'initialize', initializeParams)
      
      // 存储服务器信息
      this.servers.set(language, {
        id: serverId,
        config,
        capabilities: response.capabilities,
        status: 'initialized'
      })

      // 发送initialized通知
      await this.sendNotification(serverId, 'initialized', {})

      console.log(`Language server started: ${language}`)
      return serverId

    } catch (error) {
      console.error(`Failed to start language server for ${language}:`, error)
      throw error
    }
  }

  /**
   * 发送LSP请求
   */
  async sendRequest(serverId, method, params) {
    try {
      const response = await invoke('lsp_request', {
        serverId,
        method,
        params: JSON.stringify(params)
      })
      
      return JSON.parse(response)
    } catch (error) {
      console.error(`LSP request failed: ${method}`, error)
      throw error
    }
  }

  /**
   * 发送LSP通知
   */
  async sendNotification(serverId, method, params) {
    try {
      await invoke('lsp_notification', {
        serverId,
        method,
        params: JSON.stringify(params)
      })
    } catch (error) {
      console.error(`LSP notification failed: ${method}`, error)
      throw error
    }
  }

  /**
   * 打开文档
   */
  async didOpen(language, uri, content, version = 1) {
    const server = this.servers.get(language)
    if (!server) return

    const params = {
      textDocument: {
        uri,
        languageId: language,
        version,
        text: content
      }
    }

    await this.sendNotification(server.id, 'textDocument/didOpen', params)
  }

  /**
   * 文档内容变更
   */
  async didChange(language, uri, changes, version) {
    const server = this.servers.get(language)
    if (!server) return

    const params = {
      textDocument: {
        uri,
        version
      },
      contentChanges: changes
    }

    await this.sendNotification(server.id, 'textDocument/didChange', params)
  }

  /**
   * 关闭文档
   */
  async didClose(language, uri) {
    const server = this.servers.get(language)
    if (!server) return

    const params = {
      textDocument: { uri }
    }

    await this.sendNotification(server.id, 'textDocument/didClose', params)
  }

  /**
   * 获取代码补全
   */
  async getCompletion(language, uri, position) {
    const server = this.servers.get(language)
    if (!server) return null

    const params = {
      textDocument: { uri },
      position,
      context: {
        triggerKind: 1 // Invoked
      }
    }

    try {
      const response = await this.sendRequest(server.id, 'textDocument/completion', params)
      return this.processCompletionResponse(response)
    } catch (error) {
      console.error('Completion request failed:', error)
      return null
    }
  }

  /**
   * 获取悬停信息
   */
  async getHover(language, uri, position) {
    const server = this.servers.get(language)
    if (!server) return null

    const params = {
      textDocument: { uri },
      position
    }

    try {
      const response = await this.sendRequest(server.id, 'textDocument/hover', params)
      return this.processHoverResponse(response)
    } catch (error) {
      console.error('Hover request failed:', error)
      return null
    }
  }

  /**
   * 获取诊断信息
   */
  async getDiagnostics(language, uri) {
    return this.diagnostics.get(uri) || []
  }

  /**
   * 格式化文档
   */
  async formatDocument(language, uri, options) {
    const server = this.servers.get(language)
    if (!server) return null

    const params = {
      textDocument: { uri },
      options: {
        tabSize: options.tabSize || 2,
        insertSpaces: options.insertSpaces !== false,
        ...options
      }
    }

    try {
      const response = await this.sendRequest(server.id, 'textDocument/formatting', params)
      return response
    } catch (error) {
      console.error('Format request failed:', error)
      return null
    }
  }

  /**
   * 查找定义
   */
  async findDefinition(language, uri, position) {
    const server = this.servers.get(language)
    if (!server) return null

    const params = {
      textDocument: { uri },
      position
    }

    try {
      const response = await this.sendRequest(server.id, 'textDocument/definition', params)
      return response
    } catch (error) {
      console.error('Definition request failed:', error)
      return null
    }
  }

  /**
   * 查找引用
   */
  async findReferences(language, uri, position, includeDeclaration = true) {
    const server = this.servers.get(language)
    if (!server) return null

    const params = {
      textDocument: { uri },
      position,
      context: {
        includeDeclaration
      }
    }

    try {
      const response = await this.sendRequest(server.id, 'textDocument/references', params)
      return response
    } catch (error) {
      console.error('References request failed:', error)
      return null
    }
  }

  /**
   * 处理补全响应
   */
  processCompletionResponse(response) {
    if (!response) return []

    const items = Array.isArray(response) ? response : response.items || []
    
    return items.map(item => ({
      label: item.label,
      kind: item.kind,
      detail: item.detail,
      documentation: item.documentation,
      insertText: item.insertText || item.label,
      insertTextFormat: item.insertTextFormat || 1,
      sortText: item.sortText,
      filterText: item.filterText,
      additionalTextEdits: item.additionalTextEdits
    }))
  }

  /**
   * 处理悬停响应
   */
  processHoverResponse(response) {
    if (!response || !response.contents) return null

    let contents = response.contents
    if (typeof contents === 'string') {
      contents = [{ kind: 'plaintext', value: contents }]
    } else if (!Array.isArray(contents)) {
      contents = [contents]
    }

    return {
      contents: contents.map(content => {
        if (typeof content === 'string') {
          return { kind: 'plaintext', value: content }
        }
        return content
      }),
      range: response.range
    }
  }

  /**
   * 处理诊断信息
   */
  handleDiagnostics(uri, diagnostics) {
    this.diagnostics.set(uri, diagnostics.map(diag => ({
      range: diag.range,
      severity: diag.severity || 1,
      code: diag.code,
      source: diag.source,
      message: diag.message,
      relatedInformation: diag.relatedInformation
    })))
  }

  /**
   * 停止语言服务器
   */
  async stopLanguageServer(language) {
    const server = this.servers.get(language)
    if (!server) return

    try {
      await invoke('stop_language_server', { serverId: server.id })
      this.servers.delete(language)
      console.log(`Language server stopped: ${language}`)
    } catch (error) {
      console.error(`Failed to stop language server: ${language}`, error)
    }
  }

  /**
   * 停止所有语言服务器
   */
  async shutdown() {
    const stopPromises = Array.from(this.servers.keys()).map(language =>
      this.stopLanguageServer(language)
    )
    
    await Promise.all(stopPromises)
    this.isInitialized.value = false
  }

  /**
   * 获取语言服务器状态
   */
  getServerStatus(language) {
    const server = this.servers.get(language)
    return server ? server.status : 'not_started'
  }

  /**
   * 获取支持的语言列表
   */
  getSupportedLanguages() {
    return Object.keys(this.serverConfigs)
  }

  /**
   * 检查语言是否支持特定功能
   */
  supportsFeature(language, feature) {
    const server = this.servers.get(language)
    if (!server) return false

    const capabilities = server.capabilities
    switch (feature) {
      case 'completion':
        return !!capabilities.completionProvider
      case 'hover':
        return !!capabilities.hoverProvider
      case 'definition':
        return !!capabilities.definitionProvider
      case 'references':
        return !!capabilities.referencesProvider
      case 'formatting':
        return !!capabilities.documentFormattingProvider
      case 'rangeFormatting':
        return !!capabilities.documentRangeFormattingProvider
      case 'rename':
        return !!capabilities.renameProvider
      default:
        return false
    }
  }
}

// 创建全局LSP服务实例
export const lspService = new LSPService()

// 导出LSP相关的组合式函数
export function useLSP() {
  return {
    lspService,
    isInitialized: lspService.isInitialized,
    diagnostics: lspService.diagnostics,
    
    // 方法
    initialize: () => lspService.initialize(),
    getCompletion: (language, uri, position) => 
      lspService.getCompletion(language, uri, position),
    getHover: (language, uri, position) => 
      lspService.getHover(language, uri, position),
    formatDocument: (language, uri, options) => 
      lspService.formatDocument(language, uri, options),
    findDefinition: (language, uri, position) => 
      lspService.findDefinition(language, uri, position),
    findReferences: (language, uri, position) => 
      lspService.findReferences(language, uri, position),
    
    // 文档生命周期
    didOpen: (language, uri, content, version) => 
      lspService.didOpen(language, uri, content, version),
    didChange: (language, uri, changes, version) => 
      lspService.didChange(language, uri, changes, version),
    didClose: (language, uri) => 
      lspService.didClose(language, uri),
    
    // 工具方法
    getSupportedLanguages: () => lspService.getSupportedLanguages(),
    supportsFeature: (language, feature) => 
      lspService.supportsFeature(language, feature),
    getServerStatus: (language) => 
      lspService.getServerStatus(language)
  }
}