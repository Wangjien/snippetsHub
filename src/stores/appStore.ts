/**
 * SnippetsHub - 代码片段管理工具
 * 
 * @file appStore.ts - 应用全局状态管理
 * @author Noah
 * @description 管理应用程序的全局设置、视图状态、错误处理和加载状态
 * @created 2026-01-05
 * @modified 2026-02-03
 * @version 1.0.0
 * 
 * 功能特性:
 * - 视图切换与路由管理
 * - 全局加载指示器
 * - 全局错误捕获与日志
 * - 用户偏好设置（设置持久化）
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { VIEWS, DEFAULT_SETTINGS, STORAGE_KEYS } from '../constants'
import { storage } from '../utils'
import type { AppSettings } from '../types/models'

interface AppError {
    id: number;
    message: string;
    timestamp: Date;
}

export const useAppStore = defineStore('app', () => {
    // 状态
    const currentView = ref<string>(VIEWS.CODE)
    const isLoading = ref<boolean>(false)
    const settings = ref<AppSettings>({ ...DEFAULT_SETTINGS })
    const errors = ref<AppError[]>([])

    // 加载设置
    const loadSettings = () => {
        const savedSettings = storage.get(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS)
        settings.value = { ...DEFAULT_SETTINGS, ...savedSettings }
    }

    // 保存设置
    const saveSettings = (newSettings: Partial<AppSettings>) => {
        settings.value = { ...settings.value, ...newSettings }
        storage.set(STORAGE_KEYS.SETTINGS, settings.value)
    }

    // 设置当前视图
    const setCurrentView = (view: string) => {
        if (Object.values(VIEWS).includes(view)) {
            currentView.value = view
        }
    }

    // 设置加载状态
    const setLoading = (loading: boolean) => {
        isLoading.value = loading
    }

    // 添加错误
    const addError = (error: string) => {
        errors.value.push({
            id: Date.now(),
            message: error,
            timestamp: new Date()
        })
    }

    // 清除错误
    const clearError = (id: number) => {
        errors.value = errors.value.filter(error => error.id !== id)
    }

    // 清除所有错误
    const clearAllErrors = () => {
        errors.value = []
    }

    // 初始化
    const initialize = () => {
        loadSettings()
    }

    return {
        // 状态
        currentView,
        isLoading,
        settings,
        errors,

        // 方法
        setCurrentView,
        setLoading,
        addError,
        clearError,
        clearAllErrors,
        loadSettings,
        saveSettings,
        initialize
    }
})
