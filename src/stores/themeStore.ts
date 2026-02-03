/**
 * SnippetsHub - 专业代码片段管理工具
 * 
 * @file themeStore.ts - 主题系统状态管理
 * @author Noah
 * @description 应用程序主题系统的状态管理，支持多种主题和自动切换
 * @created 2026-01-28
 * @modified 2026-01-29
 * @version 1.0.0
 * 
 * 功能特性:
 * - 5种专业主题支持
 * - 系统主题自动检测
 * - 主题切换动画效果
 * - 主题配置持久化
 * - 自定义主题支持
 * - 主题统计和分析
 * - 无障碍访问优化
 * - 性能优化加载
 */

import { defineStore } from 'pinia'
import { ref, computed, watch, createApp } from 'vue'
import { THEMES, THEME_CONFIG, STORAGE_KEYS, SUCCESS_MESSAGES } from '../constants'
import { storage } from '../utils'

// 简单的类型定义，如果有了 constants.ts 可以移除
type Theme = string;

interface ThemeConfig {
    colors: Record<string, string>;
    [key: string]: any;
}

interface ThemeSettings {
    theme: string;
    followSystemTheme: boolean;
}

export const useThemeStore = defineStore('theme', () => {
    // 状态
    const currentTheme = ref<Theme>(THEMES.DARK)
    const followSystemTheme = ref<boolean>(false)
    const systemTheme = ref<Theme>(THEMES.DARK)

    // 计算属性 - 实际应用的主题
    const appliedTheme = computed<Theme>(() => {
        if (followSystemTheme.value) {
            return systemTheme.value
        }
        return currentTheme.value
    })

    // 计算属性 - 当前主题配置
    const themeConfig = computed<ThemeConfig>(() => {
        return (THEME_CONFIG[appliedTheme.value] || THEME_CONFIG[THEMES.DARK]) as ThemeConfig
    })

    // 计算属性 - 主题颜色
    const colors = computed(() => themeConfig.value.colors)

    // 检测系统主题
    const detectSystemTheme = (): MediaQueryList | null => {
        if (typeof window !== 'undefined' && window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
            systemTheme.value = mediaQuery.matches ? THEMES.DARK : THEMES.LIGHT
            return mediaQuery
        }
        return null
    }

    // 类型增强：声明 window 上的属性
    const getMonaco = () => (window as any).monaco;

    // 更新 Monaco Editor 主题
    const updateMonacoTheme = () => {
        const monaco = getMonaco();
        if (typeof window !== 'undefined' && monaco) {
            let monacoTheme = 'vs'

            switch (appliedTheme.value) {
                case THEMES.DARK:
                case THEMES.HIGH_CONTRAST:
                    monacoTheme = 'vs-dark'
                    break
                case THEMES.LIGHT:
                case THEMES.SEPIA:
                    monacoTheme = 'vs'
                    break
                default:
                    monacoTheme = 'vs-dark'
            }

            monaco.editor.setTheme(monacoTheme)
        }
    }

    // 应用主题到 CSS 变量
    const applyThemeToCSS = () => {
        if (typeof document === 'undefined') return

        const root = document.documentElement
        const colors = themeConfig.value.colors

        // 应用所有颜色变量
        Object.entries(colors).forEach(([key, value]) => {
            const cssVar = `--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`
            root.style.setProperty(cssVar, value as string)
        })

        // 设置主题类名
        root.className = root.className.replace(/theme-\w+/g, '')
        root.classList.add(`theme-${appliedTheme.value}`)

        // 更新 Monaco Editor 主题
        updateMonacoTheme()
    }

    // 获取主题配置
    const getThemeConfig = (theme: string): ThemeConfig => {
        return (THEME_CONFIG[theme] || THEME_CONFIG[THEMES.DARK]) as ThemeConfig
    }

    // 预加载主题
    const preloadTheme = (theme: string) => {
        const config = getThemeConfig(theme)
        if (config && typeof document !== 'undefined') {
            // 预创建 CSS 变量以提高切换性能
            const tempDiv = document.createElement('div')
            tempDiv.style.display = 'none'
            Object.entries(config.colors).forEach(([key, value]) => {
                const cssVar = `--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`
                tempDiv.style.setProperty(cssVar, value as string)
            })
            document.body.appendChild(tempDiv)
            setTimeout(() => document.body.removeChild(tempDiv), 100)
        }
    }

    // 获取主题统计信息
    const getThemeStats = () => {
        return {
            totalThemes: Object.keys(THEME_CONFIG).length,
            currentTheme: appliedTheme.value,
            isSystemTheme: followSystemTheme.value,
            systemTheme: systemTheme.value,
            availableThemes: Object.keys(THEME_CONFIG)
        }
    }

    // 保存主题设置
    const saveThemeSettings = () => {
        const settings: ThemeSettings = {
            theme: currentTheme.value,
            followSystemTheme: followSystemTheme.value
        }
        storage.set(STORAGE_KEYS.THEME, settings)
    }

    // 显示主题过渡动画
    const showThemeTransition = (fromTheme: string, toTheme: string) => {
        // 动态导入过渡组件
        import('../components/ThemeTransition.vue').then(({ default: ThemeTransition }) => {
            const transitionApp = createApp(ThemeTransition, {
                fromTheme,
                toTheme,
                onComplete: () => {
                    transitionApp.unmount()
                    if (container.parentNode) container.parentNode.removeChild(container);
                }
            })

            const container = document.createElement('div')
            document.body.appendChild(container)
            transitionApp.mount(container)
        }).catch((e: any) => {
            // 如果动态导入失败，直接应用主题
            console.warn('Theme transition component failed to load', e)
        })
    }

    // 设置主题
    const setTheme = (theme: string, showTransition = false) => {
        if (Object.values(THEMES).includes(theme)) {
            const oldTheme = appliedTheme.value

            currentTheme.value = theme
            followSystemTheme.value = theme === THEMES.AUTO
            saveThemeSettings()

            // 显示过渡动画
            if (showTransition && oldTheme !== theme && typeof window !== 'undefined') {
                showThemeTransition(oldTheme, theme)
            }

            // 显示主题切换成功消息
            if (typeof window !== 'undefined' && (window as any).showNotification) {
                (window as any).showNotification(SUCCESS_MESSAGES.THEME_CHANGED, 'success')
            }
        }
    }

    // 切换主题 (循环切换所有主题)
    const toggleTheme = (showTransition = false) => {
        const themes = [THEMES.LIGHT, THEMES.DARK, THEMES.HIGH_CONTRAST, THEMES.SEPIA]

        if (followSystemTheme.value) {
            // 如果当前跟随系统，切换到明色主题
            setTheme(THEMES.LIGHT, showTransition)
        } else {
            // 循环切换主题
            const currentIndex = themes.indexOf(currentTheme.value)
            const nextIndex = (currentIndex + 1) % themes.length
            setTheme(themes[nextIndex], showTransition)
        }
    }

    // 快速切换明暗主题
    const quickToggleTheme = (showTransition = true) => {
        if (followSystemTheme.value) {
            // 如果当前跟随系统，切换到相反的主题
            const oppositeTheme = systemTheme.value === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK
            setTheme(oppositeTheme, showTransition)
        } else {
            // 在明色和暗色之间切换
            const newTheme = currentTheme.value === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK
            setTheme(newTheme, showTransition)
        }
    }

    // 设置跟随系统主题
    const setFollowSystemTheme = (follow: boolean) => {
        followSystemTheme.value = follow
        if (follow) {
            currentTheme.value = THEMES.AUTO
        }
        saveThemeSettings()
    }

    // 加载主题设置
    const loadThemeSettings = () => {
        const settings = storage.get(STORAGE_KEYS.THEME, {
            theme: THEMES.DARK,
            followSystemTheme: false
        }) as ThemeSettings

        currentTheme.value = settings.theme
        followSystemTheme.value = settings.followSystemTheme

        // 如果设置为跟随系统，检测系统主题
        if (followSystemTheme.value) {
            detectSystemTheme()
        }
    }

    // 初始化主题系统
    const initializeTheme = () => {
        // 加载保存的设置
        loadThemeSettings()

        // 检测系统主题
        const mediaQuery = detectSystemTheme()

        // 监听系统主题变化
        if (mediaQuery) {
            mediaQuery.addEventListener('change', (e) => {
                systemTheme.value = e.matches ? THEMES.DARK : THEMES.LIGHT
            })
        }

        // 应用初始主题
        applyThemeToCSS()

        // 延迟预加载其他主题以避免启动时的布局抖动
        const preloadOtherThemes = () => {
            Object.keys(THEME_CONFIG).forEach(theme => {
                if (theme !== appliedTheme.value) {
                    preloadTheme(theme)
                }
            })
        }

        if (typeof requestIdleCallback !== 'undefined') {
            requestIdleCallback(preloadOtherThemes, { timeout: 5000 })
        } else {
            setTimeout(preloadOtherThemes, 2000)
        }
    }

    // 监听主题变化
    watch(appliedTheme, () => {
        applyThemeToCSS()
    })

    // 监听系统主题变化
    watch(systemTheme, () => {
        if (followSystemTheme.value) {
            applyThemeToCSS()
        }
    })

    // 获取主题信息
    const getThemeInfo = () => {
        return {
            current: appliedTheme.value,
            config: themeConfig.value,
            isFollowingSystem: followSystemTheme.value,
            systemTheme: systemTheme.value,
            availableThemes: Object.values(THEMES)
        }
    }

    return {
        // 状态
        currentTheme,
        followSystemTheme,
        systemTheme,

        // 计算属性
        appliedTheme,
        themeConfig,
        colors,

        // 方法
        setTheme,
        toggleTheme,
        quickToggleTheme,
        setFollowSystemTheme,
        initializeTheme,
        getThemeInfo,
        getThemeConfig,
        getThemeStats,
        detectSystemTheme,
        applyThemeToCSS,
        updateMonacoTheme,
        preloadTheme,
        showThemeTransition
    }
})
