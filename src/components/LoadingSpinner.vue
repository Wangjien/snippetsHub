<template>
  <div class="loading-container" :class="{ 'loading-overlay': overlay }">
    <div class="loading-spinner" :class="sizeClass">
      <div class="spinner"></div>
      <div v-if="text" class="loading-text">{{ text }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large'].includes(value)
  },
  text: {
    type: String,
    default: ''
  },
  overlay: {
    type: Boolean,
    default: false
  }
})

const sizeClass = computed(() => `loading-spinner--${props.size}`)
</script>

<style scoped>
.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(30, 30, 46, 0.8);
  backdrop-filter: blur(2px);
  z-index: 100;
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.spinner {
  border: 2px solid #313244;
  border-top: 2px solid #89b4fa;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-spinner--small .spinner {
  width: 20px;
  height: 20px;
}

.loading-spinner--medium .spinner {
  width: 32px;
  height: 32px;
}

.loading-spinner--large .spinner {
  width: 48px;
  height: 48px;
}

.loading-text {
  color: #a6adc8;
  font-size: 14px;
  text-align: center;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>