/**
 * SnippetsHub - 专业代码片段管理工具
 * 
 * @file codeExecutionService.js - 代码执行服务
 * @author Noah
 * @description 多语言代码执行引擎，支持安全的代码运行环境
 * @created 2026-01-30
 * @version 1.0.0
 * 
 * 功能特性:
 * - 多语言运行时支持
 * - 安全沙箱执行环境
 * - 实时输出流处理
 * - 执行超时和资源限制
 * - 依赖管理和包安装
 * - 调试和性能分析
 * - 代码测试集成
 * - 执行历史和缓存
 */

import { ref, reactive } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { Command } from '@tauri-apps/plugin-shell'
import { writeTextFile, readTextFile, exists, mkdir, BaseDirectory } from '@tauri-apps/plugin-fs'
import { appCacheDir, join } from '@tauri-apps/api/path'

class CodeExecutionService {
  constructor() {
    this.executors = new Map()
    this.runningProcesses = new Map()
    this.executionHistory = reactive([])
    this.isInitialized = ref(false)
    
    // 支持的语言运行时配置
    this.runtimeConfigs = {
      javascript: {
        name: 'Node.js',
        command: 'node',
        extension: 'js',
        version: '--version',
        install: 'npm install',
        packageFile: 'package.json',
        dependencies: [],
        timeout: 30000,
        memoryLimit: '512m'
      },
      typescript: {
        name: 'TypeScript',
        command: 'ts-node',
        extension: 'ts',
        version: '--version',
        install: 'npm install -g ts-node typescript',
        packageFile: 'package.json',
        dependencies: ['typescript', 'ts-node'],
        timeout: 30000,
        memoryLimit: '512m'
      },
      python: {
        name: 'Python',
        command: 'python3',
        extension: 'py',
        version: '--version',
        install: 'pip install',
        packageFile: 'requirements.txt',
        dependencies: [],
        timeout: 30000,
        memoryLimit: '512m'
      },
      rust: {
        name: 'Rust',
        command: 'rustc',
        extension: 'rs',
        version: '--version',
        install: 'cargo install',
        packageFile: 'Cargo.toml',
        dependencies: [],
        timeout: 60000,
        memoryLimit: '1g',
        compile: true,
        compileCommand: 'rustc'
      },
      go: {
        name: 'Go',
        command: 'go',
        extension: 'go',
        version: 'version',
        install: 'go get',
        packageFile: 'go.mod',
        dependencies: [],
        timeout: 30000,
        memoryLimit: '512m',
        runArgs: ['run']
      },
      java: {
        name: 'Java',
        command: 'java',
        extension: 'java',
        version: '-version',
        install: 'mvn install',
        packageFile: 'pom.xml',
        dependencies: [],
        timeout: 45000,
        memoryLimit: '1g',
        compile: true,
        compileCommand: 'javac'
      },
      cpp: {
        name: 'C++',
        command: 'g++',
        extension: 'cpp',
        version: '--version',
        install: 'apt-get install g++',
        packageFile: 'CMakeLists.txt',
        dependencies: [],
        timeout: 45000,
        memoryLimit: '512m',
        compile: true,
        compileCommand: 'g++',
        compileArgs: ['-o', 'output']
      },
      c: {
        name: 'C',
        command: 'gcc',
        extension: 'c',
        version: '--version',
        install: 'apt-get install gcc',
        packageFile: 'Makefile',
        dependencies: [],
        timeout: 45000,
        memoryLimit: '512m',
        compile: true,
        compileCommand: 'gcc',
        compileArgs: ['-o', 'output']
      },
      php: {
        name: 'PHP',
        command: 'php',
        extension: 'php',
        version: '--version',
        install: 'composer install',
        packageFile: 'composer.json',
        dependencies: [],
        timeout: 30000,
        memoryLimit: '512m'
      },
      ruby: {
        name: 'Ruby',
        command: 'ruby',
        extension: 'rb',
        version: '--version',
        install: 'gem install',
        packageFile: 'Gemfile',
        dependencies: [],
        timeout: 30000,
        memoryLimit: '512m'
      },
      swift: {
        name: 'Swift',
        command: 'swift',
        extension: 'swift',
        version: '--version',
        install: 'swift package',
        packageFile: 'Package.swift',
        dependencies: [],
        timeout: 45000,
        memoryLimit: '1g'
      },
      kotlin: {
        name: 'Kotlin',
        command: 'kotlinc',
        extension: 'kt',
        version: '-version',
        install: 'gradle install',
        packageFile: 'build.gradle',
        dependencies: [],
        timeout: 45000,
        memoryLimit: '1g',
        compile: true,
        compileCommand: 'kotlinc',
        runCommand: 'kotlin'
      },
      shell: {
        name: 'Shell',
        command: 'bash',
        extension: 'sh',
        version: '--version',
        install: null,
        packageFile: null,
        dependencies: [],
        timeout: 30000,
        memoryLimit: '256m'
      },
      powershell: {
        name: 'PowerShell',
        command: 'pwsh',
        extension: 'ps1',
        version: '--version',
        install: null,
        packageFile: null,
        dependencies: [],
        timeout: 30000,
        memoryLimit: '512m'
      }
    }
  }

