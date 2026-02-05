/**
 * SnippetsHub - 代码片段管理工具
 * 
 * @file SnippetList.vue - 代码片段列表组件
 * @author Noah
 * @description 代码片段的展示和管理组件，支持多种显示模式和高级过滤功能
 * @created 2026-01-12
 * @modified 2026-01-29
 * @version 1.0.0
 * 
 * 功能特性:
 * - 三种显示模式：卡片、列表、紧凑
 * - 两种内容模式：代码、Markdown
 * - 高级搜索和过滤功能
 * - 虚拟列表支持大数据量
 * - 语言分类和标签管理
 * - 收藏和最近使用过滤
 * - 拖拽排序和批量操作
 * - 性能监控和用户行为分析
 */

<template>
  <div class="snippet-list">
    <!-- 专业级头部工具栏 -->
    <div class="list-header">
      <div class="header-left">
        <div class="title-section">
          <h2>代码片段</h2>
          <div class="statistics">
            <span class="stat-badge">{{ statistics.filtered }}/{{ statistics.total }}</span>
            <span v-if="statistics.favorites > 0" class="stat-badge favorites">
              <Star :size="12" />
              {{ statistics.favorites }}
            </span>
            <span v-if="isAdvancedSearching && searchStats.totalSearches > 0" class="stat-badge search-stats" title="搜索统计">
              <Search :size="12" />
              {{ searchStats.totalSearches }}
            </span>
          </div>
        </div>
      </div>
      <div class="header-right">
        <!-- 显示模式切换 -->
        <div class="display-mode-controls">
          <button 
            class="mode-btn"
            :class="{ active: displayMode === 'cards' }"
            @click="handleModeChange('cards')"
            title="卡片模式"
          >
            <LayoutGrid :size="16" />
            <span>卡片</span>
          </button>
          <button 
            class="mode-btn"
            :class="{ active: displayMode === 'list' }"
            @click="handleModeChange('list')"
            title="列表模式"
          >
            <List :size="16" />
            <span>列表</span>
          </button>
          <button 
            class="mode-btn"
            :class="{ active: displayMode === 'compact' }"
            @click="handleModeChange('compact')"
            title="紧凑模式"
          >
            <Rows :size="16" />
            <span>紧凑</span>
          </button>
        </div>
        
        <!-- 内容模式切换 -->
        <div class="content-mode-controls">
          <button 
            class="content-btn"
            :class="{ active: contentMode === 'code' }"
            @click="handleContentModeChange('code')"
            title="纯代码模式"
          >
            <Code2 :size="16" />
            <span>代码</span>
          </button>
          <button 
            class="content-btn"
            :class="{ active: contentMode === 'markdown' }"
            @click="handleContentModeChange('markdown')"
            title="Markdown模式"
          >
            <FileText :size="16" />
            <span>文档</span>
          </button>
        </div>
        
        <button @click="handleCreateClick" class="btn-create">
          <Plus :size="16" />
          新建片段
        </button>
        
        <!-- 选择模式按钮 -->
        <button 
          @click="toggleSelectionMode" 
          class="btn-select"
        :class="{ active: isSelectionMode }"
          :title="isSelectionMode ? '退出选择模式' : '选择模式'"
        >
          <CheckSquare :size="16" />
          {{ isSelectionMode ? '取消选择' : '选择' }}
        </button>
        
        <!-- 批量导出按钮 -->
