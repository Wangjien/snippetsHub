<template>
  <div class="modal-overlay" @click.self="$emit('cancel')">
    <div class="modal-container">
      <div class="modal-header">
        <h2 class="title">选择创建模式</h2>
        <p class="subtitle">请选择最适合您内容的创作方式</p>
      </div>

      <div class="mode-grid">
        <!-- 代码片段模式 -->
        <div 
          class="mode-card" 
          :class="{ active: selectedMode === 'code' }"
          @click="selectedMode = 'code'"
        >
          <div class="check-mark" v-if="selectedMode === 'code'">
            <CheckCircle2 :size="20" />
          </div>
          <div class="icon-wrapper code-gradient">
            <Code2 :size="32" />
          </div>
          <h3 class="mode-name">代码片段</h3>
          <p class="mode-desc">传统的代码编辑模式，支持语法高亮和智能提示。</p>
          
          <ul class="features">
            <li>
              <Check :size="14" class="feature-icon" />
              <span>Monaco 专业编辑器</span>
            </li>
            <li>
              <Check :size="14" class="feature-icon" />
              <span>多语言语法高亮</span>
            </li>
            <li>
              <Check :size="14" class="feature-icon" />
              <span>云端自动同步</span>
            </li>
            <li>
              <Check :size="14" class="feature-icon" />
              <span>适合脚本、配置、算法</span>
            </li>
          </ul>
        </div>

        <!-- Markdown 模式 -->
        <div 
          class="mode-card" 
          :class="{ active: selectedMode === 'markdown' }"
          @click="selectedMode = 'markdown'"
        >
          <div class="check-mark" v-if="selectedMode === 'markdown'">
            <CheckCircle2 :size="20" />
          </div>
          <div class="icon-wrapper doc-gradient">
            <FileText :size="32" />
          </div>
          <h3 class="mode-name">Markdown 文档</h3>
          <p class="mode-desc">图文并茂的文档模式，支持实时渲染与预览。</p>
          
          <ul class="features">
            <li>
              <Check :size="14" class="feature-icon" />
              <span>所见即所得预览</span>
            </li>
            <li>
              <Check :size="14" class="feature-icon" />
              <span>支持 Mermaid & 公式</span>
            </li>
            <li>
              <Check :size="14" class="feature-icon" />
              <span>沉浸式写作体验</span>
            </li>
            <li>
              <Check :size="14" class="feature-icon" />
              <span>适合笔记、教程、文档</span>
            </li>
          </ul>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-cancel" @click="$emit('cancel')">取消</button>
        <button class="btn-confirm" @click="confirmSelection">
          <span>继续创建</span>
          <ArrowRight :size="16" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Code2, FileText, Check, CheckCircle2, ArrowRight } from 'lucide-vue-next'

const emit = defineEmits(['cancel', 'select'])
const selectedMode = ref('code') // default

const confirmSelection = () => {
  emit('select', selectedMode.value)
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fade-in 0.2s ease-out;
}

.modal-container {
  width: 900px;
  max-width: 90vw;
  background: var(--color-background);
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  padding: 40px;
  display: flex;
  flex-direction: column;
  gap: 32px;
  border: 1px solid var(--color-border);
  animation: scale-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-header {
  text-align: center;
}

.title {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 8px;
}

.subtitle {
  font-size: 15px;
  color: var(--color-text-secondary);
}

.mode-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.mode-card {
  position: relative;
  background: var(--color-background-secondary);
  border: 2px solid transparent;
  border-radius: 16px;
  padding: 32px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.mode-card:hover {
  transform: translateY(-4px);
  background: var(--color-background-tertiary);
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
}

.mode-card.active {
  border-color: var(--color-primary);
  background: rgba(137, 180, 250, 0.05);
}

.check-mark {
  position: absolute;
  top: 16px;
  right: 16px;
  color: var(--color-primary);
  opacity: 0;
  transform: scale(0.5);
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.mode-card.active .check-mark {
  opacity: 1;
  transform: scale(1);
}

.icon-wrapper {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  color: white;
}

.code-gradient {
  background: linear-gradient(135deg, #60A5FA, #3B82F6);
  box-shadow: 0 8px 16px rgba(59, 130, 246, 0.2);
}

.doc-gradient {
  background: linear-gradient(135deg, #34D399, #10B981);
  box-shadow: 0 8px 16px rgba(16, 185, 129, 0.2);
}

.mode-name {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 8px;
}

.mode-desc {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-bottom: 24px;
  line-height: 1.5;
  height: 40px; /* fixed height for alignment */
}

.features {
  list-style: none;
  padding: 0;
  margin: 0;
  text-align: left;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.features li {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: var(--color-text-secondary);
  padding: 6px 12px;
  background: var(--color-background);
  border-radius: 8px;
}

.feature-icon {
  color: var(--color-success);
}

.modal-footer {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 8px;
}

.btn-cancel {
  padding: 12px 32px;
  border-radius: 10px;
  border: 1px solid var(--color-border);
  background: var(--color-background);
  color: var(--color-text-primary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background: var(--color-background-secondary);
}

.btn-confirm {
  padding: 12px 32px;
  border-radius: 10px;
  border: none;
  background: var(--color-primary);
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(137, 180, 250, 0.3);
}

.btn-confirm:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(137, 180, 250, 0.4);
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scale-up {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
</style>