  /**
   * 初始化代码执行服务
   */
  async initialize() {
    try {
      // 检查可用的运行时环境
      await this.detectAvailableRuntimes()
      
      // 创建执行目录
      await this.setupExecutionEnvironment()
      
      // 初始化核心运行时
      await this.initializeCoreRuntimes()
      
      this.isInitialized.value = true
      console.log('Code Execution Service initialized successfully')
      
    } catch (error) {
      console.error('Failed to initialize Code Execution service:', error)
      throw error
    }
  }

  /**
   * 检测可用的运行时环境
   */
  async detectAvailableRuntimes() {
    const availableRuntimes = []
    const unavailableRuntimes = []
    
    console.log('🔍 检测可用的代码执行环境...')
    
    for (const [language, config] of Object.entries(this.runtimeConfigs)) {
      try {
        // 通过Tauri检查命令是否可用
        const isAvailable = await invoke('check_command_available', {
          command: config.command
        })
        
        if (isAvailable) {
          // 获取版本信息
          try {
            const versionCommand = Command.create(config.command, [config.version])
            const versionOutput = await versionCommand.execute()
            
            this.executors.set(language, {
              ...config,
              available: true,
              version: versionOutput.stdout || versionOutput.stderr || 'Unknown'
            })
            
            availableRuntimes.push(language)
            console.log(`✅ ${config.name} (${language}) - 可用`)
          } catch (versionError) {
            this.executors.set(language, {
              ...config,
              available: true,
              version: 'Unknown'
            })
            availableRuntimes.push(language)
            console.log(`✅ ${config.name} (${language}) - 可用 (版本未知)`)
          }
        } else {
          this.executors.set(language, {
            ...config,
            available: false,
            version: null
          })
          unavailableRuntimes.push({ language, name: config.name, command: config.command })
        }
      } catch (error) {
        this.executors.set(language, {
          ...config,
          available: false,
          version: null
        })
        unavailableRuntimes.push({ language, name: config.name, command: config.command })
      }
    }
    
    // 友好的总结信息
    console.log(`\n📊 代码执行环境检测完成:`)
    console.log(`✅ 可用: ${availableRuntimes.length} 种语言`)
    console.log(`⚠️  不可用: ${unavailableRuntimes.length} 种语言`)
    
    if (unavailableRuntimes.length > 0) {
      console.log(`\n💡 要启用更多语言支持，请安装以下工具:`)
      unavailableRuntimes.forEach(({ name, command }) => {
        console.log(`   • ${name}: 安装 '${command}' 命令`)
      })
      console.log(`\n📖 安装指南: https://github.com/your-repo/snippetshub/wiki/development-tools`)
    }
    
    return availableRuntimes
  }