<div class="dropdown" v-if="!isSelectionMode" @click.stop>
          <button class="btn-export" @click="showBatchExportMenu = !showBatchExportMenu">
            <Download :size="16" />
            批量导出
            <ChevronDown :size="14" class="dropdown-arrow" :class="{ open: showBatchExportMenu }" />
          </button>
          <div v-if="showBatchExportMenu" class="dropdown-menu batch-export-menu">
            <div class="submenu-section">
              <div class="submenu-title">导出所有片段</div>
              <button @click="batchExport('zip')" class="submenu-item">
                <Archive :size="14" />
                <span>ZIP压缩包</span>
              </button>
              <button @click="batchExport('json')" class="submenu-item">
                <Database :size="14" />
                <span>JSON数据</span>
              </button>
              <button @click="batchExport('markdown')" class="submenu-item">
                <FileText :size="14" />
                <span>Markdown文档</span>
              </button>
            </div>
            
            <div class="submenu-divider"></div>
            
            <div class="submenu-section">
              <div class="submenu-title">按语言导出</div>
              <button @click="batchExportByLanguage()" class="submenu-item">
                <Code2 :size="14" />
                <span>分语言打包</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 批量操作工具栏 -->
    <div v-if="isSelectionMode && selectedSnippetsCount > 0" class="batch-actions-bar">
      <div class="batch-info">
        <CheckSquare :size="18" class="batch-icon" />
        <span class="batch-count">已选择 {{ selectedSnippetsCount }} 个片段</span>
        <button @click="selectAll" v-if="!isAllSelected" class="batch-link">
          全选
        </button>
        <button @click="clearSelection" class="batch-link">
          清除
        </button>
      </div>
      <div class="batch-buttons">
        <button @click="batchExportSelected('json')" class="batch-btn">
          <Download :size="14" />
          导出为JSON
        </button>
        <button @click="batchExportSelected('markdown')" class="batch-btn">
          <FileText :size="14" />
          导出为Markdown
        </button>
        <button @click="batchExportSelected('zip')" class="batch-btn">
          <Archive :size="14" />
          导出为ZIP
        </button>
        <button @click="batchDeleteSelected" class="batch-btn delete">
          <Trash2 :size="14" />
          删除选中
        </button>
      </div>
    </div>

    <!-- 专业级搜索和过滤栏 -->
    <div class="search-filter-bar">
      <div class="search-section">
        <div class="search-box">
          <Search :size="18" class="search-icon" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索代码片段、标签、语言或内容..."
            class="search-input"
            @focus="showSearchSuggestions = true"
            @blur="hideSearchSuggestions"
          />
          
          <!-- 搜索建议下拉框 -->
          <div v-if="showSearchSuggestions && searchSuggestions.length > 0" class="search-suggestions">
            <div class="suggestions-header">
              <span class="suggestions-title">搜索建议</span>
              <span class="suggestions-count">{{ searchSuggestions.length }}</span>
            </div>
            <div class="suggestions-list">
              <button
                v-for="(suggestion, index) in searchSuggestions"
                :key="index"
                class="suggestion-item"
                @mousedown.prevent="selectSuggestion(suggestion)"
              >
                <Search :size="14" class="suggestion-icon" />
                <span class="suggestion-text">{{ suggestion }}</span>
              </button>
            </div>
          </div>
          
          <div class="search-actions">
            <button 
              class="advanced-search-btn"
              :class="{ active: showAdvancedSearch }"
              @click="showAdvancedSearch = !showAdvancedSearch"
              title="高级搜索选项"
            >
              <Filter :size="14" />
            </button>
            <button 
              v-if="searchQuery || selectedLanguage || selectedTags.length > 0 || showFavoritesOnly"
              @click="clearFilters"
              class="clear-btn"
              title="清除所有过滤条件"
            >
              <X :size="14" />
            </button>
          </div>
        </div>
      </div>

      <!-- 高级搜索面板 -->
      <div v-if="showAdvancedSearch" class="advanced-search-panel">
        <div class="advanced-search-header">
          <h4>高级搜索选项</h4>
          <button @click="resetAdvancedFilters" class="reset-filters-btn">
            重置所有过滤器
          </button>
        </div>
        
        <div class="advanced-filters-grid">
          <!-- 代码长度过滤 -->
          <div class="filter-group">
            <label>代码长度</label>
            <div class="range-inputs">
              <input
                v-model.number="advancedFilters.minLength"
                type="number"
                placeholder="最小"
                class="range-input"
                min="0"
              />
              <span class="range-separator">-</span>
              <input
                v-model.number="advancedFilters.maxLength"
                type="number"
                placeholder="最大"
                class="range-input"
                min="0"
              />
            </div>
          </div>
          
          <!-- 日期范围过滤 -->
          <div class="filter-group">
            <label>更新时间</label>
            <select v-model="dateRangeFilter" class="filter-select" @change="updateDateRange">
              <option value="">所有时间</option>
              <option value="today">今天</option>
              <option value="week">本周</option>
              <option value="month">本月</option>
              <option value="year">今年</option>
            </select>
          </div>
          
          <!-- 特殊过滤器 -->
          <div class="filter-group">
            <label>特殊条件</label>
            <div class="checkbox-group">
              <label class="checkbox-item">
                <input
                  v-model="advancedFilters.hasComments"
                  type="checkbox"
                  :indeterminate="advancedFilters.hasComments === null"
                  @change="toggleCommentsFilter"
                />
                <span>包含注释</span>
              </label>
            </div>
          </div>
          
          <!-- 搜索统计 -->
          <div class="filter-group" v-if="searchStats.totalSearches > 0">
            <label>搜索统计</label>
            <div class="search-stats-info">
              <div class="stat-item">
                <span class="stat-label">总搜索次数:</span>
                <span class="stat-value">{{ searchStats.totalSearches }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">平均结果数:</span>
                <span class="stat-value">{{ Math.round(searchStats.averageResultCount) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="filter-section">
        <!-- 快速过滤 -->
        <div class="quick-filters">
          <button 
            class="filter-chip"
            :class="{ active: showFavoritesOnly }"
            @click="showFavoritesOnly = !showFavoritesOnly"
          >
            <Star :size="14" />
            收藏
          </button>
          
          <button 
            class="filter-chip"
            :class="{ active: showRecentOnly }"
            @click="showRecentOnly = !showRecentOnly"
          >
            <Clock :size="14" />
            最近
          </button>
        </div>

        <!-- 语言过滤 -->
        <div class="language-filter custom-dropdown" @click.stop="">
          <button 
            class="filter-select-btn" 
            :class="{ active: showLanguageMenu || selectedLanguage }"
            @click="showLanguageMenu = !showLanguageMenu"
          >
            <span>{{ selectedLanguage || '所有语言' }}</span>
            <ChevronDown :size="14" class="dropdown-arrow" :class="{ open: showLanguageMenu }" />
          </button>
          
          <div v-if="showLanguageMenu" class="dropdown-menu language-menu">
            <button 
              class="menu-item"
              :class="{ active: !selectedLanguage }"
              @click="selectLanguage(null)"
            >
              所有语言
            </button>
            <button 
              v-for="lang in languages" 
              :key="lang" 
              class="menu-item"
              :class="{ active: selectedLanguage === lang }"
              @click="selectLanguage(lang)"
            >
              {{ lang }}
            </button>
          </div>
        </div>

        <!-- 排序控制 -->
        <div class="sort-controls">
          <select v-model="sortBy" class="sort-select">
            <option v-for="option in sortOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
          <button 
            class="sort-order-btn"
            @click="sortOrder = sortOrder === 'desc' ? 'asc' : 'desc'"
            :title="sortOrder === 'desc' ? '降序' : '升序'"
          >
            <ArrowUpDown :size="14" />
          </button>
        </div>
      </div>
    </div>

    <!-- 标签过滤 -->
    <div class="tags-filter" v-if="availableTags.length > 0">
      <div class="tags-container">
        <button
          v-for="tag in availableTags.slice(0, 10)"
          :key="tag"
          class="tag-filter"
          :class="{ active: selectedTags.includes(tag) }"
          @click="toggleTag(tag)"
        >
          <Tag :size="10" />
          {{ tag }}
        </button>
        <span v-if="availableTags.length > 10" class="more-tags">
          +{{ availableTags.length - 10 }} 更多
        </span>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div 
      ref="containerRef"
      class="snippets-container"
      :class="[`display-${displayMode}`, `content-${contentMode}`]"
    >
      <!-- 直接渲染所有项目，不使用虚拟列表 -->
      <div class="snippets-direct">
        <!-- 卡片模式 -->
        <template v-if="displayMode === 'cards'">
          <div
            v-for="snippet in filteredSnippets"
            :key="snippet.id"
            class="snippet-card"
            :class="{ selected: isSelectionMode && selectedSnippets.has(snippet.id) }"
            @click="isSelectionMode ? toggleSelection(snippet.id) : $emit('select', snippet)"
          >
            <!-- 选择框 -->
            <div 
              v-if="isSelectionMode" 
              class="selection-checkbox"
              @click.stop="toggleSelection(snippet.id)"
            >
              <div 
                class="checkbox-custom"
                :class="{ checked: selectedSnippets.has(snippet.id) }"
              >
                <svg v-if="selectedSnippets.has(snippet.id)" width="12" height="10" viewBox="0 0 12 10" fill="none">
                  <path d="M1 5L4.5 8.5L11 1.5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </div>
            
            <!-- 卡片头部 -->
            <div class="card-header">
              <div class="card-title-row">
                <div class="language-indicator" :class="`lang-${snippet.language.toLowerCase()}`">
                  <i v-if="typeof getLanguageIcon(snippet.language) === 'string'" :class="getLanguageIcon(snippet.language)" style="font-size: 16px;"></i>
                  <component v-else :is="getLanguageIcon(snippet.language)" :size="16" />
                </div>
                <h3 class="card-title" v-html="highlightText(snippet.title, searchQuery)"></h3>
                <div class="card-actions">
                  <button 
                    class="action-btn favorite-btn"
                    :class="{ 
                      active: snippet.isFavorite,
                      'just-favorited': justFavoritedItems.has(snippet.id)
                    }"
                    @click.stop.prevent="toggleFavorite(snippet, $event)"
                    title="收藏"
                  >
                    <Star :size="14" />
                  </button>
                  <div class="dropdown" @click.stop>
                    <button class="action-btn dropdown-btn" @click="toggleCardMenu(snippet.id)">
                      <MoreHorizontal :size="14" />
                    </button>
                    <div v-if="activeCardMenu === snippet.id" class="dropdown-menu">
                      <button @click="$emit('edit', snippet)" class="menu-item">
                        <Edit :size="14" />
                        编辑
                      </button>
                      <button @click="copyToClipboard(snippet)" class="menu-item">
                        <Copy :size="14" />
                        复制
                      </button>

                      <div class="menu-divider"></div>
                      
                      <!-- 导出选项 - 简化版本 -->
                      <button @click="showExportOptions(snippet)" class="menu-item">
                        <Download :size="14" />
                        导出代码
                      </button>

                      <div class="menu-divider"></div>
                      
                      <!-- 同步选项 - 改为模态框形式 -->
                      <button @click="showSyncOptions(snippet)" class="menu-item">
                        <GitGraph :size="14" />
                        同步到平台
                      </button>

                      <div class="menu-divider"></div>
                      <button @click="confirmDelete(snippet)" class="menu-item delete-item">
                        <Trash2 :size="14" />
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div class="card-meta">
                <span class="language-tag">{{ snippet.language }}</span>
                <span class="lines-count">{{ getCodeLineCount(snippet.code) }} 行</span>
                <span class="update-time">{{ formatRelativeTime(snippet.updated_at) }}</span>
                <span v-if="cloudStore.isSyncedToPlatform(snippet.id, 'github')" class="synced-badge github" title="已同步到 GitHub">
                  <Github :size="14" />
                </span>
                <span v-if="cloudStore.isSyncedToPlatform(snippet.id, 'gitee')" class="synced-badge gitee" title="已同步到 Gitee">
                  <GitGraph :size="14" />
                </span>
                <span v-if="cloudStore.isSyncedToPlatform(snippet.id, 'gitlab')" class="synced-badge gitlab" title="已同步到 GitLab">
                  <Gitlab :size="14" />
                </span>
              </div>
            </div>

            <!-- 内容区域 - 根据模式显示不同内容 -->
            <div class="card-content">
              <!-- 纯代码模式 -->
              <div v-if="contentMode === 'code'" class="code-preview">
                <div class="code-header">
                  <div class="window-controls">
                    <span class="control-dot red"></span>
                    <span class="control-dot yellow"></span>
                    <span class="control-dot green"></span>
                  </div>
                  <span class="file-name">{{ getFileName(snippet) }}</span>
                  <button class="copy-code-btn" @click.stop="copyToClipboard(snippet)" title="复制代码">
                    <Copy :size="12" />
                  </button>
                </div>
                <div class="code-body">
                  <pre><code class="language-highlight">{{ getCodePreview(snippet.code) }}</code></pre>
                  <div v-if="snippet.code.length > 300" class="code-fade"></div>
                </div>
              </div>

              <!-- Markdown 模式 -->
              <div v-else class="markdown-preview">
                <div class="description-section" v-if="snippet.description">
                  <h4>描述</h4>
                  <p>{{ snippet.description }}</p>
                </div>
                <div class="code-section">
                  <h4>代码</h4>
                  <div class="code-snippet">
                    <div class="snippet-header">
                      <span class="language">{{ snippet.language }}</span>
                      <button class="copy-btn" @click.stop="copyToClipboard(snippet)">
                        <Copy :size="12" />
                        复制
                      </button>
                    </div>
                    <pre><code>{{ getCodePreview(snippet.code) }}</code></pre>
                  </div>
                </div>
                <div class="usage-section" v-if="snippet.usage_count">
                  <h4>使用说明</h4>
                  <p>此代码片段已被使用 {{ snippet.usage_count }} 次</p>
                </div>
              </div>
            </div>

            <!-- 标签和底部信息 -->
            <div class="card-footer">
              <div class="tags-section" v-if="snippet.tags && snippet.tags.length > 0">
                <span v-for="tag in snippet.tags.slice(0, 3)" :key="tag" class="tag">
                  {{ tag }}
                </span>
                <span v-if="snippet.tags.length > 3" class="tag-more">
                  +{{ snippet.tags.length - 3 }}
                </span>
              </div>
              <div class="footer-actions">
                <button class="use-btn" @click.stop="$emit('select', snippet)" title="使用代码">
                  <Play :size="14" />
                  使用
                </button>
              </div>
            </div>
          </div>
        </template>

        <!-- 列表模式 -->
        <template v-else-if="displayMode === 'list'">
          <div
            v-for="snippet in filteredSnippets"
            :key="snippet.id"
            class="snippet-row"
            @click="$emit('select', snippet)"
          >
            <div class="row-left">
              <div class="language-indicator" :class="`lang-${snippet.language.toLowerCase()}`">
                <i v-if="typeof getLanguageIcon(snippet.language) === 'string'" :class="getLanguageIcon(snippet.language)" style="font-size: 16px;"></i>
                <component v-else :is="getLanguageIcon(snippet.language)" :size="16" />
              </div>
              <div class="row-content">
                <div class="row-header">
                <h4 class="row-title" v-html="highlightText(snippet.title, searchQuery)"></h4>
                  <div class="row-meta">
                    <span class="language">{{ snippet.language }}</span>
                    <span class="lines">{{ getCodeLineCount(snippet.code) }} 行</span>
                    <span class="date">{{ formatRelativeTime(snippet.updated_at) }}</span>
                    <span v-if="cloudStore.isSyncedToPlatform(snippet.id, 'github')" class="synced-badge-row github" title="GitHub">
                      <Github :size="14" />
                    </span>
                    <span v-if="cloudStore.isSyncedToPlatform(snippet.id, 'gitee')" class="synced-badge-row gitee" title="Gitee">
                      <GitGraph :size="14" />
                    </span>
                    <span v-if="cloudStore.isSyncedToPlatform(snippet.id, 'gitlab')" class="synced-badge-row gitlab" title="GitLab">
                      <Gitlab :size="14" />
                    </span>
                  </div>
                </div>
                <p class="row-description">{{ snippet.description || '暂无描述' }}</p>
                <div class="row-tags" v-if="snippet.tags && snippet.tags.length > 0">
                  <span v-for="tag in snippet.tags.slice(0, 4)" :key="tag" class="tag-small">
                    {{ tag }}
                  </span>
                </div>
              </div>
            </div>
            <div class="row-right">
              <div class="row-actions">
                <button 
                  class="action-btn favorite-btn"
                  :class="{ 
                    active: snippet.isFavorite,
                    'just-favorited': justFavoritedItems.has(snippet.id)
                  }"
                  @click.stop.prevent="toggleFavorite(snippet, $event)"
                >
                  <Star :size="14" />
                </button>
                <button @click.stop="copyToClipboard(snippet)" class="action-btn" title="复制">
                  <Copy :size="14" />
                </button>
                <button @click.stop="$emit('edit', snippet)" class="action-btn" title="编辑">
                  <Edit :size="14" />
                </button>
                <button @click.stop="confirmDelete(snippet)" class="action-btn delete-btn" title="删除代码片段">
                  <Trash2 :size="14" />
                  <span class="delete-text">删除</span>
                </button>
              </div>
            </div>
          </div>
        </template>

        <!-- 紧凑模式 -->
        <template v-else>
          <div
            v-for="snippet in filteredSnippets"
            :key="snippet.id"
            class="snippet-compact"
            @click="$emit('select', snippet)"
          >
            <div class="compact-left">
              <div class="language-indicator" :class="`lang-${snippet.language.toLowerCase()}`">
                <i v-if="typeof getLanguageIcon(snippet.language) === 'string'" :class="getLanguageIcon(snippet.language)" style="font-size: 14px;"></i>
                <component v-else :is="getLanguageIcon(snippet.language)" :size="14" />
              </div>
              <span class="compact-title" v-html="highlightText(snippet.title, searchQuery)"></span>
            </div>
            <div class="compact-center">
              <span class="compact-description">{{ snippet.description || '暂无描述' }}</span>
            </div>
            <div class="compact-right">
              <span class="compact-meta">
                <span v-if="cloudStore.isSyncedToPlatform(snippet.id, 'github')" class="sync-icon-mini github" title="GitHub"><Github :size="12" /></span>
                <span v-if="cloudStore.isSyncedToPlatform(snippet.id, 'gitee')" class="sync-icon-mini gitee" title="Gitee"><GitGraph :size="12" /></span>
                <span v-if="cloudStore.isSyncedToPlatform(snippet.id, 'gitlab')" class="sync-icon-mini gitlab" title="GitLab"><Gitlab :size="12" /></span>
                {{ snippet.language }} • {{ formatRelativeTime(snippet.updated_at) }}
              </span>
              <div class="compact-actions">
                <button 
                  class="action-btn favorite-btn"
                  :class="{ 
                    active: snippet.isFavorite,
                    'just-favorited': justFavoritedItems.has(snippet.id)
                  }"
                  @click.stop.prevent="toggleFavorite(snippet, $event)"
                  title="收藏"
                >
                  <Star :size="12" />
                </button>
                <button @click.stop="copyToClipboard(snippet)" class="action-btn" title="复制代码">
                  <Copy :size="12" />
                </button>
                <button @click.stop="$emit('edit', snippet)" class="action-btn" title="编辑">
                  <Edit :size="12" />
                </button>
                <button @click.stop="confirmDelete(snippet)" class="action-btn delete-btn-compact" title="删除代码片段">
                  <Trash2 :size="12" />
                </button>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- 加载骨架屏 -->
    <SkeletonLoader 
      v-if="isLoading" 
      :variant="displayMode" 
      :count="6" 
    />

    <!-- 空状态 -->
    <EmptyState
      v-else-if="filteredSnippets.length === 0"
      :icon="searchQuery ? SearchIcon : Code2"
      :title="searchQuery ? '没有找到匹配的代码片段' : '还没有代码片段'"
      :description="searchQuery ? `未找到与 '${searchQuery}' 匹配的结果` : '创建你的第一个代码片段来开始管理代码'"
      :variant="searchQuery ? 'search' : 'default'"
      :primary-action="searchQuery ? '' : '创建代码片段'"
      :primary-icon="Plus"
      :secondary-action="searchQuery ? '清除搜索' : ''"
      :tips="searchQuery ? [] : ['按 Cmd/Ctrl + N 快速创建新片段', '支持多种编程语言语法高亮', '使用标签组织你的代码库']"
      @primary-action="emit('create')"
      @secondary-action="clearFilters"
    />

    <!-- 回到顶部按钮 -->
    <button 
      v-if="filteredSnippets.length > 20"
      @click="scrollToTop"
      class="scroll-to-top"
      title="回到顶部"
    >
      ↑
    </button>

    <!-- 同步选项弹窗 -->
    <div v-if="showSyncModal" class="modal-overlay" @click="closeSyncModal">
      <div class="sync-modal" @click.stop>
        <div class="modal-header">
          <h3>同步到平台</h3>
          <button @click="closeSyncModal" class="modal-close-btn">
            <X :size="16" />
          </button>
        </div>
        
        <div class="modal-body">
          <div class="sync-options">
            <div class="sync-section">
              <h4>选择同步平台</h4>
              <div class="sync-buttons">
                <button @click="handleSync(syncTarget, 'github')" class="sync-btn" :disabled="isSyncing(syncTarget?.id, 'github')">
                  <component :is="isSyncing(syncTarget?.id, 'github') ? Loader2 : Github" :size="20" :class="{ spin: isSyncing(syncTarget?.id, 'github') }" />
                  <div class="sync-info">
                    <span class="platform-name">GitHub</span>
                    <span class="sync-status">{{ syncTarget && cloudStore.isSyncedToPlatform(syncTarget.id, 'github') ? '已同步 - 点击更新' : '点击同步' }}</span>
                  </div>
                </button>
                
                <button @click="handleSync(syncTarget, 'gitee')" class="sync-btn" :disabled="isSyncing(syncTarget?.id, 'gitee')">
                  <component :is="isSyncing(syncTarget?.id, 'gitee') ? Loader2 : GitGraph" :size="20" :class="{ spin: isSyncing(syncTarget?.id, 'gitee') }" />
                  <div class="sync-info">
                    <span class="platform-name">Gitee</span>
                    <span class="sync-status">{{ syncTarget && cloudStore.isSyncedToPlatform(syncTarget.id, 'gitee') ? '已同步 - 点击更新' : '点击同步' }}</span>
                  </div>
                </button>
                
                <button @click="handleSync(syncTarget, 'gitlab')" class="sync-btn" :disabled="isSyncing(syncTarget?.id, 'gitlab')">
                  <component :is="isSyncing(syncTarget?.id, 'gitlab') ? Loader2 : Gitlab" :size="20" :class="{ spin: isSyncing(syncTarget?.id, 'gitlab') }" />
                  <div class="sync-info">
                    <span class="platform-name">GitLab</span>
                    <span class="sync-status">{{ syncTarget && cloudStore.isSyncedToPlatform(syncTarget.id, 'gitlab') ? '已同步 - 点击更新' : '点击同步' }}</span>
                  </div>
                </button>
              </div>
            </div>
            
            <div class="sync-section">
              <h4>同步说明</h4>
              <div class="sync-description">
                <p>• 首次同步会在对应平台创建新的代码片段</p>
                <p>• 已同步的片段会更新现有内容</p>
                <p>• 同步后可在对应平台查看和管理代码</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 导出选项弹窗 -->
    <div v-if="showExportModal" class="modal-overlay" @click="closeExportModal">
      <div class="export-modal" @click.stop>
        <div class="modal-header">
          <h3>导出代码片段</h3>
          <button @click="closeExportModal" class="modal-close-btn">
            <X :size="16" />
          </button>
        </div>
        
        <div class="modal-body">
          <div class="export-options">
            <div class="export-section">
              <h4>单文件导出</h4>
              <div class="export-buttons">
                <button @click="exportSnippet(exportTarget, 'code')" class="export-btn">
                  <FileCode :size="16" />
                  <span>代码文件 (.{{ exportTarget ? getFileExtension(exportTarget.language) : 'txt' }})</span>
                </button>
                <button @click="exportSnippet(exportTarget, 'markdown')" class="export-btn">
                  <FileText :size="16" />
                  <span>Markdown文档</span>
                </button>
                <button @click="exportSnippet(exportTarget, 'html')" class="export-btn">
                  <Globe :size="16" />
                  <span>HTML页面</span>
                </button>
              </div>
            </div>
            
            <div class="export-section">
              <h4>结构化导出</h4>
              <div class="export-buttons">
                <button @click="exportSnippet(exportTarget, 'json')" class="export-btn">
                  <Database :size="16" />
                  <span>JSON数据</span>
                </button>
                <button @click="exportSnippet(exportTarget, 'gist')" class="export-btn">
                  <Github :size="16" />
                  <span>Gist格式</span>
                </button>
              </div>
            </div>
            
            <div class="export-section">
              <h4>快速操作</h4>
              <div class="export-buttons">
                <button @click="copySnippetAsFormat(exportTarget, 'code')" class="export-btn">
                  <Copy :size="16" />
                  <span>复制纯代码</span>
                </button>
                <button @click="copySnippetAsFormat(exportTarget, 'markdown')" class="export-btn">
                  <Copy :size="16" />
                  <span>复制Markdown</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 删除确认模态框 -->
    <div v-if="showDeleteConfirm" class="modal-overlay" @click="cancelDelete">
      <div class="delete-confirm-modal" @click.stop>
        <div class="modal-header">
          <h3>确认删除</h3>
          <button @click="cancelDelete" class="modal-close-btn">
            <X :size="16" />
          </button>
        </div>
        
        <div class="modal-body">
          <div class="warning-icon">
            <Trash2 :size="24" />
          </div>
          <div class="warning-content">
            <p class="warning-title">确定要删除这个代码片段吗？</p>
            <p class="warning-description">
              将删除代码片段 "<strong>{{ deleteTarget?.title }}</strong>"
            </p>
            <p class="warning-note">此操作无法撤销</p>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="cancelDelete" class="btn-cancel">
            取消
          </button>
          <button @click="executeDelete" class="btn-delete">
            <Trash2 :size="14" />
            确认删除
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * @file SnippetList.vue
 * @description 代码片段列表展示与管理组件
 * @author Noah
 * 
 * 功能职责：
 * - 展示代码片段列表（支持卡片、列表、紧凑三种视图）
 * - 虚拟滚动列表 (Virtual Scrolling) 以支持大量数据
 * - 搜索、过滤（标签/语言）、排序
 * - 收藏、同步状态展示
 */
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { 
  Plus, Search, Filter, Code2, Tag, Calendar, Pencil, Trash2, Grid, List, Star, Clock, TrendingUp,
  MoreVertical, MoreHorizontal, Copy, Hash, Play, Zap, FileText, Database, Globe, Smartphone, 
  Server, Cpu, Palette, X, ArrowUpDown, Edit, LayoutGrid, Rows, Search as SearchIcon, Github, GitGraph, Loader2, Gitlab, ChevronDown,
  Download, ChevronRight, FileCode, Archive, CheckSquare
} from 'lucide-vue-next'
import { useToast } from "vue-toastification"
import { useVirtualList } from '../composables/useVirtualList'
import { useAdvancedSearch } from '../composables/useAdvancedSearch'
import { debounce } from '../utils'
import JSZip from 'jszip'
import { generateZipFile } from '../utils/zipExport'
import { performanceMonitor } from '../utils/performanceOptimized'
import { cache } from '../utils/cache'
import { writeText } from '@tauri-apps/plugin-clipboard-manager'
import EmptyState from './EmptyState.vue'
import SkeletonLoader from './SkeletonLoader.vue'
import { useSnippetStore } from '../stores/snippetStore'
import { useCloudStore } from '../stores/cloudStore'

