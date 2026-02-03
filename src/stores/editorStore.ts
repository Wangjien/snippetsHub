/**
 * @file editorStore.ts
 * @description 编辑器状态管理 Store
 * @author Noah
 * 
 * 管理编辑器打开的 Tab 页签、当前活动 Tab、Diff 视图状态等。
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Snippet } from '../types/models'
import { generateId } from '../utils'

/**
 * 编辑器 Tab 页签数据结构
 */
export interface EditorTab {
    id: string; // unique tab instance id
    snippetId: string | null; // null for new unsaved snippet
    title: string;
    content: string;
    originalContent: string; // for diff
    language: string;
    isDirty: boolean; // has unsaved changes
    isNew: boolean; // is a new file not yet saved to db
    description?: string;
    tags: string[];
}

export const useEditorStore = defineStore('editor', () => {
    const tabs = ref<EditorTab[]>([])
    const activeTabId = ref<string | null>(null)
    const isDiffView = ref(false)

    const activeTab = computed(() => {
        return tabs.value.find(t => t.id === activeTabId.value) || null
    })

    // Open a snippet in a new tab or focus existing
    const openSnippet = (snippet: Snippet | null) => {
        // If snippet exists, check if already open
        if (snippet) {
            const existingTab = tabs.value.find(t => t.snippetId === snippet.id)
            if (existingTab) {
                activeTabId.value = existingTab.id
                return
            }
        }

        // Create new tab
        const newTab: EditorTab = {
            id: generateId(),
            snippetId: snippet ? snippet.id : null,
            title: snippet ? snippet.title : 'New Snippet',
            content: snippet ? snippet.code : '',
            originalContent: snippet ? snippet.code : '',
            language: snippet ? snippet.language : 'javascript',
            isDirty: false,
            isNew: !snippet,
            description: snippet?.description || '',
            tags: snippet?.tags ? [...snippet.tags] : []
        }

        tabs.value.push(newTab)
        activeTabId.value = newTab.id
    }

    const closeTab = (tabId: string) => {
        const index = tabs.value.findIndex(t => t.id === tabId)
        if (index === -1) return

        // If closing active tab, switch to another
        if (activeTabId.value === tabId) {
            const newActive = tabs.value[index + 1] || tabs.value[index - 1]
            activeTabId.value = newActive ? newActive.id : null
        }

        tabs.value.splice(index, 1)
    }

    const updateTabContent = (tabId: string, content: string) => {
        const tab = tabs.value.find(t => t.id === tabId)
        if (tab) {
            tab.content = content
            tab.isDirty = tab.content !== tab.originalContent
        }
    }

    const saveTab = (tabId: string, savedSnippet: Snippet) => {
        const tab = tabs.value.find(t => t.id === tabId)
        if (tab) {
            tab.snippetId = savedSnippet.id
            tab.title = savedSnippet.title
            tab.originalContent = savedSnippet.code
            tab.content = savedSnippet.code
            tab.language = savedSnippet.language
            tab.isDirty = false
            tab.isNew = false
        }
    }

    const toggleDiffView = () => {
        isDiffView.value = !isDiffView.value
    }

    return {
        tabs,
        activeTabId,
        activeTab,
        isDiffView,
        openSnippet,
        closeTab,
        updateTabContent,
        saveTab,
        toggleDiffView
    }
})
