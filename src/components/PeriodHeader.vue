<script setup lang="ts">
// Title with ‹ › arrows, used by the week and month screens
defineProps<{ title: string; backLabel?: string }>()
const emit = defineEmits<{ previous: []; next: []; back: [] }>()
</script>

<template>
  <header class="period-header">
    <button type="button" class="arrow" aria-label="Previous" @click="emit('previous')">‹</button>
    <h1 class="title">{{ title }}</h1>
    <button type="button" class="arrow" aria-label="Next" @click="emit('next')">›</button>
  </header>

  <button v-if="backLabel" type="button" class="back-link" @click="emit('back')">
    {{ backLabel }}
  </button>
</template>

<style scoped>
.period-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title {
  margin: 0;
  font-size: 1.15rem;
}

.arrow {
  width: 44px;
  height: 44px;
  font-size: 1.6rem;
  color: var(--text-muted);
  background: none;
  border: none;
}

.back-link {
  display: block;
  margin: 0 auto 8px;
  font: inherit;
  font-size: 0.85rem;
  color: var(--accent);
  background: none;
  border: none;
}
</style>