const props = defineProps({
  snippets: Array,
  languages: Array,
})

const snippetStore = useSnippetStore()
const cloudStore = useCloudStore()
const toast = useToast()

const syncingStates = ref({}) // { 'snippetId-platform': boolean }

onMounted(() => {
  cloudStore.init()
})

const isSyncing = (snippetId, platform) => !!syncingStates.value[`${snippetId}-${platform}`]

const handleSync = async (snippet, platform) => {
  const key = `${snippet.id}-${platform}`
  syncingStates.value[key] = true
  try {
    const res = await cloudStore.syncSnippet(snippet, platform)
    let platformName = platform === 'github' ? 'GitHub' : (platform === 'gitee' ? 'Gitee' : 'GitLab')
    
    if (res.action === 'create') toast.success(`已发布到 ${platformName}`)
    else toast.success(`已更新 ${platformName} 版本`)
    
    // 同步成功后关闭模态框
    setTimeout(() => {
      closeSyncModal()
    }, 1000)
  } catch (e) {
    toast.error(`同步失败: ${e.message}`)
  } finally {
    syncingStates.value[key] = false
    // 关闭所有菜单
    activeCardMenu.value = null
    activeSyncMenu.value = null
  }
}

const emit = defineEmits(['create', 'select', 'edit', 'delete', 'favorite'])

// 响应式状态
const searchQuery = ref('')
const selectedLanguage = ref(null)
const showLanguageMenu = ref(false)
const justFavoritedItems = ref(new Set()) // 跟踪刚被收藏的项目

const selectLanguage = (lang) => {
  selectedLanguage.value = lang
  showLanguageMenu.value = false
}
const selectedTags = ref([])
const sortBy = ref('updated_at')
const sortOrder = ref('desc')

// 批量选择相关状态
const selectedSnippets = ref(new Set()) // 选中的代码片段ID集合
const isSelectionMode = ref(false) // 是否处于选择模式
const showBatchActions = ref(false) // 是否显示批量操作工具栏

// 导出相关状态
const activeExportMenu = ref(null)
const showBatchExportMenu = ref(false)
const showDeleteConfirm = ref(false)
const showExportModal = ref(false)
const showSyncModal = ref(false) // 新增同步模态框状态
const exportTarget = ref(null)
const syncTarget = ref(null) // 新增同步目标
const deleteTarget = ref(null)
const displayMode = ref('cards') // cards | list | compact
const contentMode = ref('code') // code | markdown
const showFavoritesOnly = ref(false)
const showRecentOnly = ref(false)
const activeCardMenu = ref(null)
const activeSyncMenu = ref(null) // 保留但可能不再使用
const isLoading = ref(false)
const showSearchSuggestions = ref(false)
const showAdvancedSearch = ref(false)
const dateRangeFilter = ref('')

// 初始化高级搜索
const {
  searchResults: advancedSearchResults,
  searchSuggestions,
  isSearching: isAdvancedSearching,
  searchStats,
  filters: advancedFilters,
  performSearch: performAdvancedSearch,
  generateSuggestions,
  resetFilters: resetAdvancedFilters
} = useAdvancedSearch(computed(() => props.snippets || []), {
  searchFields: ['title', 'description', 'code', 'tags'],
  fuzzyThreshold: 0.6,
  maxResults: 100,
  enableHistory: true,
  enableSuggestions: true,
  debounceDelay: 300
})

// 语言图标映射
const languageIcons = {
  javascript: 'devicon-javascript-plain',
  js: 'devicon-javascript-plain',
  typescript: 'devicon-typescript-plain',
  ts: 'devicon-typescript-plain',
  python: 'devicon-python-plain',
  py: 'devicon-python-plain',
  java: 'devicon-java-plain',
  cpp: 'devicon-cplusplus-plain',
  'c++': 'devicon-cplusplus-plain',
  c: 'devicon-c-plain',
  csharp: 'devicon-csharp-plain',
  cs: 'devicon-csharp-plain',
  'c#': 'devicon-csharp-plain',
  php: 'devicon-php-plain',
  ruby: 'devicon-ruby-plain',
  go: 'devicon-go-original-wordmark',
  rust: 'devicon-rust-plain',
  swift: 'devicon-swift-plain',
  kotlin: 'devicon-kotlin-plain',
  scala: 'devicon-scala-plain',
  dart: 'devicon-dart-plain',
  html: 'devicon-html5-plain',
  css: 'devicon-css3-plain',
  scss: 'devicon-sass-original',
  less: 'devicon-less-plain-wordmark',
  sql: Database,
  mysql: 'devicon-mysql-plain',
  postgresql: 'devicon-postgresql-plain',
  json: 'devicon-json-plain',
  yaml: FileText,
  xml: FileText,
  markdown: 'devicon-markdown-original',
  md: 'devicon-markdown-original',
  bash: 'devicon-bash-plain',
  sh: 'devicon-bash-plain',
  shell: 'devicon-bash-plain',
  powershell: 'devicon-powershell-plain', // Note: Check if exists, fallbacks if not
  dockerfile: 'devicon-docker-plain',
  graphql: 'devicon-graphql-plain',
  lua: 'devicon-lua-plain',
  r: 'devicon-r-original',
  matlab: 'devicon-matlab-plain',
  perl: 'devicon-perl-plain',
  haskell: 'devicon-haskell-plain',
  clojure: 'devicon-clojure-plain',
  elixir: 'devicon-elixir-plain',
  erlang: 'devicon-erlang-plain',
  fsharp: 'devicon-fsharp-plain',
  vb: 'devicon-visualstudio-plain',
  'objective-c': 'devicon-objectivec-plain',
  assembly: Cpu,
  vue: 'devicon-vuejs-plain',
  react: 'devicon-react-original',
  angular: 'devicon-angularjs-plain',
  svelte: 'devicon-svelte-plain',
  default: Code2
}

// 搜索和过滤
const performSearch = () => {
  // 更新高级搜索过滤器
  advancedFilters.value.language = selectedLanguage.value
  advancedFilters.value.tags = selectedTags.value
  advancedFilters.value.isFavorite = showFavoritesOnly.value ? true : null
  
  // 执行高级搜索
  performAdvancedSearch(searchQuery.value, props.snippets || [])
  
  // 记录搜索性能
  performanceMonitor.recordInteraction('search-snippets', {
    query: searchQuery.value.length,
    hasQuery: searchQuery.value.length > 0,
    hasFilters: selectedLanguage.value || selectedTags.value.length > 0 || showFavoritesOnly.value
  })
}

const debouncedSearch = debounce((query) => {
  performSearch()
  
  // 生成搜索建议
  if (query && query.length >= 2) {
    generateSuggestions(query)
  }
}, 300)

// 监听搜索相关变化
watch(searchQuery, (newQuery) => {
  debouncedSearch(newQuery)
})

watch([selectedLanguage, selectedTags, showFavoritesOnly], () => {
  performSearch()
}, { deep: true })

// 监听高级搜索过滤器变化
watch(advancedFilters, () => {
  performSearch()
}, { deep: true })


const filteredSnippetsRaw = computed(() => {
  const startTime = performance.now()
  
  let results = []
  
  // 使用高级搜索结果或原始数据
  if (searchQuery.value.trim() || selectedLanguage.value || selectedTags.value.length > 0 || showFavoritesOnly.value) {
    results = advancedSearchResults.value || []
  } else {
    results = props.snippets || []
  }

  // 最近使用过滤 (Local)
  if (showRecentOnly.value) {
    results = results.filter(s => isRecentlyUsed(s.id))
  }

  // 排序 - 创建副本避免修改原始数据
  results = [...results].sort((a, b) => {
    let aVal = a[sortBy.value]
    let bVal = b[sortBy.value]
    
    if (sortBy.value === 'title') {
      aVal = aVal.toLowerCase()
      bVal = bVal.toLowerCase()
    }
    
    if (sortOrder.value === 'desc') {
      return bVal > aVal ? 1 : -1
    } else {
      return aVal > bVal ? 1 : -1
    }
  })

  const searchTime = performance.now() - startTime
  performanceMonitor.recordMetric('search', 'filter-time', { duration: searchTime })

  return results
})

// 渐进式渲染控制
const renderLimit = ref(20)
const renderBatchSize = 20

const filteredSnippets = computed(() => {
  return filteredSnippetsRaw.value.slice(0, renderLimit.value)
})

// 监听源数据变化，重置渲染并启动渐进加载
watch(filteredSnippetsRaw, () => {
  renderLimit.value = 20
  queueNextBatch()
})

const queueNextBatch = () => {
  if (renderLimit.value >= filteredSnippetsRaw.value.length) return
  
  const loadNext = () => {
    renderLimit.value += renderBatchSize
    if (renderLimit.value < filteredSnippetsRaw.value.length) {
      if (window.requestIdleCallback) {
        window.requestIdleCallback(loadNext)
      } else {
        setTimeout(loadNext, 16)
      }
    }
  }
  
  if (window.requestIdleCallback) {
    window.requestIdleCallback(loadNext)
  } else {
    setTimeout(loadNext, 16)
  }
}

// 组件挂载时启动加载
onMounted(() => {
  queueNextBatch()
})

// 虚拟列表配置 - 已禁用，改为直接渲染
// const itemHeight = computed(() => {
//   if (displayMode.value === 'cards') {
//     return contentMode.value === 'markdown' ? 320 : 280
//   } else if (displayMode.value === 'list') {
//     return 120
//   } else {
//     return 60 // compact mode
//   }
// })

// const {
//   visibleItems,
//   totalHeight,
//   offsetY,
//   scrollToIndex
// } = useVirtualList(filteredSnippets, {
//   itemHeight,  // 传递 computed 对象而不是 .value
//   containerHeight: 600,
//   overscan: 5
// })

// 统计信息
const statistics = computed(() => {
  const snippets = props.snippets || []
  const languages = [...new Set(snippets.map(s => s.language))]
  const tags = [...new Set(snippets.flatMap(s => s.tags))]
  
  return {
    total: snippets.length,
    languages: languages.length,
    tags: tags.length,
    favorites: snippets.filter(s => s.isFavorite).length,
    filtered: filteredSnippetsRaw.value.length
  }
})

// 可用标签
const availableTags = computed(() => {
  const allTags = [...new Set(props.snippets?.flatMap(s => s.tags) || [])]
  return allTags.sort()
})

