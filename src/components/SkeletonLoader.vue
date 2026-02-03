<template>
  <div class="skeleton-container" :class="[variant]">
    <!-- 卡片骨架 -->
    <template v-if="variant === 'cards'">
      <div 
        v-for="i in count" 
        :key="i" 
        class="skeleton-card"
        :style="{ animationDelay: `${i * 0.1}s` }"
      >
        <div class="skeleton-header">
          <div class="skeleton-icon shimmer"></div>
          <div class="skeleton-title-group">
            <div class="skeleton-title shimmer"></div>
            <div class="skeleton-subtitle shimmer"></div>
          </div>
        </div>
        <div class="skeleton-code">
          <div class="skeleton-line shimmer" style="width: 90%"></div>
          <div class="skeleton-line shimmer" style="width: 75%"></div>
          <div class="skeleton-line shimmer" style="width: 85%"></div>
          <div class="skeleton-line shimmer" style="width: 60%"></div>
        </div>
        <div class="skeleton-footer">
          <div class="skeleton-tags">
            <div class="skeleton-tag shimmer"></div>
            <div class="skeleton-tag shimmer"></div>
          </div>
          <div class="skeleton-actions">
            <div class="skeleton-action shimmer"></div>
            <div class="skeleton-action shimmer"></div>
          </div>
        </div>
      </div>
    </template>

    <!-- 列表骨架 -->
    <template v-else-if="variant === 'list'">
      <div 
        v-for="i in count" 
        :key="i" 
        class="skeleton-row"
        :style="{ animationDelay: `${i * 0.08}s` }"
      >
        <div class="skeleton-row-icon shimmer"></div>
        <div class="skeleton-row-content">
          <div class="skeleton-row-title shimmer"></div>
          <div class="skeleton-row-desc shimmer"></div>
        </div>
        <div class="skeleton-row-meta shimmer"></div>
      </div>
    </template>

    <!-- 紧凑骨架 -->
    <template v-else-if="variant === 'compact'">
      <div 
        v-for="i in count" 
        :key="i" 
        class="skeleton-compact"
        :style="{ animationDelay: `${i * 0.05}s` }"
      >
        <div class="skeleton-compact-icon shimmer"></div>
        <div class="skeleton-compact-title shimmer"></div>
        <div class="skeleton-compact-meta shimmer"></div>
      </div>
    </template>

    <!-- 通用骨架 -->
    <template v-else>
      <div 
        v-for="i in count" 
        :key="i" 
        class="skeleton-item"
        :style="{ animationDelay: `${i * 0.1}s` }"
      >
        <div class="skeleton-avatar shimmer"></div>
        <div class="skeleton-content">
          <div class="skeleton-text shimmer" style="width: 80%"></div>
          <div class="skeleton-text shimmer" style="width: 60%"></div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
defineProps({
  variant: {
    type: String,
    default: 'cards', // cards, list, compact, default
  },
  count: {
    type: Number,
    default: 6
  }
})
</script>

<style scoped>
.skeleton-container {
  padding: 20px;
}

/* Shimmer 动画 */
.shimmer {
  background: linear-gradient(
    90deg,
    var(--color-background-secondary) 0%,
    var(--color-background-tertiary) 50%,
    var(--color-background-secondary) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* 卡片骨架 */
.skeleton-container.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.skeleton-card {
  padding: 20px;
  background: var(--color-background-secondary);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  animation: fadeIn 0.4s ease-out both;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.skeleton-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.skeleton-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
}

.skeleton-title-group {
  flex: 1;
}

.skeleton-title {
  height: 18px;
  width: 70%;
  border-radius: 6px;
  margin-bottom: 8px;
}

.skeleton-subtitle {
  height: 12px;
  width: 50%;
  border-radius: 4px;
}

.skeleton-code {
  padding: 16px;
  background: var(--color-background);
  border-radius: 10px;
  margin-bottom: 16px;
}

.skeleton-line {
  height: 10px;
  border-radius: 4px;
  margin-bottom: 10px;
}

.skeleton-line:last-child {
  margin-bottom: 0;
}

.skeleton-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.skeleton-tags {
  display: flex;
  gap: 8px;
}

.skeleton-tag {
  width: 60px;
  height: 24px;
  border-radius: 6px;
}

.skeleton-actions {
  display: flex;
  gap: 8px;
}

.skeleton-action {
  width: 32px;
  height: 32px;
  border-radius: 8px;
}

/* 列表骨架 */
.skeleton-container.list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: var(--color-background-secondary);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  animation: fadeIn 0.4s ease-out both;
}

.skeleton-row-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  flex-shrink: 0;
}

.skeleton-row-content {
  flex: 1;
}

.skeleton-row-title {
  height: 16px;
  width: 40%;
  border-radius: 4px;
  margin-bottom: 8px;
}

.skeleton-row-desc {
  height: 12px;
  width: 70%;
  border-radius: 4px;
}

.skeleton-row-meta {
  width: 80px;
  height: 14px;
  border-radius: 4px;
}

/* 紧凑骨架 */
.skeleton-container.compact {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.skeleton-compact {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--color-background-secondary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  animation: fadeIn 0.3s ease-out both;
}

.skeleton-compact-icon {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  flex-shrink: 0;
}

.skeleton-compact-title {
  flex: 1;
  height: 14px;
  border-radius: 4px;
}

.skeleton-compact-meta {
  width: 100px;
  height: 12px;
  border-radius: 4px;
}

/* 通用骨架 */
.skeleton-container.default {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.skeleton-item {
  display: flex;
  gap: 12px;
  animation: fadeIn 0.4s ease-out both;
}

.skeleton-avatar {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  flex-shrink: 0;
}

.skeleton-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
}

.skeleton-text {
  height: 14px;
  border-radius: 4px;
}
</style>
