<script setup lang="ts">
import { ref } from 'vue'

// Panel sliding up from the bottom with Cancel / title / Save (or just Close).
// Dragging the top area down closes it.
withDefaults(defineProps<{ title: string; isSaving?: boolean; showSave?: boolean }>(), {
  showSave: true,
})
const emit = defineEmits<{ close: []; save: [] }>()

const CLOSE_DISTANCE = 90 // px
const dragOffset = ref(0)
let dragStartY: number | null = null

function onDragStart(event: TouchEvent) {
  dragStartY = event.touches[0]?.clientY ?? null
}

function onDragMove(event: TouchEvent) {
  if (dragStartY === null) return
  const currentY = event.touches[0]?.clientY ?? dragStartY
  dragOffset.value = Math.max(0, currentY - dragStartY)
}

function onDragEnd() {
  if (dragOffset.value > CLOSE_DISTANCE) emit('close')
  dragOffset.value = 0
  dragStartY = null
}
</script>

<template>
  <Teleport to="body">
    <div class="overlay" @click.self="emit('close')">
      <form
        class="sheet"
        :class="{ 'sheet--dragging': dragOffset > 0 }"
        :style="{ transform: `translateY(${dragOffset}px)` }"
        @submit.prevent="emit('save')"
      >
        <div
          class="drag-area"
          @touchstart.passive="onDragStart"
          @touchmove.passive="onDragMove"
          @touchend="onDragEnd"
        >
          <span class="handle" />
          <header class="sheet-header">
            <button type="button" class="header-button" @click="emit('close')">
              {{ showSave ? 'Cancel' : 'Close' }}
            </button>
            <h2>{{ title }}</h2>
            <button
              v-if="showSave"
              type="submit"
              class="header-button header-button--strong"
              :disabled="isSaving"
            >
              Save
            </button>
            <span v-else />
          </header>
        </div>
        <slot />
      </form>
    </div>
  </Teleport>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 10;
  display: flex;
  align-items: flex-end;
  background: rgb(0 0 0 / 0.35);
}

.sheet {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  padding: 0 var(--space-4) calc(env(safe-area-inset-bottom) + var(--space-6));
  background: var(--bg);
  border-radius: 16px 16px 0 0;
  transition: transform 0.2s;
}

.sheet--dragging {
  transition: none;
}

.drag-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: var(--space-2);
}

.handle {
  width: 36px;
  height: 5px;
  background: var(--track);
  border-radius: 3px;
}

.sheet-header {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  width: 100%;
}

.sheet-header > :last-child {
  justify-self: end;
}

.header-button {
  justify-self: start;
  padding: var(--space-3) 0;
  font: inherit;
  color: var(--accent);
  background: none;
  border: none;
}

.header-button--strong {
  font-weight: 600;
}
</style>