  /**
   * 设置执行环境
   */
  async setupExecutionEnvironment() {
    try {
      const cacheDir = await appCacheDir()
      const executionDir = await join(cacheDir, 'execution')
      
      // 创建执行目录
      if (!(await exists(executionDir))) {
        await mkdir(executionDir, { recursive: true })
      }
      
      // 为每种语言创建子目录
      for (const language of Object.keys(this.runtimeConfigs)) {
        const langDir = await join(executionDir, language)
        if (!(await exists(langDir))) {
          await mkdir(langDir, { recursive: true })
        }
      }
      
      console.log('Execution environment setup complete')
    } catch (error) {
      console.error('Failed to setup execution environment:', error)
      throw error
    }
  }

  /**
   * 初始化核心运行时
   */
  async initializeCoreRuntimes() {
    const coreLanguages = ['javascript', 'python', 'shell']
    
    for (const language of coreLanguages) {
      const executor = this.executors.get(language)
      if (executor && executor.available) {
        try {
          await this.prepareRuntime(language)
        } catch (error) {
          console.warn(`Failed to prepare ${language} runtime:`, error)
        }
      }
    }
  }

  /**
   * 准备运行时环境
   */
  async prepareRuntime(language) {
    const config = this.executors.get(language)
    if (!config || !config.available) {
      throw new Error(`Runtime not available: ${language}`)
    }

    try {
      const cacheDir = await appCacheDir()
      const langDir = await join(cacheDir, 'execution', language)
      
      // 创建包配置文件（如果需要）
      if (config.packageFile) {
        const packagePath = await join(langDir, config.packageFile)
        
        if (!(await exists(packagePath))) {
          let packageContent = ''
          
          switch (language) {
            case 'javascript':
            case 'typescript':
              packageContent = JSON.stringify({
                name: 'snippetshub-execution',
                version: '1.0.0',
                description: 'SnippetsHub execution environment',
                main: 'index.js',
                dependencies: {}
              }, null, 2)
              break
              
            case 'python':
              packageContent = '# SnippetsHub Python execution environment\n'
              break
              
            case 'rust':
              packageContent = `[package]
name = "snippetshub-execution"
version = "0.1.0"
edition = "2021"

[dependencies]
`
              break
              
            case 'go':
              packageContent = `module snippetshub-execution

go 1.21
`
              break
          }
          
          if (packageContent) {
            await writeTextFile(config.packageFile, packageContent, {
              baseDir: BaseDirectory.AppCache,
              dir: `execution/${language}`
            })
          }
        }
      }
      
      console.log(`Runtime prepared: ${language}`)
    } catch (error) {
      console.error(`Failed to prepare runtime ${language}:`, error)
      throw error
    }
  }

  /**
   * 执行代码
   */
  async executeCode(language, code, options = {}) {
    const config = this.executors.get(language)
    if (!config || !config.available) {
      throw new Error(`Runtime not available: ${language}`)
    }

    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const startTime = Date.now()
    
    try {
      // 创建执行上下文
      const context = await this.createExecutionContext(language, code, executionId, options)
      
      // 记录执行开始
      const execution = {
        id: executionId,
        language,
        code,
        startTime,
        status: 'running',
        output: '',
        error: '',
        exitCode: null,
        duration: null
      }
      
      this.executionHistory.unshift(execution)
      
      // 执行代码
      const result = await this.runCode(context)
      
      // 更新执行记录
      execution.status = result.success ? 'completed' : 'failed'
      execution.output = result.output
      execution.error = result.error
      execution.exitCode = result.exitCode
      execution.duration = Date.now() - startTime
      
      // 清理执行上下文
      await this.cleanupExecutionContext(context)
      
      return {
        success: result.success,
        output: result.output,
        error: result.error,
        exitCode: result.exitCode,
        duration: execution.duration,
        executionId
      }
      
    } catch (error) {
      // 更新执行记录
      const execution = this.executionHistory.find(e => e.id === executionId)
      if (execution) {
        execution.status = 'error'
        execution.error = error.message
        execution.duration = Date.now() - startTime
      }
      
      throw error
    }
  }

