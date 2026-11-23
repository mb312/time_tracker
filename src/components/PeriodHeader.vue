<script setup lang="ts">
// Title with ‹ › arrows, used by the day, week and month screens
defineProps<{ title: string; backLabel?: string }>()
const emit = defineEmits<{ previous: []; next: []; back: [] }>()
</script>

<template>
  <header class="period-header">
    <button type="button" class="arrow" aria-label="Previous" @click="emit('previous')">‹</button>
    <div class="title">
      <slot>
        <h1>{{ title }}</h1>
      </slot>
      <button v-if="backLabel" type="button" class="back" @click="emit('back')">
        {{ backLabel }}
      </button>
    </div>
    <button type="button" class="arrow" aria-label="Next" @click="emit('next')">›</button>
  </header>
</template>

<style scoped>
.period-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 52px;
}

.title {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.arrow {
  width: 44px;
  height: 44px;
  font-size: var(--text-xl);
  line-height: 1;
  color: var(--text-muted);
  background: none;
  border: none;
}

.back {
  padding: 2px 0 0;
  font: inherit;
  font-size: var(--text-xs);
  color: var(--accent);
  background: none;
  border: none;
}
</style>
