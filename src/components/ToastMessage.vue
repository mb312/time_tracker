<script setup lang="ts">
import { useToast } from '@/composables/useToast'

const { toast, hideToast } = useToast()

function runAction() {
  toast.value?.action?.()
  hideToast()
}
</script>

<template>
  <Transition name="toast">
    <div v-if="toast" class="toast" role="status">
      <span>{{ toast.message }}</span>
      <button v-if="toast.actionLabel" type="button" class="toast-action" @click="runAction">
        {{ toast.actionLabel }}
      </button>
    </div>
  </Transition>
</template>

<style scoped>
.toast {
  position: fixed;
  left: var(--space-4);
  right: var(--space-4);
  bottom: calc(env(safe-area-inset-bottom) + 144px); /* above the + button */
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  font-size: var(--text-sm);
  color: var(--surface);
  background: var(--text);
  border-radius: var(--radius);
}

.toast-action {
  font: inherit;
  font-weight: 700;
  color: var(--surface);
  background: none;
  border: none;
}

.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 0.2s,
    transform 0.2s;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
