/**
 * SnippetsHub - 专业代码片段管理工具
 * 
 * @file FavoriteGroupManager.vue - 收藏分组管理组件
 * @author Noah
 * @description 管理收藏代码片段的分组功能
 * @created 2026-02-02
 * @version 1.0.0
 * 
 * 功能特性:
 * - 创建和管理收藏分组
 * - 拖拽排序分组
 * - 分组颜色和图标自定义
 * - 分组内代码片段管理
 * - 快速过滤和搜索
 */

<template>
  <div class="favorite-group-manager">
    <!-- 简化的分组管理头部 -->
    <div class="group-header">
      <h3>收藏分组</h3>
      <button @click="showCreateGroup = true" class="btn-create-group">
        <Plus :size="16" />
        新建分组
      </button>
    </div>

    <!-- 分组列表 -->
    <div class="groups-container">
      <!-- 默认分组（所有收藏） -->
      <div 
        class="group-item default-group"
        :class="{ active: selectedGroupId === 'all' }"
        @click="selectGroup('all')"
      >
        <div class="group-icon">
          <Star :size="20" />
        </div>
        <div class="group-info">
          <div class="group-name">所有收藏</div>
          <div class="group-count">{{ totalFavorites }} 个片段</div>
        </div>
        <div class="group-actions">
          <span class="snippet-count">{{ totalFavorites }}</span>
        </div>
      </div>

      <!-- 自定义分组 -->
      <div 
        v-for="group in favoriteGroups" 
        :key="group.id"
        class="group-item"
        :class="{ active: selectedGroupId === group.id }"
        @click="selectGroup(group.id)"
      >
        <div class="group-icon" :style="{ color: group.color }">
          <component :is="getGroupIcon(group.icon)" :size="20" />
        </div>
        <div class="group-info">
          <div class="group-name">{{ group.name }}</div>
          <div class="group-description">{{ group.description || '暂无描述' }}</div>
        </div>
        <div class="group-actions">
          <span class="snippet-count">{{ getGroupSnippetCount(group.id) }}</span>
          <button @click.stop="editGroup(group)" class="action-btn">
            <Edit :size="14" />
          </button>
          <button @click.stop="deleteGroup(group.id)" class="action-btn delete-btn">
            <Trash2 :size="14" />
          </button>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="favoriteGroups.length === 0" class="empty-groups">
        <div class="empty-icon">
          <FolderPlus :size="48" />
        </div>
        <div class="empty-title">还没有收藏分组</div>
        <div class="empty-description">创建分组来更好地组织你的收藏代码片段</div>
        <button @click="showCreateGroup = true" class="btn-create-first">
          创建第一个分组
        </button>
      </div>
    </div>

    <!-- 创建/编辑分组弹窗 -->
    <div v-if="showCreateGroup || editingGroup" class="modal-overlay" @click="closeGroupModal">
      <div class="group-modal" @click.stop>
        <div class="modal-header">
          <h3>{{ editingGroup ? '编辑分组' : '创建分组' }}</h3>
          <button @click="closeGroupModal" class="modal-close-btn">
            <X :size="16" />
          </button>
        </div>
        
        <div class="modal-body">
          <div class="form-group">
            <label>分组名称</label>
            <input 
              v-model="groupForm.name" 
              type="text" 
              placeholder="输入分组名称"
              class="form-input"
              maxlength="50"
            />
          </div>
          
          <div class="form-group">
            <label>分组描述</label>
            <textarea 
              v-model="groupForm.description" 
              placeholder="输入分组描述（可选）"
              class="form-textarea"
              maxlength="200"
            ></textarea>
          </div>
          
          <div class="form-group">
            <label>分组图标</label>
            <div class="icon-selector">
              <button 
                v-for="icon in availableIcons" 
                :key="icon.name"
                class="icon-option"
                :class="{ active: groupForm.icon === icon.name }"
                @click="groupForm.icon = icon.name"
              >
                <component :is="icon.component" :size="20" />
              </button>
            </div>
          </div>
          
          <div class="form-group">
            <label>分组颜色</label>
            <div class="color-selector">
              <button 
                v-for="color in availableColors" 
                :key="color"
                class="color-option"
                :class="{ active: groupForm.color === color }"
                :style="{ backgroundColor: color }"
                @click="groupForm.color = color"
              ></button>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="closeGroupModal" class="btn-cancel">
            取消
          </button>
          <button @click="saveGroup" class="btn-save" :disabled="!groupForm.name.trim()">
            {{ editingGroup ? '保存' : '创建' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 分组内容区域 -->
    <div class="group-content">
      <div v-if="selectedGroupId" class="selected-group-header">
        <h4>{{ getSelectedGroupName() }}</h4>
        <div class="group-tools">
          <button @click="showAddToGroup = true" class="btn-add-snippets">
            <Plus :size="14" />
            添加代码片段
          </button>
        </div>
      </div>
      
      <!-- 这里会显示选中分组的代码片段 -->
      <div class="group-snippets">
        <slot :selectedGroupId="selectedGroupId" :groupSnippets="getGroupSnippets(selectedGroupId)"></slot>
      </div>
    </div>

    <!-- 添加代码片段到分组弹窗 -->
    <div v-if="showAddToGroup" class="modal-overlay" @click="closeAddToGroupModal">
      <div class="add-snippets-modal" @click.stop>
        <div class="modal-header">
          <h3>添加代码片段到分组</h3>
          <button @click="closeAddToGroupModal" class="modal-close-btn">
            <X :size="16" />
          </button>
        </div>
        
        <div class="modal-body">
          <div class="search-snippets">
            <input 
              v-model="snippetSearchQuery" 
              type="text" 
              placeholder="搜索代码片段..."
              class="form-input"
            />
          </div>
          
          <div class="snippets-list">
            <div 
              v-for="snippet in availableSnippets" 
              :key="snippet.id"
              class="snippet-item"
              :class="{ selected: selectedSnippets.includes(snippet.id) }"
              @click="toggleSnippetSelection(snippet.id)"
            >
              <div class="snippet-info">
                <div class="snippet-title">{{ snippet.title }}</div>
                <div class="snippet-language">{{ snippet.language }}</div>
              </div>
              <div class="snippet-checkbox">
                <input 
                  type="checkbox" 
                  :checked="selectedSnippets.includes(snippet.id)"
                  @change="toggleSnippetSelection(snippet.id)"
                />
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="closeAddToGroupModal" class="btn-cancel">
            取消
          </button>
          <button @click="addSnippetsToGroup" class="btn-save" :disabled="selectedSnippets.length === 0">
            添加 {{ selectedSnippets.length }} 个片段
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { 
  Plus, Star, Edit, Trash2, X, FolderPlus, 
  Folder, Heart, Bookmark, Tag, Code2, 
  Database, Globe, Palette, Zap, Coffee
} from 'lucide-vue-next'

const props = defineProps({
  favoriteSnippets: {
    type: Array,
    default: () => []
  },
  allSnippets: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['groupSelected', 'groupCreated', 'groupUpdated', 'groupDeleted', 'snippetsAddedToGroup'])

// 响应式状态
const favoriteGroups = ref([])
const selectedGroupId = ref('all')
const showCreateGroup = ref(false)
const editingGroup = ref(null)
const showAddToGroup = ref(false)
const snippetSearchQuery = ref('')
const selectedSnippets = ref([])

// 分组表单
const groupForm = ref({
  name: '',
  description: '',
  icon: 'Folder',
  color: '#3b82f6'
})

// 可用图标
const availableIcons = [
  { name: 'Folder', component: Folder },
  { name: 'Heart', component: Heart },
  { name: 'Bookmark', component: Bookmark },
  { name: 'Tag', component: Tag },
  { name: 'Code2', component: Code2 },
  { name: 'Database', component: Database },
  { name: 'Globe', component: Globe },
  { name: 'Palette', component: Palette },
  { name: 'Zap', component: Zap },
  { name: 'Coffee', component: Coffee }
]

// 可用颜色
const availableColors = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
  '#f97316', '#6366f1', '#14b8a6', '#eab308'
]

// 计算属性
const totalFavorites = computed(() => props.favoriteSnippets.length)

const availableSnippets = computed(() => {
  return props.favoriteSnippets.filter(snippet => {
    const matchesSearch = !snippetSearchQuery.value || 
      snippet.title.toLowerCase().includes(snippetSearchQuery.value.toLowerCase()) ||
      snippet.language.toLowerCase().includes(snippetSearchQuery.value.toLowerCase())
    
    // 排除已经在当前分组中的片段
    const notInCurrentGroup = selectedGroupId.value === 'all' || 
      !isSnippetInGroup(snippet.id, selectedGroupId.value)
    
    return matchesSearch && notInCurrentGroup
  })
})

// 方法
const getGroupIcon = (iconName) => {
  const icon = availableIcons.find(i => i.name === iconName)
  return icon ? icon.component : Folder
}

const getGroupSnippetCount = (groupId) => {
  const group = favoriteGroups.value.find(g => g.id === groupId)
  return group ? group.snippetIds.length : 0
}

const getSelectedGroupName = () => {
  if (selectedGroupId.value === 'all') return '所有收藏'
  const group = favoriteGroups.value.find(g => g.id === selectedGroupId.value)
  return group ? group.name : ''
}

const getGroupSnippets = (groupId) => {
  if (groupId === 'all') return props.favoriteSnippets
  
  const group = favoriteGroups.value.find(g => g.id === groupId)
  if (!group) return []
  
  return props.favoriteSnippets.filter(snippet => 
    group.snippetIds.includes(snippet.id)
  )
}

const isSnippetInGroup = (snippetId, groupId) => {
  const group = favoriteGroups.value.find(g => g.id === groupId)
  return group ? group.snippetIds.includes(snippetId) : false
}

const selectGroup = (groupId) => {
  selectedGroupId.value = groupId
  emit('groupSelected', groupId, getGroupSnippets(groupId))
}

const editGroup = (group) => {
  editingGroup.value = group
  groupForm.value = {
    name: group.name,
    description: group.description || '',
    icon: group.icon,
    color: group.color
  }
}

const closeGroupModal = () => {
  showCreateGroup.value = false
  editingGroup.value = null
  groupForm.value = {
    name: '',
    description: '',
    icon: 'Folder',
    color: '#3b82f6'
  }
}

const saveGroup = () => {
  if (!groupForm.value.name.trim()) return
  
  const groupData = {
    id: editingGroup.value ? editingGroup.value.id : `group_${Date.now()}`,
    name: groupForm.value.name.trim(),
    description: groupForm.value.description.trim(),
    icon: groupForm.value.icon,
    color: groupForm.value.color,
    snippetIds: editingGroup.value ? editingGroup.value.snippetIds : [],
    createdAt: editingGroup.value ? editingGroup.value.createdAt : Date.now(),
    updatedAt: Date.now()
  }
  
  if (editingGroup.value) {
    // 更新分组
    const index = favoriteGroups.value.findIndex(g => g.id === editingGroup.value.id)
    if (index !== -1) {
      favoriteGroups.value[index] = groupData
    }
    emit('groupUpdated', groupData)
  } else {
    // 创建分组
    favoriteGroups.value.push(groupData)
    emit('groupCreated', groupData)
  }
  
  // 保存到本地存储
  saveFavoriteGroups()
  closeGroupModal()
}

const deleteGroup = (groupId) => {
  if (confirm('确定要删除这个分组吗？分组内的代码片段不会被删除。')) {
    favoriteGroups.value = favoriteGroups.value.filter(g => g.id !== groupId)
    if (selectedGroupId.value === groupId) {
      selectedGroupId.value = 'all'
    }
    saveFavoriteGroups()
    emit('groupDeleted', groupId)
  }
}

const closeAddToGroupModal = () => {
  showAddToGroup.value = false
  snippetSearchQuery.value = ''
  selectedSnippets.value = []
}

const toggleSnippetSelection = (snippetId) => {
  const index = selectedSnippets.value.indexOf(snippetId)
  if (index > -1) {
    selectedSnippets.value.splice(index, 1)
  } else {
    selectedSnippets.value.push(snippetId)
  }
}

const addSnippetsToGroup = () => {
  if (selectedGroupId.value === 'all' || selectedSnippets.value.length === 0) return
  
  const group = favoriteGroups.value.find(g => g.id === selectedGroupId.value)
  if (group) {
    // 添加片段到分组，避免重复
    selectedSnippets.value.forEach(snippetId => {
      if (!group.snippetIds.includes(snippetId)) {
        group.snippetIds.push(snippetId)
      }
    })
    
    group.updatedAt = Date.now()
    saveFavoriteGroups()
    emit('snippetsAddedToGroup', selectedGroupId.value, selectedSnippets.value)
  }
  
  closeAddToGroupModal()
}

const saveFavoriteGroups = () => {
  localStorage.setItem('favorite-groups', JSON.stringify(favoriteGroups.value))
}

const loadFavoriteGroups = () => {
  try {
    const saved = localStorage.getItem('favorite-groups')
    if (saved) {
      favoriteGroups.value = JSON.parse(saved)
    }
  } catch (error) {
    console.error('Failed to load favorite groups:', error)
  }
}

// 生命周期
onMounted(() => {
  loadFavoriteGroups()
})
</script>

<style scoped>
.favorite-group-manager {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-background-secondary);
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-background);
}

