/**
 * SnippetsHub - 专业代码片段管理工具
 * 
 * @file TimeInputDialog.vue - 时间输入对话框组件
 * @author Noah
 * @description 时间跟踪停止时的时间确认对话框
 * @created 2026-02-05
 * @version 1.0.0
 */

<template>
  <div class="time-dialog-overlay" @click="handleOverlayClick">
    <div class="time-dialog" @click.stop>
      <div class="dialog-header">
        <h3 class="dialog-title">确认工作时间</h3>
      </div>
      
      <div class="dialog-body">
        <div class="time-info">
          <div class="auto-time-section">
            <div class="time-label">自动追踪时间</div>
            <div class="time-value auto">{{ formatTime(autoTime) }}</div>
            <div class="time-description">系统自动记录的时间</div>
          </div>
          
          <div class="divider">或</div>
          
          <div class="manual-time-section">
            <div class="time-label">手动输入时间</div>
            <div class="time-input-group">
              <input
                ref="timeInput"
                v-model.number="manualTime"
                type="number"
                min="0"
                max="24"
                step="0.1"
                placeholder="0.0"
                class="time-input"
                @keydown.enter="handleConfirm"
              />
              <span class="time-unit">小时</span>
            </div>
            <div class="time-description">输入实际工作时间（可选）</div>
          </div>
        </div>
        
        <div class="time-examples">
          <div class="examples-title">常用时间</div>
          <div class="time-buttons">
            <button
              v-for="preset in timePresets"
              :key="preset.value"
              @click="manualTime = preset.value"
              class="preset-btn"
              :class="{ active: manualTime === preset.value }"
            >
              {{ preset.label }}
            </button>
          </div>
        </div>
      </div>
      
      <div class="dialog-footer">
        <button 
          @click="$emit('cancel')" 
          class="btn btn-secondary"
          :disabled="isLoading"
        >
          取消
        </button>
        <button 
          @click="handleUseAuto" 
          class="btn btn-primary"
          :disabled="isLoading"
        >
          使用自动时间
        </button>
        <button 
          @click="handleConfirm" 
          class="btn btn-success"
          :disabled="isLoading || (manualTime !== null && manualTime < 0)"
        >
          <span v-if="isLoading">保存中...</span>
          <span v-else>{{ manualTime !== null && manualTime !== '' ? '使用手动时间' : '不记录时间' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps({
  autoTime: {
    type: Number,
    default: 0
  },
  isLoading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['confirm', 'cancel'])

const timeInput = ref(null)
const manualTime = ref(null)

const timePresets = [
  { label: '15分钟', value: 0.25 },
  { label: '30分钟', value: 0.5 },
  { label: '1小时', value: 1 },
  { label: '2小时', value: 2 },
  { label: '4小时', value: 4 },
  { label: '8小时', value: 8 }
]

const formatTime = (hours) => {
  if (hours < 1) {
    const minutes = Math.round(hours * 60)
    return `${minutes} 分钟`
  } else {
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    return m > 0 ? `${h} 小时 ${m} 分钟` : `${h} 小时`
  }
}

const handleOverlayClick = () => {
  if (!props.isLoading) {
    emit('cancel')
  }
}

const handleUseAuto = () => {
  emit('confirm', props.autoTime)
}

const handleConfirm = () => {
  const time = manualTime.value !== null && manualTime.value !== '' ? manualTime.value : 0
  emit('confirm', Math.max(0, time)) // 确保不是负数
}

const handleKeydown = (event) => {
  if (event.key === 'Escape' && !props.isLoading) {
    emit('cancel')
  }
}

onMounted(async () => {
  document.addEventListener('keydown', handleKeydown)
  document.body.style.overflow = 'hidden'
  
  // 聚焦到输入框
  await nextTick()
  if (timeInput.value) {
    timeInput.value.focus()
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})
</script>

<style scoped>
.time-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.time-dialog {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  width: 500px;
  max-width: 90vw;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  animation: slideIn 0.2s ease-out;
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

.dialog-header {
  padding: 24px 24px 0 24px;
}

.dialog-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.dialog-body {
  padding: 24px;
}

.time-info {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 24px;
}

.auto-time-section,
.manual-time-section {
  padding: 20px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-background-secondary);
}

.time-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 8px;
}

.time-value {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 4px;
}

.time-value.auto {
  color: var(--color-primary);
}

.time-description {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.divider {
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 14px;
  position: relative;
}

.divider::before,
.divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 40%;
  height: 1px;
  background: var(--color-border);
}

.divider::before {
  left: 0;
}

.divider::after {
  right: 0;
}

.time-input-group {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.time-input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 18px;
  font-weight: 600;
  background: var(--color-background);
  color: var(--color-text-primary);
  outline: none;
  transition: border-color 0.2s;
}

.time-input:focus {
  border-color: var(--color-primary);
}

.time-unit {
  font-size: 14px;
  color: var(--color-text-secondary);
  font-weight: 500;
}

.time-examples {
  border-top: 1px solid var(--color-border);
  padding-top: 20px;
}

.examples-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 12px;
}

.time-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.preset-btn {
  padding: 8px 16px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-background);
  color: var(--color-text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.preset-btn:hover {
  background: var(--color-border);
  color: var(--color-text-primary);
}

.preset-btn.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 0 24px 24px 24px;
}

.btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--color-background-secondary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--color-border);
}

.btn-primary {
  background: var(--color-primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.btn-success {
  background: #10b981;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #059669;
}

@media (max-width: 480px) {
  .time-dialog {
    width: 320px;
    margin: 20px;
  }
  
  .time-info {
    gap: 16px;
  }
  
  .auto-time-section,
  .manual-time-section {
    padding: 16px;
  }
  
  .dialog-footer {
    flex-direction: column-reverse;
  }
  
  .btn {
    width: 100%;
    justify-content: center;
  }
  
  .time-buttons {
    justify-content: center;
  }
}
</style>