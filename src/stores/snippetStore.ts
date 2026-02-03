/**
 * SnippetsHub - 专业代码片段管理工具
 * 
 * @file snippetStore.ts - 代码片段状态管理
 * @author Noah
 * @description 代码片段的状态管理存储，负责与Tauri后端的数据交互
 * @created 2026-01-10
 * @modified 2026-01-29
 * @version 1.0.0
 * 
 * 功能特性:
 * - 代码片段CRUD操作
 * - 文件夹管理和组织
 * - 搜索和过滤状态
 * - 标签和语言管理
 * - 收藏和历史记录
 * - 数据同步和缓存
 * - 批量操作支持
 * - 错误处理和重试
 */
import { defineStore } from 'pinia'
import { invoke } from '@tauri-apps/api/core'
import type { Snippet, Folder } from '../types/models'

interface SnippetState {
    snippets: Snippet[];
    folders: Folder[];
    searchResults: Snippet[]; // New
    currentSnippet: Snippet | null;
    searchQuery: string;
    selectedTags: string[];
    selectedLanguage: string | null;
    isSearching: boolean; // New: true if search query is active/results valid
}

export const useSnippetStore = defineStore('snippet', {
    state: (): SnippetState => ({
        snippets: [],
        folders: [],
        searchResults: [],
        currentSnippet: null,
        searchQuery: '',
        selectedTags: [],
        selectedLanguage: null,
        isSearching: false,
    }),

    actions: {
        // ... (loadSnippets, etc. keep as is)

        async loadSnippets() {
            try {
                const rawSnippets = await invoke<Snippet[]>('get_all_snippets')
                // Transform snake_case fields to camelCase for frontend compatibility
                this.snippets = rawSnippets.map(snippet => ({
                    ...snippet,
                    isFavorite: Boolean(snippet.is_favorite) // Ensure boolean type
                }))
            } catch (error) {
                console.error('Failed to load snippets:', error)
            }
        },

        async loadFolders() {
            try {
                this.folders = await invoke<Folder[]>('get_all_folders')
            } catch (error) {
                console.error('Failed to load folders:', error)
            }
        },

        async createSnippet(data: Omit<Snippet, 'id' | 'created_at' | 'updated_at' | 'usage_count' | 'is_favorite'> & Partial<Snippet>) {
            try {
                const snippet = await invoke<Snippet>('create_snippet', { req: data })
                // Transform snake_case fields to camelCase for frontend compatibility
                const transformedSnippet = {
                    ...snippet,
                    isFavorite: Boolean(snippet.is_favorite)
                }
                this.snippets.push(transformedSnippet)
                return transformedSnippet
            } catch (error) {
                console.error('Failed to create snippet:', error)
                throw error
            }
        },

        async updateSnippet(data: Partial<Snippet> & { id: string }) {
            try {
                const snippet = await invoke<Snippet>('update_snippet', { req: data })

                // Transform snake_case fields to camelCase for frontend compatibility
                const transformedSnippet = {
                    ...snippet,
                    isFavorite: Boolean(snippet.is_favorite)
                }

                const index = this.snippets.findIndex(s => s.id === snippet.id)

                if (index !== -1) {
                    // Use splice to ensure reactivity is triggered
                    this.snippets.splice(index, 1, transformedSnippet)
                }
                return transformedSnippet
            } catch (error) {
                console.error('Failed to update snippet:', error)
                throw error
            }
        },

        async deleteSnippet(id: string) {
            try {
                await invoke('delete_snippet', { id })
                this.snippets = this.snippets.filter(s => s.id !== id)
            } catch (error) {
                console.error('Failed to delete snippet:', error)
                throw error
            }
        },

        async searchSnippets(keyword: string, tags: string[] | null = null, language: string | null = null) {
            this.searchQuery = keyword;
            this.selectedTags = tags || [];
            this.selectedLanguage = language;

            // If clearing search
            if (!keyword && (!tags || tags.length === 0) && !language) {
                this.isSearching = false;
                this.searchResults = [];
                return;
            }

            try {
                this.isSearching = true;
                const results = await invoke<Snippet[]>('search_snippets', {
                    query: { keyword, tags, language }
                })
                this.searchResults = results
                return results
            } catch (error) {
                console.error('Failed to search snippets:', error)
                this.searchResults = []
                return []
            }
        },
        // ...

        async createFolder(name: string, parentId: string | null = null) {
            try {
                const folder = await invoke<Folder>('create_folder', { name, parentId })
                this.folders.push(folder)
                return folder
            } catch (error) {
                console.error('Failed to create folder:', error)
                throw error
            }
        },

        async deleteFolder(id: string) {
            try {
                await invoke('delete_folder', { id })
                this.folders = this.folders.filter(f => f.id !== id)
            } catch (error) {
                console.error('Failed to delete folder:', error)
                throw error
            }
        },

        setCurrentSnippet(snippet: Snippet | null) {
            this.currentSnippet = snippet
        },
    },

    getters: {
        filteredSnippets: (state): Snippet[] => {
            let results = state.snippets

            if (state.searchQuery) {
                const query = state.searchQuery.toLowerCase()
                results = results.filter(s =>
                    s.title.toLowerCase().includes(query) ||
                    (s.description && s.description.toLowerCase().includes(query)) ||
                    s.code.toLowerCase().includes(query)
                )
            }

            if (state.selectedTags.length > 0) {
                results = results.filter(s =>
                    state.selectedTags.every(tag => s.tags.includes(tag))
                )
            }

            if (state.selectedLanguage) {
                results = results.filter(s => s.language === state.selectedLanguage)
            }

            return results
        },

        allTags: (state): string[] => {
            const tags = new Set<string>()
            state.snippets.forEach(s => s.tags.forEach(tag => tags.add(tag)))
            return Array.from(tags)
        },

        allLanguages: (state): string[] => {
            const languages = new Set<string>()
            state.snippets.forEach(s => languages.add(s.language))
            return Array.from(languages)
        },
    },
})
