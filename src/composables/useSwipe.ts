import { onMounted, onUnmounted, type Ref } from 'vue'

const MIN_DISTANCE = 60 // px

// Horizontal swipe on an element: left = next, right = previous
export function useSwipe(
  element: Ref<HTMLElement | null>,
  handlers: { onLeft: () => void; onRight: () => void },
) {
  let startX = 0
  let startY = 0

  function onTouchStart(event: TouchEvent) {
    const touch = event.touches[0]
    if (!touch) return
    startX = touch.clientX
    startY = touch.clientY
  }

  function onTouchEnd(event: TouchEvent) {
    const touch = event.changedTouches[0]
    if (!touch) return
    const deltaX = touch.clientX - startX
    const deltaY = touch.clientY - startY

    // Ignore short or mostly vertical movements (scrolling)
    if (Math.abs(deltaX) < MIN_DISTANCE || Math.abs(deltaX) < Math.abs(deltaY) * 1.5) return
    if (deltaX < 0) handlers.onLeft()
    else handlers.onRight()
  }

  onMounted(() => {
    element.value?.addEventListener('touchstart', onTouchStart, { passive: true })
    element.value?.addEventListener('touchend', onTouchEnd, { passive: true })
  })

  onUnmounted(() => {
    element.value?.removeEventListener('touchstart', onTouchStart)
    element.value?.removeEventListener('touchend', onTouchEnd)
  })
}
