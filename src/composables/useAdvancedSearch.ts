import { ref, computed, watch, type Ref } from 'vue'
import { debounce } from '../utils'
import { performanceMonitor } from '../utils/performance'
import { searchCache } from '../utils/cache'
import type { Snippet } from '../types/models'

// 搜索配置接口
export interface SearchOptions {
    searchFields?: string[];
    fuzzyThreshold?: number;
    debounceDelay?: number;
    maxResults?: number;
    enableCache?: boolean;
    enableHighlight?: boolean;
    enableSuggestions?: boolean;
    [key: string]: any;
}

// 过滤器接口
export interface Filter {
    id: number;
    field: string;
    operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan' | 'between' | 'in' | 'notIn' | 'exists' | 'notExists';
    value: any;
}

// 搜索选项接口
export interface AdvancedSearchOptions {
    caseSensitive: boolean;
    wholeWord: boolean;
    includeCode: boolean;
    includeTags: boolean;
    includeComments: boolean;
    dateRange: { start: Date; end: Date } | null;
    languageFilter: string[] | null;
    authorFilter: string[] | null;
}

// 搜索统计接口
export interface SearchStats {
    query?: string;
    mode?: string;
    resultCount?: number;
    searchTime?: number;
    timestamp?: number;
}

// 搜索结果项接口
export interface SearchResultItem extends Snippet {
    _searchScore?: number;
    _searchHighlights?: Record<string, string>;
    _matchedFields?: string[];
}

/**
 * 高级搜索组合式函数
 * 提供智能搜索、过滤、排序等功能
 */
