import { onMounted, onUnmounted, ref } from 'vue'
import { todayIso } from '@/lib/dates'

// Shared "today" that updates when the app comes back to the foreground (e.g. the next morning)
const today = ref(todayIso())

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') today.value = todayIso()
  })
}

// onResume: reload a screen's data when the app is opened again
export function useToday(onResume?: () => void) {
  if (onResume) {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') onResume()
    }
    onMounted(() => document.addEventListener('visibilitychange', handleVisibility))
    onUnmounted(() => document.removeEventListener('visibilitychange', handleVisibility))
  }
  return { today }
}
