import { ref } from 'vue'

export interface Toast {
  message: string
  actionLabel?: string
  action?: () => void
}

const toast = ref<Toast | null>(null)
let hideTimer: ReturnType<typeof setTimeout> | undefined

// Short message at the bottom; with an action (e.g. Undo) it stays a little longer
function showToast(message: string, actionLabel?: string, action?: () => void) {
  clearTimeout(hideTimer)
  toast.value = { message, actionLabel, action }
  hideTimer = setTimeout(hideToast, action ? 5000 : 2500)
}

function hideToast() {
  clearTimeout(hideTimer)
  toast.value = null
}

export function useToast() {
  return { toast, showToast, hideToast }
}