// 批量选择相关计算属性
const selectedSnippetsCount = computed(() => selectedSnippets.value.size)
const isAllSelected = computed(() => {
  const visibleSnippets = filteredSnippetsRaw.value
  return visibleSnippets.length > 0 && visibleSnippets.every(snippet => selectedSnippets.value.has(snippet.id))
})
const isPartiallySelected = computed(() => {
  const visibleSnippets = filteredSnippetsRaw.value
  const selectedCount = visibleSnippets.filter(snippet => selectedSnippets.value.has(snippet.id)).length
  return selectedCount > 0 && selectedCount < visibleSnippets.length
})
const selectedSnippetsData = computed(() => {
  return filteredSnippetsRaw.value.filter(snippet => selectedSnippets.value.has(snippet.id))
})

// 排序选项
const sortOptions = [
  { value: 'updated_at', label: '最近更新', icon: Clock },
  { value: 'created_at', label: '创建时间', icon: Calendar },
  { value: 'title', label: '标题', icon: Tag },
  { value: 'language', label: '语言', icon: Code2 },
  { value: 'usage_count', label: '使用次数', icon: TrendingUp }
]

// 方法
const formatDate = (timestamp) => {
  return new Date(timestamp * 1000).toLocaleDateString('zh-CN')
}

const formatRelativeTime = (timestamp) => {
  const now = Date.now()
  const diff = now - timestamp * 1000
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (days > 0) return `${days}天前`
  if (hours > 0) return `${hours}小时前`
  if (minutes > 0) return `${minutes}分钟前`
  return '刚刚'
}

// 新增的工具方法
const getLanguageIcon = (language) => {
  const lang = language.toLowerCase()
  return languageIcons[lang] || languageIcons.default
}

const getCodeLineCount = (code) => {
  return code ? code.split('\n').length : 0
}

const getFileName = (snippet) => {
  const extensions = {
    javascript: '.js',
    typescript: '.ts',
    python: '.py',
    java: '.java',
    cpp: '.cpp',
    csharp: '.cs',
    php: '.php',
    ruby: '.rb',
    go: '.go',
    rust: '.rs',
    swift: '.swift',
    kotlin: '.kt',
    html: '.html',
    css: '.css',
    scss: '.scss',
    sql: '.sql',
    json: '.json',
    yaml: '.yml',
    markdown: '.md',
    bash: '.sh'
  }
  
  const ext = extensions[snippet.language.toLowerCase()] || '.txt'
  return `${snippet.title.replace(/\s+/g, '_').toLowerCase()}${ext}`
}

const getCodePreview = (code) => {
  if (!code) return ''
  const lines = code.split('\n')
  const previewLines = lines.slice(0, 6) // 显示前6行
  return previewLines.join('\n')
}

const isRecentlyUsed = (snippetId) => {
  // 检查是否在最近24小时内使用过
  const recentUsage = localStorage.getItem(`usage_${snippetId}`)
  if (!recentUsage) return false
  
  const lastUsed = parseInt(recentUsage)
  const dayAgo = Date.now() - 24 * 60 * 60 * 1000
  return lastUsed > dayAgo
}

const toggleCardMenu = (snippetId) => {
  activeCardMenu.value = activeCardMenu.value === snippetId ? null : snippetId
  // 关闭其他菜单
  if (activeCardMenu.value !== snippetId) {
    activeExportMenu.value = null
    activeSyncMenu.value = null
  }
}

// 显示同步选项弹窗
const showSyncOptions = (snippet) => {
  syncTarget.value = snippet
  showSyncModal.value = true
  // 关闭其他菜单
  activeCardMenu.value = null
  activeExportMenu.value = null
  activeSyncMenu.value = null
}

// 关闭同步选项弹窗
const closeSyncModal = () => {
  showSyncModal.value = false
  syncTarget.value = null
}

// 显示导出选项弹窗
const showExportOptions = (snippet) => {
  exportTarget.value = snippet
  showExportModal.value = true
  // 关闭其他菜单
  activeCardMenu.value = null
  activeExportMenu.value = null
}

// 关闭导出选项弹窗
const closeExportModal = () => {
  showExportModal.value = false
  exportTarget.value = null
}

// 导出菜单控制
const toggleExportMenu = (snippetId) => {
  console.log('toggleExportMenu called with:', snippetId)
  console.log('Current activeExportMenu:', activeExportMenu.value)
  
  const newValue = activeExportMenu.value === snippetId ? null : snippetId
  activeExportMenu.value = newValue
  
  console.log('New activeExportMenu:', activeExportMenu.value)
  
  // 强制触发响应式更新
  nextTick(() => {
    console.log('After nextTick, activeExportMenu:', activeExportMenu.value)
    const submenu = document.querySelector('.export-submenu')
    console.log('Submenu element found:', !!submenu)
    if (submenu) {
      console.log('Submenu styles:', window.getComputedStyle(submenu).display)
    }
  })
}

// 获取文件扩展名
const getFileExtension = (language) => {
  const extensions = {
    'javascript': 'js',
    'typescript': 'ts',
    'python': 'py',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c',
    'csharp': 'cs',
    'php': 'php',
    'ruby': 'rb',
    'go': 'go',
    'rust': 'rs',
    'swift': 'swift',
    'kotlin': 'kt',
    'html': 'html',
    'css': 'css',
    'scss': 'scss',
    'json': 'json',
    'xml': 'xml',
    'yaml': 'yml',
    'sql': 'sql',
    'bash': 'sh',
    'shell': 'sh',
    'powershell': 'ps1',
    'markdown': 'md'
  }
  return extensions[language.toLowerCase()] || 'txt'
}

// 导出代码片段
const exportSnippet = (snippet, format) => {
  if (!snippet) {
    showNotification('没有选择要导出的代码片段', 'error')
    return
  }

  try {
    let content, filename, mimeType
    
    switch (format) {
      case 'code':
        content = snippet.code
        filename = `${snippet.title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '-')}.${getFileExtension(snippet.language)}`
        mimeType = 'text/plain;charset=utf-8'
        break
        
      case 'markdown':
        content = generateMarkdownContent(snippet)
        filename = `${snippet.title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '-')}.md`
        mimeType = 'text/markdown;charset=utf-8'
        break
        
      case 'html':
        content = generateHTMLContent(snippet)
        filename = `${snippet.title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '-')}.html`
        mimeType = 'text/html;charset=utf-8'
        break
        
      case 'json':
        content = JSON.stringify(snippet, null, 2)
        filename = `${snippet.title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '-')}.json`
        mimeType = 'application/json;charset=utf-8'
        break
        
      case 'gist':
        content = generateGistFormat(snippet)
        filename = `${snippet.title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '-')}-gist.json`
        mimeType = 'application/json;charset=utf-8'
        break
        
      default:
        content = snippet.code
        filename = `${snippet.title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '-')}.txt`
        mimeType = 'text/plain;charset=utf-8'
    }
    
    // 创建带有UTF-8 BOM的Blob以确保中文正确显示
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF])
    const blob = new Blob([bom, content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    // 关闭菜单和弹窗
    activeCardMenu.value = null
    activeExportMenu.value = null
    closeExportModal()
    
    // 显示成功通知
    showNotification(`已导出为 ${format.toUpperCase()}`, 'success')
  } catch (error) {
    console.error('Export failed:', error)
    showNotification('导出失败', 'error')
  }
}

// 生成Markdown内容
const generateMarkdownContent = (snippet) => {
  const tags = snippet.tags ? snippet.tags.map(tag => `#${tag}`).join(' ') : ''
  const date = new Date(snippet.updated_at * 1000).toLocaleDateString('zh-CN')
  
  return `# ${snippet.title}

## 描述
${snippet.description || '暂无描述'}

## 代码
\`\`\`${snippet.language}
${snippet.code}
\`\`\`

## 信息
- **语言**: ${snippet.language}
- **标签**: ${tags || '无'}
- **更新时间**: ${date}
- **代码行数**: ${getCodeLineCount(snippet.code)}

---
*导出自 SnippetsHub - ${new Date().toLocaleDateString('zh-CN')}*`
}

// 生成HTML内容
const generateHTMLContent = (snippet) => {
  const tags = snippet.tags ? snippet.tags.map(tag => `<span class="tag">${tag}</span>`).join('') : ''
  const date = new Date(snippet.updated_at * 1000).toLocaleDateString('zh-CN')
  
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${snippet.title} - SnippetsHub</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Microsoft YaHei', sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
            background: #fff;
        }
        .header {
            border-bottom: 2px solid #eee;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .title {
            font-size: 2em;
            margin: 0 0 10px 0;
            color: #2c3e50;
        }
        .meta {
            color: #666;
            font-size: 0.9em;
        }
        .description {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .code-container {
            background: #1e1e1e;
            color: #d4d4d4;
            padding: 20px;
            border-radius: 8px;
            overflow-x: auto;
            margin: 20px 0;
        }
        .code-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid #333;
        }
        .language-tag {
            background: #007acc;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8em;
        }
        pre {
            margin: 0;
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
            font-size: 14px;
            line-height: 1.5;
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        .tags {
            margin: 20px 0;
        }
        .tag {
            background: #e3f2fd;
            color: #1976d2;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.8em;
            margin-right: 8px;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1 class="title">${snippet.title}</h1>
        <div class="meta">
            语言: ${snippet.language} | 
            更新时间: ${date} | 
            代码行数: ${getCodeLineCount(snippet.code)}
        </div>
    </div>
    
    ${snippet.description ? `<div class="description">
        <h3>描述</h3>
        <p>${snippet.description}</p>
    </div>` : ''}
    
    <div class="code-container">
        <div class="code-header">
            <span class="language-tag">${snippet.language}</span>
            <span>${getCodeLineCount(snippet.code)} 行代码</span>
        </div>
        <pre><code>${snippet.code}</code></pre>
    </div>
    
    ${tags ? `<div class="tags">
        <h3>标签</h3>
        ${tags}
    </div>` : ''}
    
    <div class="footer">
        <p>导出自 SnippetsHub - ${new Date().toLocaleDateString('zh-CN')}</p>
    </div>
</body>
</html>`
}

// 生成Gist格式
const generateGistFormat = (snippet) => {
  const filename = `${snippet.title.replace(/[^a-zA-Z0-9]/g, '-')}.${getFileExtension(snippet.language)}`
  
  const gist = {
    description: `${snippet.title} - 导出自 SnippetsHub`,
    public: false,
    files: {
      [filename]: {
        content: snippet.code
      }
    }
  }
  
  // 如果有描述，添加README文件
  if (snippet.description) {
    gist.files['README.md'] = {
      content: `# ${snippet.title}\n\n${snippet.description}\n\n## 标签\n${snippet.tags ? snippet.tags.map(tag => `- ${tag}`).join('\n') : '无'}`
    }
  }
  
  return JSON.stringify(gist, null, 2)
}

// 复制特定格式的内容
const copySnippetAsFormat = async (snippet, format) => {
  try {
    let content = ''
    
    switch (format) {
      case 'code':
        content = snippet.code
        break
      case 'markdown':
        content = generateMarkdownContent(snippet)
        break
      default:
        content = snippet.code
    }
    
    await writeText(content)
    
    // 关闭菜单和弹窗
    activeCardMenu.value = null
    activeExportMenu.value = null
    closeExportModal()
    
    showNotification(`已复制${format === 'code' ? '代码' : 'Markdown'}到剪贴板`, 'success')
  } catch (error) {
    console.error('Copy failed:', error)
    showNotification('复制失败', 'error')
  }
}

