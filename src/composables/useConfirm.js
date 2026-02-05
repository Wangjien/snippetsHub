/**
 * 确认对话框 Composable
 * 提供程序化的确认对话框功能
 */

import { ref, markRaw } from 'vue'

const confirmState = ref({
  isVisible: false,
  title: '',
  message: '',
  confirmText: '确认',
  isLoading: false,
  resolve: null,
  reject: null
})

export function useConfirm() {
  const showConfirm = (message, options = {}) => {
    return new Promise((resolve, reject) => {
      confirmState.value = {
        isVisible: true,
        title: options.title || '确认操作',
        message,
        confirmText: options.confirmText || '确认',
        isLoading: false,
        resolve: markRaw(resolve),
        reject: markRaw(reject)
      }
    })
  }

  const handleConfirm = () => {
    if (confirmState.value.resolve) {
      confirmState.value.resolve(true)
    }
    closeConfirm()
  }

  const handleCancel = () => {
    if (confirmState.value.resolve) {
      confirmState.value.resolve(false)
    }
    closeConfirm()
  }

  const closeConfirm = () => {
    confirmState.value = {
      isVisible: false,
      title: '',
      message: '',
      confirmText: '确认',
      isLoading: false,
      resolve: null,
      reject: null
    }
  }

  return {
    confirmState,
    showConfirm,
    handleConfirm,
    handleCancel
  }
}
