<script setup lang="ts">
import { ref } from 'vue'

// Round "+" above the tab bar; opens a small menu for work entry or vacation
const emit = defineEmits<{ entry: []; vacation: [] }>()
const isMenuOpen = ref(false)

function choose(choice: 'entry' | 'vacation') {
  isMenuOpen.value = false
  if (choice === 'entry') emit('entry')
  else emit('vacation')
}
</script>

<template>
  <div v-if="isMenuOpen" class="backdrop" @click="isMenuOpen = false" />

  <div class="add">
    <div v-if="isMenuOpen" class="menu">
      <button type="button" @click="choose('entry')">Work entry</button>
      <button type="button" @click="choose('vacation')">Vacation</button>
    </div>
    <button
      type="button"
      class="fab"
      :class="{ 'fab--open': isMenuOpen }"
      :aria-label="isMenuOpen ? 'Close menu' : 'Add'"
      :aria-expanded="isMenuOpen"
      @click="isMenuOpen = !isMenuOpen"
    >
      +
    </button>
  </div>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  z-index: 4;
}

.add {
  position: fixed;
  right: var(--space-4);
  bottom: calc(env(safe-area-inset-bottom) + 76px);
  z-index: 5;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-2);
}

.fab {
  width: 54px;
  height: 54px;
  font-size: 30px;
  line-height: 1;
  color: var(--accent-text);
  background: var(--accent);
  border: none;
  border-radius: 50%;
  box-shadow: 0 4px 14px rgb(0 0 0 / 0.18);
  transition: transform 0.15s;
}

.fab--open {
  transform: rotate(45deg);
}

.menu {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: 0 6px 20px rgb(0 0 0 / 0.12);
}

.menu button {
  padding: var(--space-3) var(--space-6);
  font: inherit;
  text-align: left;
  color: var(--text);
  background: none;
  border: none;
  border-bottom: 1px solid var(--border);
}

.menu button:last-child {
  border-bottom: none;
}
</style>