// 通知函数
const showNotification = (message, type = 'success') => {
  try {
    if (toast && typeof toast.success === 'function' && typeof toast.error === 'function') {
      if (type === 'success') {
        toast.success(message)
      } else {
        toast.error(message)
      }
    } else {
      // 备用通知方式
      const notification = document.createElement('div')
      notification.textContent = message
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 6px;
        color: white;
        font-size: 14px;
        font-weight: 500;
        z-index: 10000;
        transition: all 0.3s ease;
        background: ${type === 'success' ? '#10b981' : '#ef4444'};
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      `
      
      document.body.appendChild(notification)
      
      setTimeout(() => {
        notification.style.opacity = '0'
        notification.style.transform = 'translateX(100%)'
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification)
          }
        }, 300)
      }, 3000)
    }
  } catch (error) {
    console.error('Notification error:', error)
  }
}

// 确认删除函数
const confirmDelete = (snippet) => {
  // 关闭菜单
  activeCardMenu.value = null
  activeExportMenu.value = null
  
  // 设置删除目标并显示确认对话框
  deleteTarget.value = snippet
  showDeleteConfirm.value = true
}

// 执行删除
const executeDelete = () => {
  if (deleteTarget.value) {
    // 发出删除事件
    emit('delete', deleteTarget.value.id)
    
    // 显示删除成功通知
    showNotification(`已删除代码片段 "${deleteTarget.value.title}"`, 'success')
    
    // 重置状态
    deleteTarget.value = null
    showDeleteConfirm.value = false
  }
}

// 取消删除
const cancelDelete = () => {
  deleteTarget.value = null
  showDeleteConfirm.value = false
}

// 批量导出功能
const batchExport = async (format) => {
  try {
    const snippets = filteredSnippetsRaw.value
    
    if (snippets.length === 0) {
      showNotification('没有可导出的代码片段', 'error')
      return
    }
    
    let content, filename, mimeType
    
    switch (format) {
      case 'zip':
        // 使用真正的ZIP导出
        content = await generateZipFile(snippets)
        filename = `snippetshub-snippets-${new Date().toISOString().split('T')[0]}.zip`
        mimeType = 'application/zip'
        break
        
      case 'json':
        content = JSON.stringify(snippets, null, 2)
        filename = `snippetshub-snippets-${new Date().toISOString().split('T')[0]}.json`
        mimeType = 'application/json;charset=utf-8'
        break
        
      case 'markdown':
        content = generateBatchMarkdown(snippets)
        filename = `snippetshub-snippets-${new Date().toISOString().split('T')[0]}.md`
        mimeType = 'text/markdown;charset=utf-8'
        break
        
      default:
        content = await generateZipFile(snippets)
        filename = `snippetshub-snippets-${new Date().toISOString().split('T')[0]}.zip`
        mimeType = 'application/zip'
    }
    
    // 对于ZIP不需要BOM，对于文本格式需要
    let blob
    if (format === 'zip') {
      blob = content  // content已经是Blob
    } else {
      const bom = new Uint8Array([0xEF, 0xBB, 0xBF])
      blob = new Blob([bom, content], { type: mimeType })
    }
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    // 关闭菜单
    showBatchExportMenu.value = false
    
    showNotification(`已导出 ${snippets.length} 个代码片段`, 'success')
  } catch (error) {
    console.error('Batch export failed:', error)
    showNotification('批量导出失败', 'error')
  }
}

// 按语言批量导出
const batchExportByLanguage = () => {
  try {
    const snippets = filteredSnippetsRaw.value
    if (snippets.length === 0) {
      showNotification('没有可导出的代码片段', 'error')
      return
    }
    
    // 按语言分组
    const groupedByLanguage = snippets.reduce((groups, snippet) => {
      const lang = snippet.language
      if (!groups[lang]) {
        groups[lang] = []
      }
      groups[lang].push(snippet)
      return groups
    }, {})
    
    // 生成分语言的内容
    let content = `# SnippetsHub 代码片段导出 - 按语言分类\n\n`
    content += `导出时间: ${new Date().toLocaleString('zh-CN')}\n`
    content += `总计: ${snippets.length} 个代码片段，${Object.keys(groupedByLanguage).length} 种语言\n\n`
    
    Object.entries(groupedByLanguage).forEach(([language, langSnippets]) => {
      content += `${'='.repeat(60)}\n`
      content += `语言: ${language} (${langSnippets.length} 个片段)\n`
      content += `${'='.repeat(60)}\n\n`
      
      langSnippets.forEach((snippet, index) => {
        content += `## ${index + 1}. ${snippet.title}\n\n`
        if (snippet.description) {
          content += `**描述**: ${snippet.description}\n\n`
        }
        content += `**文件名**: ${snippet.title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '-')}.${getFileExtension(snippet.language)}\n\n`
        content += `\`\`\`${snippet.language}\n${snippet.code}\n\`\`\`\n\n`
        if (snippet.tags && snippet.tags.length > 0) {
          content += `**标签**: ${snippet.tags.join(', ')}\n\n`
        }
        content += `---\n\n`
      })
    })
    
    const filename = `snippetshub-by-language-${new Date().toISOString().split('T')[0]}.md`
    
    // 创建带有UTF-8 BOM的Blob以确保中文正确显示
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF])
    const blob = new Blob([bom, content], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    showBatchExportMenu.value = false
    showNotification(`已按 ${Object.keys(groupedByLanguage).length} 种语言导出`, 'success')
  } catch (error) {
    console.error('Language batch export failed:', error)
    showNotification('按语言导出失败', 'error')
  }
}

// 切换选择模式
const toggleSelectionMode = () => {
  isSelectionMode.value = !isSelectionMode.value
  if (!isSelectionMode.value) {
    // 退出选择模式时清空选择
    selectedSnippets.value.clear()
  }
}

// 切换单个片段的选择状态
const toggleSelection = (snippetId) => {
  if (selectedSnippets.value.has(snippetId)) {
    selectedSnippets.value.delete(snippetId)
  } else {
    selectedSnippets.value.add(snippetId)
  }
  // 触发响应式更新
  selectedSnippets.value = new Set(selectedSnippets.value)
}

// 全选当前筛选的片段
const selectAll = () => {
  const visibleSnippets = filteredSnippetsRaw.value
  visibleSnippets.forEach(snippet => {
    selectedSnippets.value.add(snippet.id)
  })
  selectedSnippets.value = new Set(selectedSnippets.value)
}

// 清除所有选择
const clearSelection = () => {
  selectedSnippets.value.clear()
  selectedSnippets.value = new Set()
}

// 批量导出选中的片段
const batchExportSelected = async (format) => {
  try {
    const snippetsToExport = selectedSnippetsData.value
    
    if (snippetsToExport.length === 0) {
      showNotification('请先选择要导出的代码片段', 'warning')
      return
    }
    
    let content, filename, mimeType
    
    switch (format) {
      case 'zip':
        // 使用真正的ZIP导出
        content = await generateZipFile(snippetsToExport)
        filename = `snippetshub-selected-${new Date().toISOString().split('T')[0]}.zip`
        mimeType = 'application/zip'
        break
        
      case 'json':
        content = JSON.stringify(snippetsToExport, null, 2)
        filename = `snippetshub-selected-${new Date().toISOString().split('T')[0]}.json`
        mimeType = 'application/json;charset=utf-8'
        break
        
      case 'markdown':
        content = generateBatchMarkdown(snippetsToExport)
        filename = `snippetshub-selected-${new Date().toISOString().split('T')[0]}.md`
        mimeType = 'text/markdown;charset=utf-8'
        break
        
      default:
        content = await generateZipFile(snippetsToExport)
        filename = `snippetshub-selected-${new Date().toISOString().split('T')[0]}.zip`
        mimeType = 'application/zip'
    }
    
    // 对于ZIP不需要BOM，对于文本格式需要
    let blob
    if (format === 'zip') {
      blob = content  // content已经是Blob
    } else {
      const bom = new Uint8Array([0xEF, 0xBB, 0xBF])
      blob = new Blob([bom, content], { type: mimeType })
    }
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    showNotification(`已导出 ${snippetsToExport.length} 个选中的代码片段`, 'success')
  } catch (error) {
    console.error('Batch export selected failed:', error)
    showNotification('导出选中片段失败', 'error')
  }
}

// 批量删除选中的片段
const batchDeleteSelected = async () => {
  const snippetsToDelete = selectedSnippetsData.value
  
  if (snippetsToDelete.length === 0) {
    showNotification('请先选择要删除的代码片段', 'warning')
    return
  }
  
  // 需要确认
  if (!confirm(`确定要删除选中的 ${snippetsToDelete.length} 个代码片段吗？此操作不可恢复！`)) {
    return
  }
  
  try {
    let successCount = 0
    for (const snippet of snippetsToDelete) {
      try {
        await snippetStore.deleteSnippet(snippet.id)
        successCount++
      } catch (error) {
        console.error(`Failed to delete snippet ${snippet.id}:`, error)
      }
    }
    
    // 清空选择
    clearSelection()
    
    // 如果所有片段都被删除，退出选择模式
    if (filteredSnippetsRaw.value.length === 0) {
      isSelectionMode.value = false
    }
    
    showNotification(`成功删除 ${successCount} 个代码片段`, 'success')
  } catch (error) {
    console.error('Batch delete failed:', error)
    showNotification('批量删除失败', 'error')
  }
}



// 生成批量Markdown
const generateBatchMarkdown = (snippets) => {
  let content = `# SnippetsHub 代码片段集合\n\n`
  content += `> 导出时间: ${new Date().toLocaleString('zh-CN')}\n`
  content += `> 总计: ${snippets.length} 个代码片段\n\n`
  
  // 生成目录
  content += `## 目录\n\n`
  snippets.forEach((snippet, index) => {
    content += `${index + 1}. [${snippet.title}](#${index + 1}-${snippet.title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()})\n`
  })
  content += '\n---\n\n'
  
  // 生成内容
  snippets.forEach((snippet, index) => {
    content += `## ${index + 1}. ${snippet.title}\n\n`
    
    if (snippet.description) {
      content += `**描述**: ${snippet.description}\n\n`
    }
    
    content += `**语言**: ${snippet.language}  \n`
    content += `**代码行数**: ${getCodeLineCount(snippet.code)}  \n`
    content += `**更新时间**: ${new Date(snippet.updated_at * 1000).toLocaleDateString('zh-CN')}  \n`
    
    if (snippet.tags && snippet.tags.length > 0) {
      content += `**标签**: ${snippet.tags.map(tag => `\`${tag}\``).join(', ')}  \n`
    }
    
    content += '\n'
    content += `\`\`\`${snippet.language}\n${snippet.code}\n\`\`\`\n\n`
    content += '---\n\n'
  })
  
  content += `\n*导出自 SnippetsHub - ${new Date().toLocaleDateString('zh-CN')}*`
  
  return content
}

const copyToClipboard = async (snippet) => {
  try {
    await writeText(snippet.code)
    // 触发成功通知
    if (typeof window !== 'undefined' && window.showNotification) {
      window.showNotification('代码已复制到剪贴板', 'success')
    }
    
    // 记录使用
    localStorage.setItem(`usage_${snippet.id}`, Date.now().toString())
    
    // 关闭菜单
    activeCardMenu.value = null
  } catch (error) {
    console.error('复制失败:', error)
    if (typeof window !== 'undefined' && window.showNotification) {
      window.showNotification('复制失败', 'error')
    }
  }
}

const toggleFavorite = (snippet, event) => {
  // 防止事件冒泡
  if (event) {
    event.preventDefault()
    event.stopPropagation()
    event.stopImmediatePropagation()
  }
  
  // 防抖：如果刚刚点击过同一个按钮，忽略
  const now = Date.now()
  const lastClickKey = `favorite_${snippet.id}`
  const lastClickTime = window.lastFavoriteClick?.[lastClickKey] || 0
  
  if (now - lastClickTime < 300) { // 300ms 防抖
    return
  }
  
  // 记录点击时间
  if (!window.lastFavoriteClick) {
    window.lastFavoriteClick = {}
  }
  window.lastFavoriteClick[lastClickKey] = now
  
  const newFavoriteState = !snippet.isFavorite
  
  // 如果是收藏操作，添加闪烁动画
  if (newFavoriteState) {
    justFavoritedItems.value.add(snippet.id)
    // 600ms后移除动画类
    setTimeout(() => {
      justFavoritedItems.value.delete(snippet.id)
    }, 600)
  }
  
  emit('favorite', snippet.id, newFavoriteState)
  
  performanceMonitor.recordInteraction('toggle-favorite', {
    snippetId: snippet.id,
    isFavorite: newFavoriteState
  })
}

const clearFilters = () => {
  searchQuery.value = ''
  selectedLanguage.value = null
  selectedTags.value = []
  showFavoritesOnly.value = false
  showRecentOnly.value = false
  
  // 重置高级搜索过滤器
  resetAdvancedFilters()
}

const toggleTag = (tag) => {
  const index = selectedTags.value.indexOf(tag)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  } else {
    selectedTags.value.push(tag)
  }
}

const setSortBy = (field) => {
  if (sortBy.value === field) {
    sortOrder.value = sortOrder.value === 'desc' ? 'asc' : 'desc'
  } else {
    sortBy.value = field
    sortOrder.value = 'desc'
  }
}

const scrollToTop = () => {
  // 直接滚动到容器顶部
  const container = containerRef.value
  if (container) {
    container.scrollTop = 0
  }
}

// 搜索建议相关方法
const selectSuggestion = (suggestion) => {
  searchQuery.value = suggestion
  showSearchSuggestions.value = false
}

const hideSearchSuggestions = () => {
  // 延迟隐藏，允许点击建议项
  setTimeout(() => {
    showSearchSuggestions.value = false
  }, 200)
}

// 高级搜索方法
const updateDateRange = () => {
  const now = new Date()
  let start = null
  let end = now
  
  switch (dateRangeFilter.value) {
    case 'today':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      break
    case 'week':
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case 'month':
      start = new Date(now.getFullYear(), now.getMonth(), 1)
      break
    case 'year':
      start = new Date(now.getFullYear(), 0, 1)
      break
    default:
      start = null
      end = null
  }
  
  advancedFilters.value.dateRange = start && end ? { start, end } : null
  performSearch()
}

const toggleCommentsFilter = () => {
  if (advancedFilters.value.hasComments === null) {
    advancedFilters.value.hasComments = true
  } else if (advancedFilters.value.hasComments === true) {
    advancedFilters.value.hasComments = false
  } else {
    advancedFilters.value.hasComments = null
  }
  performSearch()
}