.group-header h3 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 16px;
  font-weight: 600;
}

.btn-create-group {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--color-primary);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: background-color 0.2s ease;
}

.btn-create-group:hover {
  background: var(--color-primary-hover);
}

.groups-container {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
}

.group-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.group-item:hover {
  border-color: var(--color-primary);
  background: var(--color-background-secondary);
}

.group-item.active {
  border-color: var(--color-primary);
  background: rgba(var(--color-primary), 0.05);
}

.group-item.default-group {
  border-color: var(--color-warning);
  background: rgba(var(--color-warning), 0.05);
}

.group-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: var(--color-background-secondary);
  border-radius: 8px;
  color: var(--color-primary);
  flex-shrink: 0;
}

.group-info {
  flex: 1;
}

.group-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 2px;
}

.group-description {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.group-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.snippet-count {
  background: var(--color-border);
  color: var(--color-text-secondary);
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: none;
  border: none;
  border-radius: 6px;
  color: var(--color-text-tertiary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: var(--color-border);
  color: var(--color-text-primary);
}

.delete-btn:hover {
  background: rgba(var(--color-error), 0.1);
  color: var(--color-error);
}

.empty-groups {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.empty-icon {
  color: var(--color-text-tertiary);
  margin-bottom: 16px;
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 8px;
}

.empty-description {
  color: var(--color-text-secondary);
  margin-bottom: 24px;
}

.btn-create-first {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--color-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.group-modal,
.add-snippets-modal {
  background: var(--color-background);
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 20px 40px var(--color-shadow);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
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
  color: var(--color-text-tertiary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.modal-close-btn:hover {
  background: var(--color-border);
  color: var(--color-text-primary);
}

.modal-body {
  padding: 24px;
  max-height: 60vh;
  overflow-y: auto;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: var(--color-text-primary);
  font-size: 14px;
  font-weight: 500;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 12px;
  background: var(--color-background-secondary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  color: var(--color-text-primary);
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s ease;
}

.form-input:focus,
.form-textarea:focus {
  border-color: var(--color-primary);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.icon-selector {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

.icon-option {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: var(--color-background-secondary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.icon-option:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.icon-option.active {
  border-color: var(--color-primary);
  background: rgba(var(--color-primary), 0.1);
  color: var(--color-primary);
}

.color-selector {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
}

.color-option {
  width: 40px;
  height: 40px;
  border: 2px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.color-option:hover {
  transform: scale(1.1);
}

.color-option.active {
  border-color: var(--color-text-primary);
  transform: scale(1.1);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid var(--color-border);
}

.btn-cancel,
.btn-save {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-cancel {
  background: none;
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
}

.btn-cancel:hover {
  background: var(--color-border);
  color: var(--color-text-primary);
}

.btn-save {
  background: var(--color-primary);
  border: none;
  color: white;
}

.btn-save:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.btn-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 分组内容区域 */
.group-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.selected-group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-background);
}

.selected-group-header h4 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 16px;
  font-weight: 600;
}

.btn-add-snippets {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--color-background-secondary);
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s ease;
}

.btn-add-snippets:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.group-snippets {
  flex: 1;
  overflow: hidden;
}

/* 添加片段弹窗 */
.snippets-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  margin-top: 12px;
}

.snippet-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border);
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.snippet-item:last-child {
  border-bottom: none;
}

.snippet-item:hover {
  background: var(--color-background-secondary);
}

.snippet-item.selected {
  background: rgba(var(--color-primary), 0.1);
  border-color: var(--color-primary);
}

.snippet-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: 4px;
}

.snippet-language {
  font-size: 12px;
  color: var(--color-text-secondary);
}
</style>