export function useAdvancedSearch(items: Ref<Snippet[]>, options: SearchOptions = {}) {
    // 配置选项
    const config = {
        searchFields: ['title', 'description', 'content', 'tags'],
        fuzzyThreshold: 0.6,
        debounceDelay: 150,
        maxResults: 100,
        enableCache: true,
        enableHighlight: true,
        enableSuggestions: true,
        ...options
    }

    // 搜索状态
    const searchQuery = ref('')
    const searchMode = ref<'fuzzy' | 'exact' | 'regex' | 'semantic'>('fuzzy')
    const sortBy = ref<string>('relevance')
    const sortOrder = ref<'asc' | 'desc'>('desc')
    const filters = ref<Record<string, any>>({})
    const activeFilters = ref<Filter[]>([])

    // 搜索历史和建议
    const searchHistory = ref<string[]>([])
    const searchSuggestions = ref<string[]>([])
    const isSearching = ref(false)
    const searchStats = ref<SearchStats>({})

    // 高级搜索选项
    const searchOptions = ref<AdvancedSearchOptions>({
        caseSensitive: false,
        wholeWord: false,
        includeCode: true,
        includeTags: true,
        includeComments: true,
        dateRange: null,
        languageFilter: null,
        authorFilter: null
    })

    /**
     * 执行搜索
     */
    const performSearch = debounce(async (): Promise<SearchResultItem[]> => {
        if (!searchQuery.value.trim() && activeFilters.value.length === 0) {
            return (items.value || []) as SearchResultItem[]
        }

        isSearching.value = true
        const startTime = performance.now()

        try {
            // 检查缓存
            const cacheKey = generateCacheKey()
            if (config.enableCache) {
                const cached = searchCache.get(cacheKey)
                if (cached) {
                    isSearching.value = false
                    return cached as SearchResultItem[]
                }
            }

            // 执行搜索
            let results = await executeSearch()

            // 应用过滤器
            results = applyFilters(results)

            // 排序结果
            results = sortResults(results)

            // 限制结果数量
            if (results.length > (config.maxResults || 100)) {
                results = results.slice(0, config.maxResults)
            }

            // 缓存结果
            if (config.enableCache) {
                searchCache.set(cacheKey, results, 30000) // 30秒缓存
            }

            // 更新搜索历史
            updateSearchHistory()

            // 记录搜索统计
            const searchTime = performance.now() - startTime
            recordSearchStats(results.length, searchTime)

            return results
        } finally {
            isSearching.value = false
        }
    }, config.debounceDelay)

    /**
     * 执行具体搜索逻辑
     */
    async function executeSearch(): Promise<SearchResultItem[]> {
        const query = searchQuery.value.trim()
        const sourceItems = (items.value || []) as SearchResultItem[]

        if (!query) {
            return sourceItems
        }

        switch (searchMode.value) {
            case 'exact':
                return exactSearch(sourceItems, query)
            case 'regex':
                return regexSearch(sourceItems, query)
            case 'semantic':
                return await semanticSearch(sourceItems, query)
            case 'fuzzy':
            default:
                return fuzzySearch(sourceItems, query)
        }
    }

    /**
     * 精确搜索
     */
    function exactSearch(sourceItems: SearchResultItem[], query: string): SearchResultItem[] {
        const searchTerm = searchOptions.value.caseSensitive ? query : query.toLowerCase()

        return sourceItems.filter(item => {
            return config.searchFields.some(field => {
                const value = getFieldValue(item, field)
                const searchValue = searchOptions.value.caseSensitive ? value : value.toLowerCase()

                if (searchOptions.value.wholeWord) {
                    const regex = new RegExp(`\\b${escapeRegex(searchTerm)}\\b`, 'g')
                    return regex.test(searchValue)
                }

                return searchValue.includes(searchTerm)
            })
        }).map(item => ({
            ...item,
            _searchScore: calculateExactScore(item, query),
            _searchHighlights: config.enableHighlight ? generateHighlights(item, query) : undefined
        }))
    }

    // Placeholder for exact score calculation
    function calculateExactScore(item: Snippet, query: string): number {
        // Simple implementation: check if title or code contains query
        // Higher score for title match
        const titleMatch = item.title.toLowerCase().includes(query.toLowerCase());
        return titleMatch ? 1.0 : 0.5;
    }

    /**
     * 正则表达式搜索
     */
    function regexSearch(sourceItems: SearchResultItem[], query: string): SearchResultItem[] {
        try {
            const flags = searchOptions.value.caseSensitive ? 'g' : 'gi'
            const regex = new RegExp(query, flags)

            return sourceItems.filter(item => {
                return config.searchFields.some(field => {
                    const value = getFieldValue(item, field)
                    return regex.test(value)
                })
            }).map(item => ({
                ...item,
                _searchScore: calculateRegexScore(item, regex),
                _searchHighlights: config.enableHighlight ? generateRegexHighlights(item, regex) : undefined
            }))
        } catch (error) {
            console.warn('Invalid regex pattern:', error)
            return []
        }
    }

    function calculateRegexScore(item: Snippet, regex: RegExp): number {
        return regex.test(item.title) ? 1.0 : 0.5;
    }

    function generateRegexHighlights(item: Snippet, regex: RegExp): Record<string, string> {
        // Simplified highlight logic for regex
        return {};
    }


    /**
     * 模糊搜索
     */
    function fuzzySearch(sourceItems: SearchResultItem[], query: string): SearchResultItem[] {
        const results: SearchResultItem[] = []
        const queryTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 0)

        sourceItems.forEach(item => {
            const scores: { field: string, score: number, weight: number }[] = []
            const highlights: Record<string, string> = {}

            config.searchFields.forEach(field => {
                const value = getFieldValue(item, field)
                const fieldScore = calculateFuzzyScore(value, queryTerms)

                if (fieldScore > 0) {
                    scores.push({
                        field,
                        score: fieldScore,
                        weight: getFieldWeight(field)
                    })

                    if (config.enableHighlight) {
                        highlights[field] = generateFuzzyHighlights(value, queryTerms)
                    }
                }
            })

            if (scores.length > 0) {
                const totalScore = scores.reduce((sum, s) => sum + (s.score * s.weight), 0)
                const maxWeight = scores.reduce((sum, s) => sum + s.weight, 0)
                const normalizedScore = totalScore / maxWeight

                if (normalizedScore >= (config.fuzzyThreshold || 0.6)) {
                    results.push({
                        ...item,
                        _searchScore: normalizedScore,
                        _searchHighlights: highlights,
                        _matchedFields: scores.map(s => s.field)
                    })
                }
            }
        })

        return results
    }

    /**
     * 语义搜索（简化版本）
     */
    async function semanticSearch(sourceItems: SearchResultItem[], query: string): Promise<SearchResultItem[]> {
        // 这里可以集成更复杂的语义搜索算法
        // 目前使用增强的模糊搜索作为替代
        const synonyms = await getSynonyms(query)
        const expandedQuery = [query, ...synonyms].join(' ')

        return fuzzySearch(sourceItems, expandedQuery)
    }

    /**
     * 获取同义词（模拟）
     */
    async function getSynonyms(query: string): Promise<string[]> {
        // 简单的同义词映射
        const synonymMap: Record<string, string[]> = {
            'function': ['method', 'procedure', 'routine'],
            'variable': ['var', 'field', 'property'],
            'class': ['type', 'object', 'entity'],
            'error': ['exception', 'bug', 'issue'],
            'data': ['information', 'content', 'value']
        }

        const words = query.toLowerCase().split(/\s+/)
        const synonyms: string[] = []

        words.forEach(word => {
            if (synonymMap[word]) {
                synonyms.push(...synonymMap[word])
            }
        })

        return synonyms
    }

    /**
     * 应用过滤器
     */
    function applyFilters(results: SearchResultItem[]): SearchResultItem[] {
        return results.filter(item => {
            return activeFilters.value.every(filter => {
                return applyFilter(item, filter)
            })
        })
    }

    /**
     * 应用单个过滤器
     */
    function applyFilter(item: SearchResultItem, filter: Filter): boolean {
        const { field, operator, value } = filter
        const itemValue = getFieldValue(item, field)

        switch (operator) {
            case 'equals':
                return itemValue === value
            case 'contains':
                return itemValue.toString().toLowerCase().includes(value.toLowerCase())
            case 'startsWith':
                return itemValue.toString().toLowerCase().startsWith(value.toLowerCase())
            case 'endsWith':
                return itemValue.toString().toLowerCase().endsWith(value.toLowerCase())
            case 'greaterThan':
                return itemValue > value
            case 'lessThan':
                return itemValue < value
            case 'between':
                return itemValue >= value.min && itemValue <= value.max
            case 'in':
                return Array.isArray(value) && value.includes(itemValue)
            case 'notIn':
                return Array.isArray(value) && !value.includes(itemValue)
            case 'exists':
                return itemValue !== null && itemValue !== undefined
            case 'notExists':
                return itemValue === null || itemValue === undefined
            default:
                return true
        }
    }

    /**
     * 排序结果
     */
    function sortResults(results: SearchResultItem[]): SearchResultItem[] {
        return results.sort((a, b) => {
            let aValue: any, bValue: any

            switch (sortBy.value) {
                case 'relevance':
                    aValue = a._searchScore || 0
                    bValue = b._searchScore || 0
                    break
                case 'date':
                    aValue = new Date(a.updated_at || a.created_at || 0).getTime()
                    bValue = new Date(b.updated_at || b.created_at || 0).getTime()
                    break
                case 'title':
                    aValue = (a.title || '').toLowerCase()
                    bValue = (b.title || '').toLowerCase()
                    break
                case 'size':
                    aValue = (a.code || '').length
                    bValue = (b.code || '').length
                    break
                default:
                    aValue = getFieldValue(a, sortBy.value)
                    bValue = getFieldValue(b, sortBy.value)
            }

            if (sortOrder.value === 'desc') {
                return bValue > aValue ? 1 : bValue < aValue ? -1 : 0
            } else {
                return aValue > bValue ? 1 : aValue < bValue ? -1 : 0
            }
        })
    }

    /**
     * 计算模糊搜索分数
     */
    function calculateFuzzyScore(text: string, queryTerms: string[]): number {
        const textLower = text.toLowerCase()
        let score = 0

        queryTerms.forEach(term => {
            if (textLower.includes(term)) {
                // 完全匹配得分更高
                score += term.length / text.length

                // 开头匹配额外加分
                if (textLower.startsWith(term)) {
                    score += 0.2
                }

                // 单词边界匹配额外加分
                const wordBoundaryRegex = new RegExp(`\\b${escapeRegex(term)}`, 'i')
                if (wordBoundaryRegex.test(text)) {
                    score += 0.1
                }
            } else {
                // 部分匹配
                const partialScore = calculatePartialMatch(textLower, term)
                score += partialScore * 0.5
            }
        })

        return Math.min(score, 1)
    }

    /**
     * 计算部分匹配分数
     */
    function calculatePartialMatch(text: string, term: string): number {
        let maxScore = 0

        for (let i = 0; i <= text.length - term.length; i++) {
            let matches = 0
            for (let j = 0; j < term.length; j++) {
                if (text[i + j] === term[j]) {
                    matches++
                }
            }
            const score = matches / term.length
            maxScore = Math.max(maxScore, score)
        }

        return maxScore
    }

    /**
     * 获取字段权重
     */
    function getFieldWeight(field: string): number {
        const weights: Record<string, number> = {
            title: 3,
            description: 2,
            tags: 2,
            content: 1,
            code: 1
        }
        return weights[field] || 1
    }

    /**
     * 获取字段值
     */
    function getFieldValue(item: any, field: string): string {
        if (field.includes('.')) {
            return field.split('.').reduce((obj: any, key: any) => obj?.[key], item) || ''
        }

        const value = item[field]

        if (Array.isArray(value)) {
            return value.join(' ')
        }

        return String(value || '')
    }

    /**
     * 生成高亮
     */
    function generateHighlights(item: any, query: string): Record<string, string> {
        const highlights: Record<string, string> = {}
        const queryLower = query.toLowerCase()

        config.searchFields.forEach(field => {
            const value = getFieldValue(item, field)
            const valueLower = value.toLowerCase()

            if (valueLower.includes(queryLower)) {
                highlights[field] = value.replace(
                    new RegExp(escapeRegex(query), 'gi'),
                    '<mark>$&</mark>'
                )
            }
        })

        return highlights
    }

    /**
     * 生成模糊高亮
     */
    function generateFuzzyHighlights(text: string, queryTerms: string[]): string {
        let highlighted = text

        queryTerms.forEach(term => {
            const regex = new RegExp(escapeRegex(term), 'gi')
            highlighted = highlighted.replace(regex, '<mark>$&</mark>')
        })

        return highlighted
    }

    /**
     * 转义正则表达式特殊字符
     */
    function escapeRegex(string: string): string {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    }

    /**
     * 生成缓存键
     */
    function generateCacheKey(): string {
        return `search:${searchQuery.value}:${searchMode.value}:${sortBy.value}:${sortOrder.value}:${JSON.stringify(activeFilters.value)}`
    }

    /**
     * 更新搜索历史
     */
    function updateSearchHistory() {
        const query = searchQuery.value.trim()
        if (query && !searchHistory.value.includes(query)) {
            searchHistory.value.unshift(query)
            searchHistory.value = searchHistory.value.slice(0, 10) // 保留最近10条
        }
    }

    /**
     * 记录搜索统计
     */
    function recordSearchStats(resultCount: number, searchTime: number) {
        searchStats.value = {
            query: searchQuery.value,
            mode: searchMode.value,
            resultCount,
            searchTime: Math.round(searchTime),
            timestamp: Date.now()
        }

        performanceMonitor.recordMetric('search', 'advanced-search', {
            query: searchQuery.value.length,
            mode: searchMode.value,
            resultCount,
            duration: searchTime
        })
    }

    // 计算属性
    const searchResults = computed(() => {
        return performSearch()
    })

    // Has Active Filters
    const hasActiveFilters = computed(() => activeFilters.value.length > 0)

    // Search Summary
    const searchSummary = computed(() => {
        if (!searchStats.value.query) return null
        return {
            query: searchStats.value.query,
            count: searchStats.value.resultCount,
            time: searchStats.value.searchTime,
            mode: searchStats.value.mode
        }
    })

    // 方法
    function setSearchQuery(query: string) {
        searchQuery.value = query
    }

    function setSearchMode(mode: 'fuzzy' | 'exact' | 'regex' | 'semantic') {
        searchMode.value = mode
    }

    function setSortBy(field: string, order: 'asc' | 'desc' = 'desc') {
        sortBy.value = field
        sortOrder.value = order
    }

    function addFilter(field: string, operator: Filter['operator'], value: any) {
        const filter: Filter = { field, operator, value, id: Date.now() }
        activeFilters.value.push(filter)
    }

    function removeFilter(filterId: number) {
        activeFilters.value = activeFilters.value.filter(f => f.id !== filterId)
    }

    function clearFilters() {
        activeFilters.value = []
    }

    function clearSearch() {
        searchQuery.value = ''
        clearFilters()
    }

    function updateSearchOptions(options: Partial<AdvancedSearchOptions>) {
        Object.assign(searchOptions.value, options)
    }

    // 监听器
    watch(searchQuery, () => {
        if (config.enableSuggestions) {
            generateSuggestions()
        }
    })

    function generateSuggestions() {
        // 基于搜索历史和当前输入生成建议
        const query = searchQuery.value.toLowerCase()
        if (query.length < 2) {
            searchSuggestions.value = []
            return
        }

        const suggestions = searchHistory.value
            .filter(h => h.toLowerCase().includes(query))
            .slice(0, 5)

        searchSuggestions.value = suggestions
    }

    return {
        // 状态
        searchQuery,
        searchMode,
        sortBy,
        sortOrder,
        filters,
        activeFilters,
        searchHistory,
        searchSuggestions,
        isSearching,
        searchStats,
        searchOptions,

        // 计算属性
        searchResults,
        hasActiveFilters,
        searchSummary,

        // 方法
        setSearchQuery,
        setSearchMode,
        setSortBy,
        addFilter,
        removeFilter,
        clearFilters,
        clearSearch,
        updateSearchOptions,
        performSearch
    }
}

export default useAdvancedSearch
