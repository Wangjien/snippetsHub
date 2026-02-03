<template>
  <div class="empty-state" :class="[variant, { 'compact': compact }]">
    <!-- 动画背景 -->
    <div class="empty-background">
      <div class="bg-circle circle-1"></div>
      <div class="bg-circle circle-2"></div>
      <div class="bg-circle circle-3"></div>
    </div>

    <!-- 图标 -->
    <div class="empty-icon" :class="iconClass">
      <component :is="icon" :size="compact ? 40 : 56" />
    </div>

    <!-- 标题 -->
    <h3 class="empty-title">{{ title }}</h3>

    <!-- 描述 -->
    <p class="empty-description">{{ description }}</p>

    <!-- 额外内容插槽 -->
    <slot name="extra"></slot>

    <!-- 操作按钮 -->
    <div class="empty-actions" v-if="$slots.default || primaryAction">
      <slot>
        <button 
          v-if="primaryAction" 
          class="primary-btn"
          @click="$emit('primary-action')"
        >
          <component v-if="primaryIcon" :is="primaryIcon" :size="18" />
          {{ primaryAction }}
        </button>
        <button 
          v-if="secondaryAction" 
          class="secondary-btn"
          @click="$emit('secondary-action')"
        >
          {{ secondaryAction }}
        </button>
      </slot>
    </div>

    <!-- 提示信息 -->
    <div class="empty-tips" v-if="tips && tips.length > 0">
      <p class="tips-title">💡 快捷提示</p>
      <ul class="tips-list">
        <li v-for="(tip, index) in tips" :key="index">{{ tip }}</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { Code2 } from 'lucide-vue-next'

const props = defineProps({
  icon: {
    type: Object,
    default: () => Code2
  },
  iconClass: {
    type: String,
    default: ''
  },
  title: {
    type: String,
    default: '暂无内容'
  },
  description: {
    type: String,
    default: '这里还没有任何内容'
  },
  primaryAction: {
    type: String,
    default: ''
  },
  primaryIcon: {
    type: Object,
    default: null
  },
  secondaryAction: {
    type: String,
    default: ''
  },
  tips: {
    type: Array,
    default: () => []
  },
  variant: {
    type: String,
    default: 'default', // default, search, error
    validator: (value) => ['default', 'search', 'error'].includes(value)
  },
  compact: {
    type: Boolean,
    default: false
  }
})

defineEmits(['primary-action', 'secondary-action'])
</script>

<style scoped>
.empty-state {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 40px;
  text-align: center;
  min-height: 400px;
  overflow: hidden;
}

.empty-state.compact {
  padding: 40px 24px;
  min-height: 280px;
}

/* 动画背景 */
.empty-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
}

.bg-circle {
  position: absolute;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(137, 180, 250, 0.1), rgba(116, 199, 236, 0.05));
  animation: float 6s ease-in-out infinite;
}

.circle-1 {
  width: 300px;
  height: 300px;
  top: -100px;
  right: -50px;
  animation-delay: 0s;
}

.circle-2 {
  width: 200px;
  height: 200px;
  bottom: -50px;
  left: -50px;
  animation-delay: 2s;
}

.circle-3 {
  width: 150px;
  height: 150px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation-delay: 4s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) scale(1);
    opacity: 0.5;
  }
  50% {
    transform: translateY(-20px) scale(1.05);
    opacity: 0.8;
  }
}

/* 图标 */
.empty-icon {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 120px;
  margin-bottom: 24px;
  background: linear-gradient(135deg, rgba(137, 180, 250, 0.15), rgba(116, 199, 236, 0.1));
  border-radius: 32px;
  color: var(--color-primary);
  animation: pulse 3s ease-in-out infinite;
}

.compact .empty-icon {
  width: 80px;
  height: 80px;
  border-radius: 20px;
  margin-bottom: 16px;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(137, 180, 250, 0.2);
  }
  50% {
    box-shadow: 0 0 0 20px rgba(137, 180, 250, 0);
  }
}

.empty-icon::before {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 36px;
  border: 2px dashed rgba(137, 180, 250, 0.3);
  animation: spin 20s linear infinite;
}

.compact .empty-icon::before {
  inset: -3px;
  border-radius: 24px;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 搜索变体 */
.empty-state.search .empty-icon {
  background: linear-gradient(135deg, rgba(250, 179, 135, 0.15), rgba(249, 226, 175, 0.1));
  color: var(--color-warning);
}

/* 错误变体 */
.empty-state.error .empty-icon {
  background: linear-gradient(135deg, rgba(243, 139, 168, 0.15), rgba(235, 160, 172, 0.1));
  color: var(--color-error);
}

/* 标题 */
.empty-title {
  position: relative;
  margin: 0 0 12px;
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.compact .empty-title {
  font-size: 18px;
  margin-bottom: 8px;
}

/* 描述 */
.empty-description {
  position: relative;
  margin: 0 0 28px;
  font-size: 14px;
  color: var(--color-text-secondary);
  max-width: 400px;
  line-height: 1.6;
}

.compact .empty-description {
  font-size: 13px;
  margin-bottom: 20px;
  max-width: 320px;
}

/* 操作按钮 */
.empty-actions {
  position: relative;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.primary-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 4px 16px rgba(137, 180, 250, 0.3);
}

.primary-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(137, 180, 250, 0.4);
}

.compact .primary-btn {
  padding: 10px 20px;
  font-size: 14px;
  border-radius: 10px;
}

.secondary-btn {
  padding: 14px 28px;
  background: var(--color-background-secondary);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}

.secondary-btn:hover {
  background: var(--color-background-tertiary);
  color: var(--color-text-primary);
  border-color: var(--color-primary);
}

.compact .secondary-btn {
  padding: 10px 20px;
  font-size: 14px;
  border-radius: 10px;
}

/* 提示信息 */
.empty-tips {
  position: relative;
  margin-top: 40px;
  padding: 20px 28px;
  background: var(--color-background-secondary);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  text-align: left;
  max-width: 400px;
}

.compact .empty-tips {
  margin-top: 24px;
  padding: 14px 20px;
  max-width: 320px;
}

.tips-title {
  margin: 0 0 12px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.compact .tips-title {
  font-size: 12px;
  margin-bottom: 8px;
}

.tips-list {
  margin: 0;
  padding: 0 0 0 20px;
  list-style-type: disc;
}

.tips-list li {
  font-size: 12px;
  color: var(--color-text-secondary);
  line-height: 1.8;
}

.compact .tips-list li {
  font-size: 11px;
  line-height: 1.6;
}
</style>