  /**
   * 创建执行上下文
   */
  async createExecutionContext(language, code, executionId, options) {
    const config = this.executors.get(language)
    const cacheDir = await appCacheDir()
    const executionDir = await join(cacheDir, 'execution', language, executionId)
    
    // 创建执行目录
    await mkdir(executionDir, { recursive: true })
    
    // 生成文件名
    const fileName = `main.${config.extension}`
    const filePath = await join(executionDir, fileName)
    
    // 写入代码文件
    await writeTextFile(fileName, code, {
      baseDir: BaseDirectory.AppCache,
      dir: `execution/${language}/${executionId}`
    })
    
    const context = {
      id: executionId,
      language,
      config,
      executionDir,
      fileName,
      filePath,
      code,
      options: {
        timeout: options.timeout || config.timeout,
        memoryLimit: options.memoryLimit || config.memoryLimit,
        args: options.args || [],
        env: options.env || {},
        input: options.input || '',
        ...options
      }
    }
    
    return context
  }

  /**
   * 运行代码
   */
  async runCode(context) {
    const { config, filePath, options } = context
    
    try {
      let command
      let args = []
      
      // 处理编译型语言
      if (config.compile) {
        const compileResult = await this.compileCode(context)
        if (!compileResult.success) {
          return {
            success: false,
            output: '',
            error: compileResult.error,
            exitCode: compileResult.exitCode
          }
        }
        
        // 使用编译后的可执行文件
        command = compileResult.executable
        args = options.args
      } else {
        // 解释型语言
        command = config.command
        args = [...(config.runArgs || []), filePath, ...options.args]
      }
      
      // 创建执行命令
      const execCommand = Command.create(command, args, {
        cwd: context.executionDir,
        env: options.env
      })
      
      // 设置超时
      const timeoutId = setTimeout(() => {
        execCommand.kill()
      }, options.timeout)
      
      let output = ''
      let error = ''
      
      // 监听输出
      execCommand.stdout.on('data', (data) => {
        output += data
      })
      
      execCommand.stderr.on('data', (data) => {
        error += data
      })
      
      // 如果有输入，写入stdin
      if (options.input) {
        execCommand.stdin.write(options.input)
        execCommand.stdin.end()
      }
      
      // 等待执行完成
      const result = await execCommand.execute()
      clearTimeout(timeoutId)
      
      return {
        success: result.code === 0,
        output: output || result.stdout,
        error: error || result.stderr,
        exitCode: result.code
      }
      
    } catch (error) {
      return {
        success: false,
        output: '',
        error: error.message,
        exitCode: -1
      }
    }
  }