// 搜索高亮函数
const highlightText = (text, query) => {
  if (!query || !text) return text
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escapedQuery})`, 'gi')
  return text.replace(regex, '<mark class="highlight">$1</mark>')
}

// 按钮点击处理函数
const handleModeChange = (mode) => {
  console.log('Mode change clicked:', mode, 'current:', displayMode.value)
  try {
    displayMode.value = mode
    performanceMonitor.recordInteraction('change-display-mode', { mode })
  } catch (error) {
    console.error('Error changing display mode:', error)
  }
}

const handleContentModeChange = (mode) => {
  console.log('Content mode change clicked:', mode, 'current:', contentMode.value)
  try {
    contentMode.value = mode
    performanceMonitor.recordInteraction('change-content-mode', { mode })
  } catch (error) {
    console.error('Error changing content mode:', error)
  }
}

const handleCreateClick = () => {
  console.log('Create button clicked')
  try {
    emit('create')
    performanceMonitor.recordInteraction('create-snippet-click')
  } catch (error) {
    console.error('Error handling create click:', error)
  }
}

// 监听器
watch(searchQuery, (newQuery) => {
  debouncedSearch(newQuery)
})

watch(displayMode, (newMode) => {
  performanceMonitor.recordInteraction('change-view-mode', { mode: newMode })
})

// 生命周期
onMounted(() => {
  // 记录组件加载
  performanceMonitor.recordMetric('component', 'snippet-list-mounted', {
    snippetCount: props.snippets?.length || 0
  })
  
  // 点击外部关闭菜单
  document.addEventListener('click', (event) => {
    // 检查是否点击在菜单相关元素内
    const isMenuClick = event.target.closest('.more-actions') || 
                       event.target.closest('.dropdown-menu') ||
                       event.target.closest('.submenu') ||
                       event.target.closest('.submenu-container')
    
    if (!isMenuClick) {
      activeCardMenu.value = null
      activeExportMenu.value = null
      activeSyncMenu.value = null
    }
    
    if (!event.target.closest('.language-filter')) {
      showLanguageMenu.value = false
    }
    
    if (!event.target.closest('.dropdown')) {
      showBatchExportMenu.value = false
    }
  })
})
</script>

<style scoped>
.snippet-list {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  background: var(--color-background-secondary);
}

/* 搜索高亮样式 */
:deep(.highlight) {
  background: linear-gradient(135deg, rgba(249, 226, 175, 0.4), rgba(250, 179, 135, 0.3));
  color: inherit;
  padding: 1px 4px;
  border-radius: 4px;
  font-weight: 600;
}

/* 专业级头部工具栏 */
.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-background);
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.title-section h2 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 24px;
  font-weight: 700;
}

.statistics {
  display: flex;
  gap: 8px;
}

.stat-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: var(--color-border);
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.stat-badge.favorites {
  background: rgba(var(--color-warning), 0.1);
  color: var(--color-warning);
}

.stat-badge.search-stats {
  background: rgba(var(--color-primary), 0.1);
  color: var(--color-primary);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* 显示模式控制 */
.display-mode-controls {
  display: flex;
  background: var(--color-border);
  border-radius: 8px;
  padding: 2px;
}

.mode-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: none;
  border: none;
  border-radius: 6px;
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
  white-space: nowrap;
  pointer-events: auto;
  user-select: none;
  -webkit-user-select: none;
  position: relative;
  z-index: 1;
}

.mode-btn:hover {
  color: var(--color-text-primary);
}

.mode-btn.active {
  background: var(--color-background);
  color: var(--color-primary);
  box-shadow: 0 1px 3px var(--color-shadow);
}

/* 内容模式控制 */
.content-mode-controls {
  display: flex;
  background: var(--color-background-secondary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 2px;
}

.content-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: none;
  border: none;
  border-radius: 6px;
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
  pointer-events: auto;
  user-select: none;
  -webkit-user-select: none;
  position: relative;
  z-index: 1;
}

.content-btn:hover {
  color: var(--color-text-primary);
}

.content-btn.active {
  background: var(--color-primary);
  color: white;
}

.btn-create {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--color-primary);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: background-color 0.15s ease, color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
  pointer-events: auto;
  user-select: none;
  -webkit-user-select: none;
  position: relative;
  z-index: 1;
}

.btn-create:hover {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
}

/* 选择模式按钮 */
.btn-select {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--color-background);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.15s ease;
}

.btn-select:hover {
  background: var(--color-background-secondary);
  border-color: var(--color-primary);
  color: var(--color-primary);
  transform: translateY(-1px);
}

.btn-select.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.btn-select.active:hover {
  background: var(--color-primary-hover);
}

/* 批量操作工具栏 */
.batch-actions-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: linear-gradient(135deg, rgba(137, 180, 250, 0.1), rgba(116, 199, 236, 0.1));
  border: 1px solid rgba(137, 180, 250, 0.3);
  border-radius: 12px;
  margin-bottom: 16px;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.batch-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.batch-icon {
  color: var(--color-primary);
}

.batch-count {
  font-weight: 600;
  color: var(--color-text-primary);
  font-size: 15px;
}

.batch-link {
  background: none;
  border: none;
  color: var(--color-primary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.15s ease;
}

.batch-link:hover {
  background: rgba(137, 180, 250, 0.1);
}

.batch-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
}

.batch-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  color: var(--color-text-primary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.batch-btn:hover {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(137, 180, 250, 0.3);
}

.batch-btn.delete {
  background: var(--color-error);
  border-color: var(--color-error);
  color: white;
}

.batch-btn.delete:hover {
  background: #ef4444;
  border-color: #ef4444;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
}

/* 卡片选择状态 */
.snippet-card.selected {
  border-color: var(--color-primary);
  background: rgba(137, 180, 250, 0.05);
  box-shadow: 0 0 0 2px rgba(137, 180, 250, 0.2);
}

/* 选择复选框 */
.selection-checkbox {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 10;
  cursor: pointer;
}

.selection-checkbox .checkbox-custom {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: 2px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-background);
  transition: all 0.2s ease;
}

.selection-checkbox .checkbox-custom.checked {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.selection-checkbox:hover .checkbox-custom {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(137, 180, 250, 0.1);
}

.btn-export {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: var(--color-background-secondary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-export:hover {
  background: var(--color-background-tertiary);
  border-color: var(--color-primary);
}

.batch-export-menu {
  min-width: 180px;
  right: 0;
}

/* 专业级搜索和过滤栏 */
.search-filter-bar {
  padding: 16px 24px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-background);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.search-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.search-box {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--color-background-secondary);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 12px 16px;
  transition: background-color 0.15s ease, color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
  position: relative;
}

.search-box:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(var(--color-primary), 0.1);
}

.search-icon {
  color: var(--color-text-tertiary);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  color: var(--color-text-primary);
  font-size: 14px;
}

.search-input::placeholder {
  color: var(--color-text-tertiary);
}

/* 搜索建议下拉框 */
.search-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background: var(--color-background);
  border: 1px solid var(--color-border-secondary);
  border-radius: 8px;
  box-shadow: 0 8px 24px var(--color-shadow);
  z-index: 1000;
  max-height: 300px;
  overflow-y: auto;
}

.suggestions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-background-secondary);
}

.suggestions-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.suggestions-count {
  font-size: 11px;
  color: var(--color-text-tertiary);
  background: var(--color-border);
  padding: 2px 6px;
  border-radius: 4px;
}

.suggestions-list {
  padding: 4px;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  background: none;
  border: none;
  border-radius: 4px;
  color: var(--color-text-primary);
  font-size: 13px;
  cursor: pointer;
  transition: background-color 0.15s ease;
  text-align: left;
}

.suggestion-item:hover {
  background: var(--color-background-secondary);
}

.suggestion-icon {
  color: var(--color-text-tertiary);
  flex-shrink: 0;
}

.suggestion-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.search-actions {
  display: flex;
  gap: 4px;
}

.clear-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: var(--color-border);
  border: none;
  border-radius: 4px;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
}

.clear-btn:hover {
  background: var(--color-error);
  color: white;
}

.advanced-search-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: var(--color-border);
  border: none;
  border-radius: 4px;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
}

.advanced-search-btn:hover {
  background: var(--color-border-secondary);
  color: var(--color-text-primary);
}

.advanced-search-btn.active {
  background: var(--color-primary);
  color: white;
}

/* 高级搜索面板 */
.advanced-search-panel {
  background: var(--color-background-secondary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 16px;
  margin-top: 12px;
}

.advanced-search-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.advanced-search-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.reset-filters-btn {
  background: none;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: 4px 8px;
  color: var(--color-text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.reset-filters-btn:hover {
  background: var(--color-border);
  color: var(--color-text-primary);
}

.advanced-filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-group label {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.range-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
}

.range-input {
  flex: 1;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: 6px 8px;
  color: var(--color-text-primary);
  font-size: 12px;
  outline: none;
}

.range-input:focus {
  border-color: var(--color-primary);
}

.range-separator {
  color: var(--color-text-tertiary);
  font-size: 12px;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--color-text-primary);
  cursor: pointer;
}

.checkbox-item input[type="checkbox"] {
  margin: 0;
}

.search-stats-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
}

.stat-label {
  color: var(--color-text-tertiary);
}

.stat-value {
  color: var(--color-text-primary);
  font-weight: 500;
}

.filter-section {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.quick-filters {
  display: flex;
  gap: 8px;
}

.filter-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--color-border);
  border: none;
  border-radius: 20px;
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
}

.filter-chip:hover {
  background: var(--color-border-secondary);
  color: var(--color-text-primary);
}

.filter-chip.active {
  background: var(--color-primary);
  color: white;
}

.language-filter, .sort-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-select, .sort-select {
  background: var(--color-background-secondary);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 8px 12px;
  color: var(--color-text-primary);
  font-size: 13px;
  outline: none;
  min-width: 120px;
}

.filter-select:focus, .sort-select:focus {
  border-color: var(--color-primary);
}

.sort-order-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: var(--color-border);
  border: none;
  border-radius: 6px;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
}

.sort-order-btn:hover {
  background: var(--color-border-secondary);
  color: var(--color-text-primary);
}

.clear-filters {
  background: var(--color-error);
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
}

.clear-filters:hover {
  background: var(--color-error);
  opacity: 0.9;
}

.filter-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--color-border);
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  color: var(--color-text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
}

.filter-btn:hover {
  background: var(--color-border-secondary);
  color: var(--color-text-primary);
}

.filter-btn.active {
  background: var(--color-primary);
  color: white;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-select {
  background: var(--color-background-secondary);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 8px 12px;
  color: var(--color-text-primary);
  font-size: 13px;
  outline: none;
  min-width: 120px;
}

.filter-select:focus {
  border-color: var(--color-primary);
}

.sort-controls {
  display: flex;
  align-items: center;
}

/* Language Dropdown Styles */
.language-filter {
  position: relative;
}

.filter-select-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--color-background-secondary);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 8px 12px;
  color: var(--color-text-primary);
  font-size: 13px;
  cursor: pointer;
  min-width: 120px;
  justify-content: space-between;
  transition: all 0.2s;
}

.filter-select-btn:hover, .filter-select-btn.active {
  background: var(--color-background-tertiary);
  border-color: var(--color-border-hover);
}

.filter-select-btn.active {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.dropdown-arrow {
  transition: transform 0.2s;
  opacity: 0.5;
}

.dropdown-arrow.open {
  transform: rotate(180deg);
}

.language-menu {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  background: var(--color-background);
  border: 1px solid var(--color-border-secondary);
  border-radius: 8px;
  box-shadow: 0 4px 12px var(--color-shadow);
  width: 160px;
  max-height: 300px;
  overflow-y: auto;
  z-index: 100;
  padding: 4px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.language-menu .menu-item {
  text-align: left;
  padding: 6px 12px;
  background: transparent;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  color: var(--color-text-primary);
  cursor: pointer;
  transition: background 0.15s;
}

.language-menu .menu-item:hover {
  background: var(--color-background-secondary);
}

.language-menu .menu-item.active {
  background: rgba(var(--color-primary), 0.1);
  color: var(--color-primary);
  font-weight: 500;
}


.sort-select {
  background: var(--color-background-secondary);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 8px 12px;
  color: var(--color-text-primary);
  font-size: 13px;
  outline: none;
  min-width: 100px;
}

.sort-order-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: var(--color-border);
  border: none;
  border-radius: 6px;
  color: var(--color-text-secondary);
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
}

.sort-order-btn:hover {
  background: var(--color-border-secondary);
  color: var(--color-text-primary);
}

/* 标签过滤 */
.tags-filter {
  padding: 12px 24px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-background);
}

.tags-container {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  align-items: center;
}

.tag-filter {
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--color-border);
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  color: var(--color-text-secondary);
  font-size: 11px;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
}

.tag-filter:hover {
  background: var(--color-border-secondary);
  color: var(--color-text-primary);
}

.tag-filter.active {
  background: var(--color-primary);
  color: white;
}

.more-tags {
  font-size: 11px;
  color: var(--color-text-tertiary);
  padding: 4px 8px;
}

/* 虚拟列表容器 */
.snippets-container {
  flex: 1;
  overflow-y: auto;
  position: relative;
}

/* 主要内容区域 */
.snippets-container {
  flex: 1;
  overflow-y: auto;
  position: relative;
}

/* Direct rendering container */
.snippets-direct {
  width: 100%;
  min-height: 200px;
}

/* 卡片模式 */
.display-cards .snippets-direct {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 16px;
  padding: 16px;
}

.snippet-card {
  position: relative;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  min-height: 260px;
  height: 260px;
  display: flex;
  flex-direction: column;
}

.snippet-card:hover {
  border-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

/* 卡片头部 */
.card-header {
  padding: 12px 16px 10px;
  border-bottom: 1px solid var(--color-border);
}

.card-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.language-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  flex-shrink: 0;
}

/* 语言指示器颜色 */
.lang-javascript, .lang-typescript { background: #f7df1e20; color: #f7df1e; }
.lang-python { background: #306998; color: white; }
.lang-java { background: #ed8b0020; color: #ed8b00; }
.lang-cpp, .lang-csharp { background: #00599c20; color: #00599c; }
.lang-php { background: #777bb420; color: #777bb4; }
.lang-ruby { background: #cc342d20; color: #cc342d; }
.lang-go { background: #00add820; color: #00add8; }
.lang-rust { background: #ce422b20; color: #ce422b; }
.lang-swift { background: #fa7343; color: white; }
.lang-kotlin { background: #7f52ff20; color: #7f52ff; }
.lang-scala { background: #dc322f20; color: #dc322f; }
.lang-dart { background: #0175c220; color: #0175c2; }
.lang-html { background: #e34f2620; color: #e34f26; }
.lang-css, .lang-scss, .lang-less { background: #1572b620; color: #1572b6; }
.lang-sql, .lang-mysql, .lang-postgresql { background: #336791; color: white; }
.lang-json, .lang-yaml, .lang-xml, .lang-markdown { background: var(--color-border); color: var(--color-text-secondary); }
.lang-bash, .lang-powershell { background: #4eaa2520; color: #4eaa25; }
.lang-dockerfile { background: #2496ed20; color: #2496ed; }
.lang-graphql { background: #e10098; color: white; }
.lang-lua { background: #000080; color: white; }
.lang-r { background: #276dc320; color: #276dc3; }
.lang-matlab { background: #ff6600; color: white; }
.lang-perl { background: #39457e; color: white; }
.lang-haskell { background: #5d4f85; color: white; }
.lang-clojure { background: #5881d8; color: white; }
.lang-elixir { background: #6e4a7e; color: white; }
.lang-erlang { background: #a90533; color: white; }
.lang-fsharp { background: #378bba; color: white; }
.lang-vb { background: #945db7; color: white; }
.lang-objective-c { background: #438eff; color: white; }
.lang-assembly { background: #6e4c13; color: white; }

.card-title {
  flex: 1;
  margin: 0;
  color: var(--color-text-primary);
  font-size: 16px;
  font-weight: 600;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  /* 防止按钮重叠 */
  flex-shrink: 0;
  /* 确保足够的点击区域 */
  padding: 4px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: none;
  border: none;
  border-radius: 6px;
  color: var(--color-text-tertiary);
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
}

.action-btn:hover {
  background: var(--color-border);
  color: var(--color-text-primary);
}

.favorite-btn {
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 6px;
  /* 增加点击区域 */
  min-width: 36px;
  min-height: 36px;
  padding: 6px;
  /* 防止点击时的布局偏移 */
  transform-origin: center;
  /* 确保按钮在正确的层级 */
  z-index: 10;
  /* 防止事件冒泡干扰 */
  isolation: isolate;
}

.favorite-btn:hover {
  background: rgba(251, 191, 36, 0.1);
  color: #fbbf24;
  /* 减小悬停时的缩放，避免影响其他按钮 */
  transform: scale(1.05);
}

.favorite-btn.active {
  color: #fbbf24; /* 金黄色 */
  background: rgba(251, 191, 36, 0.15);
  /* 减小激活状态的缩放 */
  transform: scale(1.02);
  box-shadow: 0 0 0 2px rgba(251, 191, 36, 0.2);
}

.favorite-btn.active:hover {
  color: #f59e0b; /* 更深的金黄色 */
  background: rgba(251, 191, 36, 0.2);
  /* 减小悬停时的缩放 */
  transform: scale(1.08);
  box-shadow: 0 0 0 3px rgba(251, 191, 36, 0.3);
}

/* 修改点击动画，避免过度缩放 */
.favorite-btn:active {
  transform: scale(0.98);
  transition: transform 0.1s ease;
}

/* 修改收藏动画，减少对布局的影响 */
@keyframes favoriteGlow {
  0% { 
    box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.7);
    transform: scale(1.02);
  }
  50% { 
    box-shadow: 0 0 0 6px rgba(251, 191, 36, 0);
    transform: scale(1.06);
  }
  100% { 
    box-shadow: 0 0 0 0 rgba(251, 191, 36, 0);
    transform: scale(1.02);
  }
}

.favorite-btn.just-favorited {
  animation: favoriteGlow 0.6s ease-out;
}

/* 星星图标填充效果 */
.favorite-btn.active svg {
  fill: currentColor;
  filter: drop-shadow(0 0 4px rgba(251, 191, 36, 0.5));
}

.favorite-btn:not(.active) svg {
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
}

.dropdown {
  position: relative;
}

.dropdown-menu {
  position: absolute !important;
  top: 100% !important;
  right: 0 !important;
  background: var(--color-background) !important;
  border: 1px solid var(--color-border) !important;
  border-radius: 8px !important;
  box-shadow: 0 8px 24px var(--color-shadow) !important;
  z-index: 1000 !important;
  min-width: 200px !important;
  max-height: 500px !important;
  overflow-y: auto !important;
  padding: 4px !important;
  display: block !important;
  opacity: 1 !important;
  visibility: visible !important;
}

.menu-item {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  width: 100% !important;
  padding: 8px 12px !important;
  background: transparent !important;
  border: none !important;
  color: var(--color-text-primary) !important;
  font-size: 13px !important;
  cursor: pointer !important;
  transition: all 0.15s ease !important;
  text-align: left !important;
  opacity: 1 !important;
  visibility: visible !important;
  border-radius: 4px !important;
  margin: 1px 0 !important;
  position: relative !important;
  z-index: 1 !important;
}

.menu-item:hover {
  background: var(--color-border);
}

.menu-item.danger {
  color: var(--color-error);
}

.menu-item.danger:hover {
  background: rgba(var(--color-error), 0.1);
}

.menu-item.delete-item {
  color: var(--color-error) !important;
  background: rgba(var(--color-error-rgb, 239, 68, 68), 0.1) !important;
  border: 1px solid rgba(var(--color-error-rgb, 239, 68, 68), 0.3) !important;
  border-radius: 4px !important;
  margin: 2px !important;
  font-weight: 600 !important;
}

.menu-item.delete-item:hover {
  background: rgba(var(--color-error-rgb, 239, 68, 68), 0.2) !important;
  border-color: var(--color-error) !important;
}

.delete-warning {
  font-size: 12px !important;
  opacity: 0.8 !important;
  color: var(--color-error) !important;
  display: inline-block !important;
  visibility: visible !important;
}

.delete-btn {
  color: var(--color-error) !important;
  border: 1px solid transparent;
  transition: all 0.2s ease;
}

.delete-btn:hover {
  background: rgba(var(--color-error), 0.1) !important;
  border-color: var(--color-error);
  transform: scale(1.05);
}

.delete-text {
  font-size: 11px;
  margin-left: 4px;
  font-weight: 500;
}

.delete-btn-compact {
  color: var(--color-error) !important;
  opacity: 0.7;
  transition: all 0.2s ease;
}

.delete-btn-compact:hover {
  opacity: 1;
  background: rgba(var(--color-error), 0.1) !important;
  transform: scale(1.1);
}

.menu-divider {
  height: 1px !important;
  background: var(--color-border) !important;
  margin: 4px 8px !important;
  opacity: 1 !important;
  visibility: visible !important;
  display: block !important;
}

/* 同步子菜单样式 */
.sync-submenu {
  min-width: 180px !important;
  z-index: 1002 !important;
}

.submenu-trigger {
  justify-content: space-between !important;
}

.submenu-trigger:hover .submenu-arrow {
  transform: rotate(90deg);
}

.submenu-arrow {
  transition: transform 0.2s ease;
  opacity: 0.6;
}
.submenu-container {
  position: relative;
  overflow: visible; /* 确保子菜单可见 */
}

.submenu-trigger {
  position: relative;
  justify-content: space-between;
}

.submenu-trigger:hover .submenu-arrow {
  transform: rotate(90deg);
}

.submenu-arrow {
  transition: transform 0.2s ease;
}

.submenu {
  position: absolute;
  left: 100%;
  top: 0;
  background: var(--color-background) !important;
  border: 1px solid var(--color-border) !important;
  border-radius: 8px;
  box-shadow: 0 8px 24px var(--color-shadow) !important;
  z-index: 1001 !important;
  min-width: 200px;
  overflow: hidden;
  margin-left: 4px;
  display: block !important;
  opacity: 1 !important;
  visibility: visible !important;
}

.export-submenu {
  min-width: 220px !important;
  z-index: 1002 !important;
}

.submenu-section {
  padding: 8px 0;
}

.submenu-title {
  padding: 4px 12px;
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.submenu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  background: none;
  border: none;
  color: var(--color-text-primary);
  font-size: 13px;
  cursor: pointer;
  transition: background-color 0.15s ease;
  text-align: left;
  white-space: nowrap; /* 防止文本换行 */
}

.submenu-item:hover {
  background: var(--color-background-secondary);
}

/* 确保子菜单在所有情况下都可见 - 增强版 */
.export-submenu {
  min-width: 220px !important;
  z-index: 9999 !important;
  display: block !important;
  opacity: 1 !important;
  visibility: visible !important;
  position: fixed !important; /* 使用fixed定位避免被父容器限制 */
  background: var(--color-background) !important;
  border: 1px solid var(--color-border) !important;
  border-radius: 8px !important;
  box-shadow: 0 8px 24px var(--color-shadow) !important;
  margin-left: 4px !important;
  max-height: 400px !important;
  overflow-y: auto !important;
}

/* 临时调试样式 - 让子菜单更明显 */
.export-submenu {
  background: var(--color-primary) !important;
  color: white !important;
  border: 2px solid #ff0000 !important;
}

.submenu-divider {
  height: 1px;
  background: var(--color-border);
  margin: 4px 0;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
}

.language-tag {
  background: rgba(var(--color-primary), 0.1);
  color: var(--color-primary);
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 600;
}

.lines-count, .update-time {
  color: var(--color-text-tertiary);
}

/* 卡片内容区域 */
.card-content {
  background: var(--color-background-secondary);
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* 代码预览 */
.code-preview {
  position: relative;
}

.code-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: var(--color-background-tertiary);
  border-bottom: 1px solid var(--color-border);
}

.window-controls {
  display: flex;
  gap: 4px;
}

.control-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.control-dot.red { background: #ff5f57; }
.control-dot.yellow { background: #ffbd2e; }
.control-dot.green { background: #28ca42; }

.file-name {
  font-size: 11px;
  color: var(--color-text-tertiary);
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.copy-code-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: var(--color-border);
  border: none;
  border-radius: 4px;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
}

.copy-code-btn:hover {
  background: var(--color-primary);
  color: white;
}

.code-body {
  position: relative;
  max-height: 80px;
  overflow: hidden;
}

.code-body pre {
  margin: 0;
  padding: 10px 16px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  line-height: 1.5;
  color: var(--color-text-secondary);
  background: transparent;
}

.code-fade {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 20px;
  background: linear-gradient(transparent, var(--color-background-secondary));
  pointer-events: none;
}

/* Markdown 预览 */
.markdown-preview {
  padding: 12px 16px;
}

.description-section, .code-section, .usage-section {
  margin-bottom: 12px;
}

.description-section h4, .code-section h4, .usage-section h4 {
  margin: 0 0 8px;
  color: var(--color-text-primary);
  font-size: 14px;
  font-weight: 600;
}

.description-section p, .usage-section p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 14px;
  line-height: 1.5;
}

.code-snippet {
  background: var(--color-background-tertiary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;
}

.snippet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--color-background);
  border-bottom: 1px solid var(--color-border);
}

.snippet-header .language {
  font-size: 12px;
  color: var(--color-primary);
  font-weight: 600;
}

.copy-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
}

.copy-btn:hover {
  background: var(--color-primary-hover);
}

.code-snippet pre {
  margin: 0;
  padding: 12px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  line-height: 1.5;
  color: var(--color-text-secondary);
  background: transparent;
  max-height: 120px;
  overflow: auto;
}

/* 卡片底部 */
.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  background: var(--color-background);
  border-top: 1px solid var(--color-border);
}

.tags-section {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.tag {
  background: rgba(var(--color-primary), 0.1);
  color: var(--color-primary);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.tag-more {
  background: var(--color-border);
  color: var(--color-text-tertiary);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.footer-actions {
  display: flex;
  gap: 8px;
}

.use-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--color-primary);
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
}

.use-btn:hover {
  background: var(--color-primary-hover);
  transform: scale(1.05);
}

/* 列表模式 */
.display-list .snippets-direct {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px 24px;
}

.snippet-row {
  display: flex;
  align-items: center;
  gap: 16px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
}

.snippet-row:hover {
  border-color: var(--color-primary);
  background: var(--color-background-secondary);
  transform: translateX(4px);
}

.row-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  min-width: 0;
}

.row-content {
  flex: 1;
  min-width: 0;
}

.row-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.row-title {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 15px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.row-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.language {
  background: rgba(var(--color-primary), 0.1);
  color: var(--color-primary);
  padding: 2px 6px;
  border-radius: 3px;
  font-weight: 500;
}

.row-description {
  margin: 4px 0;
  color: var(--color-text-secondary);
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.row-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.tag-small {
  background: rgba(var(--color-primary), 0.1);
  color: var(--color-primary);
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 500;
}

.row-right {
  display: flex;
  align-items: center;
}

.row-actions {
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.2s ease;
  /* 防止按钮重叠 */
  flex-shrink: 0;
  /* 确保足够的点击区域 */
  padding: 4px;
}

.snippet-row:hover .row-actions {
  opacity: 1;
}

.action-btn.danger {
  color: var(--color-error);
}

.action-btn.danger:hover {
  background: rgba(var(--color-error), 0.1);
  color: var(--color-error);
}

/* 紧凑模式 */
.display-compact .snippets-direct {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px 24px;
}

.snippet-compact {
  display: flex;
  align-items: center;
  gap: 16px;
  background: var(--color-background);
  border: 1px solid transparent;
  border-radius: 6px;
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
}

.snippet-compact:hover {
  background: var(--color-background-secondary);
  border-color: var(--color-border);
}

.compact-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 200px;
}

.compact-left .language-indicator {
  width: 24px;
  height: 24px;
}

.compact-title {
  color: var(--color-text-primary);
  font-size: 14px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.compact-center {
  flex: 1;
  min-width: 0;
}

.compact-description {
  color: var(--color-text-secondary);
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.compact-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.compact-meta {
  color: var(--color-text-tertiary);
  font-size: 12px;
  white-space: nowrap;
}

.compact-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.snippet-compact:hover .compact-actions {
  opacity: 1;
}

.compact-actions .action-btn {
  width: 24px;
  height: 24px;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 40px;
  text-align: center;
  color: var(--color-text-tertiary);
}

.empty-icon {
  margin-bottom: 20px;
  opacity: 0.5;
}

.empty-state h3 {
  margin: 0 0 12px;
  color: var(--color-text-secondary);
  font-size: 20px;
  font-weight: 600;
}

.empty-state p {
  margin: 0 0 24px;
  font-size: 14px;
  line-height: 1.5;
  max-width: 400px;
}

.link-btn {
  background: none;
  border: none;
  color: var(--color-primary);
  cursor: pointer;
  text-decoration: underline;
  font-size: inherit;
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--color-primary);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
}

.btn-primary:hover {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
}

/* 回到顶部按钮 */
.scroll-to-top {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 48px;
  height: 48px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 4px 12px var(--color-shadow);
  transition: background-color 0.15s ease, color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
  z-index: 100;
}

.scroll-to-top:hover {
  background: var(--color-primary-hover);
  transform: translateY(-2px);
}

/* 响应式设计 */
@media (max-width: 1400px) {
  .display-cards .snippets-direct {
    grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
    gap: 20px;
  }
}

@media (max-width: 1200px) {
  .display-cards .snippets-direct {
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: 18px;
    padding: 20px;
  }
}

@media (max-width: 768px) {
  .list-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
    padding: 16px 20px;
  }
  
  .header-left, .header-right {
    justify-content: space-between;
  }
  
  .header-right {
    flex-direction: column;
    gap: 12px;
  }
  
  .display-mode-controls, .content-mode-controls {
    align-self: stretch;
  }
  
  .mode-btn, .content-btn {
    flex: 1;
    justify-content: center;
  }
  
  .search-filter-bar {
    padding: 12px 16px;
  }
  
  .filter-section {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .quick-filters {
    justify-content: center;
  }
  
  .language-filter, .sort-controls {
    justify-content: center;
  }
  
  .display-cards .snippets-direct {
    grid-template-columns: 1fr;
    padding: 16px;
    gap: 16px;
  }
  
  .display-list .snippets-direct {
    padding: 16px;
  }
  
  .display-compact .snippets-direct {
    padding: 8px 16px;
  }
  
  .snippet-card {
    border-radius: 10px;
  }
  
  .card-header {
    padding: 16px 16px 12px;
  }
  
  .card-content .code-preview .code-body {
    max-height: 120px;
  }
  
  .card-content .markdown-preview {
    padding: 16px;
  }
  
  .card-footer {
    padding: 12px 16px;
  }
  
  .snippet-row {
    padding: 12px;
  }
  
  .row-left {
    gap: 12px;
  }
  
  .compact-left {
    min-width: 150px;
  }
}

@media (max-width: 480px) {
  .list-header {
    padding: 12px 16px;
  }
  
  .title-section h2 {
    font-size: 20px;
  }
  
  .search-filter-bar {
    padding: 8px 12px;
  }
  
  .display-cards .snippets-direct {
    padding: 12px;
    gap: 12px;
  }
  
  .card-header {
    padding: 12px 12px 8px;
  }
  
  .card-title-row {
    margin-bottom: 8px;
  }
  
  .language-indicator {
    width: 28px;
    height: 28px;
  }
  
  .card-title {
    font-size: 15px;
  }
  
  .card-content .code-preview .code-body {
    max-height: 100px;
  }
  
  .card-content .markdown-preview {
    padding: 12px;
  }
  
  .card-footer {
    padding: 8px 12px;
  }
  
  .display-list .snippets-direct {
    padding: 12px;
    gap: 8px;
  }
  
  .snippet-row {
    padding: 8px;
    gap: 8px;
  }
  
  .row-left {
    gap: 8px;
  }
  
  .language-indicator {
    width: 24px;
    height: 24px;
  }
  
  .display-compact .snippets-direct {
    padding: 4px 12px;
  }
  
  .snippet-compact {
    padding: 6px 8px;
    gap: 8px;
  }
  
  .compact-left {
    min-width: 120px;
    gap: 8px;
  }
  
  .compact-right {
    gap: 8px;
  }
}

/* 滚动条样式 */
.snippets-container::-webkit-scrollbar {
  width: 8px;
}

.snippets-container::-webkit-scrollbar-track {
  background: var(--color-background-secondary);
}

.snippets-container::-webkit-scrollbar-thumb {
  background: var(--color-border-secondary);
  border-radius: 4px;
}

.snippets-container::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-tertiary);
}

/* 动画优化 */
@media (prefers-reduced-motion: reduce) {
  .snippet-card,
  .snippet-row,
  .btn-create,
  .btn-primary,
  .scroll-to-top {
    transition: none;
    transform: none;
  }
  
  .snippet-card:hover,
  .btn-create:hover,
  .btn-primary:hover,
  .scroll-to-top:hover {
    transform: none;
  }
}
</style>

<style scoped>
/* Sync Status Icons */
.synced-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 6px;
  padding: 4px;
  border-radius: 4px;
}

.synced-badge.github {
  color: #24292e;
  background: rgba(36, 41, 46, 0.1);
}

.synced-badge.gitee {
  color: #c71d23;
  background: rgba(199, 29, 35, 0.1);
}

.synced-badge.gitlab {
  color: #fc6d26;
  background: rgba(252, 109, 38, 0.1);
}

.synced-badge-row {
  display: inline-flex;
  align-items: center;
  margin-left: 4px;
}

.synced-badge-row.github {
  color: #24292e;
}

.synced-badge-row.gitee {
  color: #c71d23;
}

.synced-badge-row.gitlab {
  color: #fc6d26;
}

.sync-icon-mini {
  display: inline-flex;
  margin-right: 4px;
}

.sync-icon-mini.github {
  color: #24292e;
}

.sync-icon-mini.gitee {
  color: #c71d23;
}

.sync-icon-mini.gitlab {
  color: #fc6d26;
}

/* 删除确认模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
  animation: fadeIn 0.2s ease-out;
  opacity: 1;
  visibility: visible;
}

.delete-confirm-modal {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  max-width: 400px;
  width: 90%;
  max-height: 90vh;
  overflow: hidden;
  animation: slideIn 0.3s ease-out;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--color-border);
}

.modal-header h3 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 18px;
  font-weight: 600;
}

.modal-close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: none;
  border: none;
  border-radius: 6px;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.modal-close-btn:hover {
  background: var(--color-border);
  color: var(--color-text-primary);
}

.modal-body {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px 24px;
}

.warning-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: rgba(var(--color-error), 0.1);
  border-radius: 50%;
  color: var(--color-error);
  flex-shrink: 0;
}

.warning-content {
  flex: 1;
}

.warning-title {
  margin: 0 0 8px 0;
  color: var(--color-text-primary);
  font-size: 16px;
  font-weight: 600;
}

.warning-description {
  margin: 0 0 12px 0;
  color: var(--color-text-secondary);
  font-size: 14px;
  line-height: 1.5;
}

.warning-note {
  margin: 0;
  color: var(--color-text-tertiary);
  font-size: 13px;
  font-style: italic;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px 20px;
  border-top: 1px solid var(--color-border);
}

.btn-cancel {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--color-background-secondary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-cancel:hover {
  background: var(--color-background-tertiary);
  border-color: var(--color-border-hover);
}

.btn-delete {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--color-error);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-delete:hover {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(var(--color-error-rgb), 0.3);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 同步选项弹窗样式 */
.sync-modal {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow: hidden;
  animation: slideIn 0.3s ease-out;
  position: relative;
  z-index: 1001;
  display: block;
  opacity: 1;
  visibility: visible;
}

.sync-options {
  padding: 20px;
}

.sync-section {
  margin-bottom: 24px;
}

.sync-section:last-child {
  margin-bottom: 0;
}

.sync-section h4 {
  margin: 0 0 12px 0;
  color: var(--color-text-primary);
  font-size: 14px;
  font-weight: 600;
}

.sync-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sync-btn {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  padding: 16px 20px;
  background: var(--color-background-secondary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  color: var(--color-text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.sync-btn:hover:not(:disabled) {
  background: var(--color-background-tertiary);
  border-color: var(--color-primary);
  transform: translateY(-1px);
}

.sync-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.sync-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.platform-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.sync-status {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.sync-description {
  background: var(--color-background-secondary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 16px;
}

.sync-description p {
  margin: 0 0 8px 0;
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.5;
}

.sync-description p:last-child {
  margin-bottom: 0;
}

/* 导出选项弹窗样式 */
.export-modal {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow: hidden;
  animation: slideIn 0.3s ease-out;
  position: relative;
  z-index: 1001;
  display: block;
  opacity: 1;
  visibility: visible;
}

.export-options {
  padding: 20px;
}

.export-section {
  margin-bottom: 24px;
}

.export-section:last-child {
  margin-bottom: 0;
}

.export-section h4 {
  margin: 0 0 12px 0;
  color: var(--color-text-primary);
  font-size: 14px;
  font-weight: 600;
}

.export-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.export-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 16px;
  background: var(--color-background-secondary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  color: var(--color-text-primary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.export-btn:hover {
  background: var(--color-background-tertiary);
  border-color: var(--color-primary);
  transform: translateY(-1px);
}

.export-btn span {
  flex: 1;
}

/* 修复按钮可见性问题 */
.action-btn {
  display: flex !important;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  min-height: 28px;
  background: var(--color-background-secondary);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  opacity: 1;
  visibility: visible;
}

.action-btn:hover {
  background: var(--color-background-tertiary);
  border-color: var(--color-primary);
  color: var(--color-text-primary);
  transform: scale(1.05);
}

/* 删除按钮特殊样式 */
.delete-btn, .delete-btn-compact {
  color: var(--color-error) !important;
  border-color: rgba(var(--color-error), 0.3) !important;
  background: rgba(var(--color-error), 0.05) !important;
}

.delete-btn:hover, .delete-btn-compact:hover {
  background: rgba(var(--color-error), 0.15) !important;
  border-color: var(--color-error) !important;
  color: var(--color-error) !important;
  transform: scale(1.1) !important;
}

/* 导出按钮修复 */
.btn-export {
  display: flex !important;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: var(--color-background-secondary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  opacity: 1;
  visibility: visible;
}

.btn-export:hover {
  background: var(--color-background-tertiary);
  border-color: var(--color-primary);
  transform: translateY(-1px);
}

/* 强制显示所有按钮 - 使用主题变量 */
.header-right {
  display: flex !important;
  align-items: center !important;
  gap: 16px !important;
}

.header-right > * {
  display: flex !important;
  opacity: 1 !important;
  visibility: visible !important;
}

.btn-export {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  padding: 10px 16px !important;
  background: var(--color-background-secondary) !important;
  color: var(--color-text-primary) !important;
  border: 1px solid var(--color-border) !important;
  border-radius: 8px !important;
  font-size: 14px !important;
  font-weight: 500 !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
  opacity: 1 !important;
  visibility: visible !important;
  position: relative !important;
  z-index: 1 !important;
  min-width: 100px !important;
}

.btn-export:hover {
  background: var(--color-background-tertiary) !important;
  border-color: var(--color-primary) !important;
  transform: translateY(-1px) !important;
}

/* 删除按钮使用主题变量 */
.action-btn.delete-btn,
.action-btn.delete-btn-compact {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  min-width: 32px !important;
  min-height: 32px !important;
  background: rgba(var(--color-error-rgb), 0.05) !important;
  border: 1px solid rgba(var(--color-error-rgb), 0.2) !important;
  border-radius: 6px !important;
  color: var(--color-error) !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
  opacity: 1 !important;
  visibility: visible !important;
  position: relative !important;
  z-index: 10 !important;
}

.action-btn.delete-btn:hover,
.action-btn.delete-btn-compact:hover {
  background: rgba(var(--color-error-rgb), 0.15) !important;
  border-color: var(--color-error) !important;
  color: var(--color-error) !important;
  transform: scale(1.1) !important;
}

/* 确保行动按钮容器可见 */
.row-actions,
.compact-actions,
.card-actions {
  display: flex !important;
  align-items: center !important;
  gap: 4px !important;
  opacity: 1 !important;
  visibility: visible !important;
  position: relative !important;
  z-index: 5 !important;
}

/* 下拉菜单使用主题变量 */
.dropdown {
  position: relative !important;
  display: inline-block !important;
}

.dropdown-menu {
  position: absolute !important;
  top: 100% !important;
  right: 0 !important;
  background: var(--color-background) !important;
  border: 1px solid var(--color-border) !important;
  border-radius: 8px !important;
  box-shadow: 0 8px 24px var(--color-shadow) !important;
  z-index: 1000 !important;
  min-width: 200px !important;
  overflow: visible !important;
  display: block !important;
  opacity: 1 !important;
  visibility: visible !important;
}

.batch-export-menu {
  min-width: 220px !important;
  right: 0 !important;
  top: 100% !important;
  margin-top: 4px !important;
}

/* 调试功能已移除 - 按钮应该正常显示并跟随主题 */

/* 确保所有按钮都跟随主题 */
.action-btn {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  min-width: 28px !important;
  min-height: 28px !important;
  background: var(--color-background-secondary) !important;
  border: 1px solid var(--color-border) !important;
  border-radius: 6px !important;
  color: var(--color-text-secondary) !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
  opacity: 1 !important;
  visibility: visible !important;
  position: relative !important;
  z-index: 1 !important;
}

.action-btn:hover {
  background: var(--color-background-tertiary) !important;
  border-color: var(--color-primary) !important;
  color: var(--color-text-primary) !important;
  transform: scale(1.05) !important;
}

/* Sync Status Icons */
.synced-badge-row.gitee {
  color: #C71D23;
  background: rgba(199, 29, 35, 0.1);
}

.synced-badge-row.github { 
  color: #24292e; 
  margin-left: 8px; 
}

.synced-badge-row.gitee { 
  color: #C71D23; 
  margin-left: 8px; 
}

.menu-divider {
  height: 1px;
  background: var(--color-border);
  margin: 4px 0;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin { 
  from { transform: rotate(0deg); } 
  to { transform: rotate(360deg); } 
}

.sync-icon-mini {
  display: inline-flex;
  margin-right: 4px;
  vertical-align: text-bottom;
}

.sync-icon-mini.github { 
  color: #24292e; 
}

.sync-icon-mini.gitee { 
  color: #C71D23; 
}

.sync-icon-mini.gitlab { 
  color: #FC6D26; 
}

.synced-badge.gitlab {
  color: #FC6D26;
  background: rgba(252, 109, 38, 0.1);
}

.synced-badge-row.gitlab { 
  color: #FC6D26; 
  margin-left: 8px; 
}
</style>
