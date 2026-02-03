<template>
  <Teleport to="body">
    <div class="notification-container">
      <TransitionGroup name="notification" tag="div">
        <div
          v-for="notification in notifications"
          :key="notification.id"
          class="notification"
          :class="[`notification--${notification.type}`]"
        >
          <div class="notification-icon">
            <CheckCircle v-if="notification.type === 'success'" :size="20" />
            <AlertCircle v-else-if="notification.type === 'error'" :size="20" />
            <Info v-else-if="notification.type === 'info'" :size="20" />
            <AlertTriangle v-else-if="notification.type === 'warning'" :size="20" />
          </div>
          
          <div class="notification-content">
            <div class="notification-title">{{ notification.title }}</div>
            <div v-if="notification.message" class="notification-message">
              {{ notification.message }}
            </div>
          </div>
          
          <button
            @click="removeNotification(notification.id)"
            class="notification-close"
          >
            <X :size="16" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue'
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-vue-next'

const notifications = ref([])

const addNotification = (notification) => {
  const id = Date.now() + Math.random()
  const newNotification = {
    id,
    type: 'info',
    title: '',
    message: '',
    duration: 4000,
    ...notification
  }
  
  notifications.value.push(newNotification)
  
  if (newNotification.duration > 0) {
    setTimeout(() => {
      removeNotification(id)
    }, newNotification.duration)
  }
  
  return id
}

const removeNotification = (id) => {
  const index = notifications.value.findIndex(n => n.id === id)
  if (index > -1) {
    notifications.value.splice(index, 1)
  }
}

const clearAll = () => {
  notifications.value = []
}

// 便捷方法
const success = (title, message = '', duration = 4000) => {
  return addNotification({ type: 'success', title, message, duration })
}

const error = (title, message = '', duration = 6000) => {
  return addNotification({ type: 'error', title, message, duration })
}

const info = (title, message = '', duration = 4000) => {
  return addNotification({ type: 'info', title, message, duration })
}

const warning = (title, message = '', duration = 5000) => {
  return addNotification({ type: 'warning', title, message, duration })
}

// 暴露方法给父组件
defineExpose({
  addNotification,
  removeNotification,
  clearAll,
  success,
  error,
  info,
  warning
})
</script>

<style scoped>
.notification-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  pointer-events: none;
}

.notification {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: #1e1e2e;
  border: 1px solid #313244;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  min-width: 320px;
  max-width: 400px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  pointer-events: auto;
}

.notification--success {
  border-left: 4px solid #a6e3a1;
}

.notification--error {
  border-left: 4px solid #f38ba8;
}

.notification--warning {
  border-left: 4px solid #f9e2af;
}

.notification--info {
  border-left: 4px solid #89b4fa;
}

.notification-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.notification--success .notification-icon {
  color: #a6e3a1;
}

.notification--error .notification-icon {
  color: #f38ba8;
}

.notification--warning .notification-icon {
  color: #f9e2af;
}

.notification--info .notification-icon {
  color: #89b4fa;
}

.notification-content {
  flex: 1;
}

.notification-title {
  font-weight: 600;
  color: #cdd6f4;
  font-size: 14px;
  margin-bottom: 4px;
}

.notification-message {
  color: #a6adc8;
  font-size: 13px;
  line-height: 1.4;
}

.notification-close {
  background: none;
  border: none;
  color: #7f849c;
  cursor: pointer;
  padding: 0;
  margin-top: 2px;
  transition: color 0.2s;
}

.notification-close:hover {
  color: #cdd6f4;
}

/* 动画 */
.notification-enter-active,
.notification-leave-active {
  transition: background-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.notification-move {
  transition: transform 0.3s ease;
}
</style>