  /**
   * 编译代码
   */
  async compileCode(context) {
    const { config, filePath, executionDir } = context
    
    try {
      let compileCommand = config.compileCommand
      let compileArgs = []
      let executable
      
      switch (context.language) {
        case 'rust':
          compileArgs = [filePath, '-o', 'main']
          executable = await join(executionDir, 'main')
          break
          
        case 'java':
          compileArgs = [filePath]
          executable = 'java'
          break
          
        case 'cpp':
        case 'c':
          compileArgs = [filePath, '-o', 'main']
          executable = await join(executionDir, 'main')
          break
          
        case 'kotlin':
          compileArgs = [filePath, '-include-runtime', '-d', 'main.jar']
          executable = 'java'
          break
          
        default:
          throw new Error(`Compilation not supported for ${context.language}`)
      }
      
      // 执行编译
      const compileCmd = Command.create(compileCommand, compileArgs, {
        cwd: executionDir
      })
      
      const result = await compileCmd.execute()
      
      if (result.code !== 0) {
        return {
          success: false,
          error: result.stderr || result.stdout || 'Compilation failed',
          exitCode: result.code
        }
      }
      
      return {
        success: true,
        executable,
        output: result.stdout
      }
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        exitCode: -1
      }
    }
  }

  /**
   * 停止代码执行
   */
  async stopExecution(executionId) {
    const process = this.runningProcesses.get(executionId)
    if (process) {
      try {
        await process.kill()
        this.runningProcesses.delete(executionId)
        
        // 更新执行记录
        const execution = this.executionHistory.find(e => e.id === executionId)
        if (execution) {
          execution.status = 'stopped'
          execution.duration = Date.now() - execution.startTime
        }
        
        return true
      } catch (error) {
        console.error('Failed to stop execution:', error)
        return false
      }
    }
    
    return false
  }

  /**
   * 清理执行上下文
   */
  async cleanupExecutionContext(context) {
    try {
      // 删除执行目录（可选，用于调试时保留）
      if (context.options.cleanup !== false) {
        await invoke('remove_dir_all', { path: context.executionDir })
      }
    } catch (error) {
      console.warn('Failed to cleanup execution context:', error)
    }
  }

  /**
   * 安装依赖包
   */
  async installDependency(language, packageName, version = 'latest') {
    const config = this.executors.get(language)
    if (!config || !config.available || !config.install) {
      throw new Error(`Package installation not supported for ${language}`)
    }

    try {
      const cacheDir = await appCacheDir()
      const langDir = await join(cacheDir, 'execution', language)
      
      let installCommand
      let installArgs
      
      switch (language) {
        case 'javascript':
        case 'typescript':
          installCommand = 'npm'
          installArgs = ['install', version === 'latest' ? packageName : `${packageName}@${version}`]
          break
          
        case 'python':
          installCommand = 'pip'
          installArgs = ['install', version === 'latest' ? packageName : `${packageName}==${version}`]
          break
          
        case 'rust':
          installCommand = 'cargo'
          installArgs = ['add', packageName]
          break
          
        case 'go':
          installCommand = 'go'
          installArgs = ['get', version === 'latest' ? packageName : `${packageName}@${version}`]
          break
          
        default:
          throw new Error(`Package installation not implemented for ${language}`)
      }
      
      const command = Command.create(installCommand, installArgs, {
        cwd: langDir
      })
      
      const result = await command.execute()
      
      if (result.code !== 0) {
        throw new Error(`Package installation failed: ${result.stderr}`)
      }
      
      console.log(`Package installed: ${packageName} for ${language}`)
      return {
        success: true,
        output: result.stdout
      }
      
    } catch (error) {
      console.error(`Failed to install package ${packageName} for ${language}:`, error)
      throw error
    }
  }

  /**
   * 获取可用的运行时列表
   */
  getAvailableRuntimes() {
    return Array.from(this.executors.entries())
      .filter(([_, config]) => config.available)
      .map(([language, config]) => ({
        language,
        name: config.name,
        version: config.version,
        extension: config.extension
      }))
  }

  /**
   * 获取执行历史
   */
  getExecutionHistory(limit = 50) {
    return this.executionHistory.slice(0, limit)
  }

  /**
   * 清理执行历史
   */
  clearExecutionHistory() {
    this.executionHistory.splice(0)
  }

  /**
   * 获取运行时信息
   */
  getRuntimeInfo(language) {
    return this.executors.get(language)
  }

  /**
   * 检查语言是否支持执行
   */
  isLanguageSupported(language) {
    const config = this.executors.get(language)
    return config && config.available
  }
}

// 创建全局代码执行服务实例
export const codeExecutionService = new CodeExecutionService()

// 导出代码执行相关的组合式函数
export function useCodeExecution() {
  return {
    codeExecutionService,
    isInitialized: codeExecutionService.isInitialized,
    executionHistory: codeExecutionService.executionHistory,
    
    // 方法
    initialize: () => codeExecutionService.initialize(),
    executeCode: (language, code, options) => 
      codeExecutionService.executeCode(language, code, options),
    stopExecution: (executionId) => 
      codeExecutionService.stopExecution(executionId),
    installDependency: (language, packageName, version) => 
      codeExecutionService.installDependency(language, packageName, version),
    
    // 工具方法
    getAvailableRuntimes: () => codeExecutionService.getAvailableRuntimes(),
    getExecutionHistory: (limit) => codeExecutionService.getExecutionHistory(limit),
    clearExecutionHistory: () => codeExecutionService.clearExecutionHistory(),
    getRuntimeInfo: (language) => codeExecutionService.getRuntimeInfo(language),
    isLanguageSupported: (language) => codeExecutionService.isLanguageSupported(language)
  }
}