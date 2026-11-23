<script setup lang="ts">
import { computed } from 'vue'
import { addDays, formatLongDate, todayIso } from '@/lib/dates'

const props = defineProps<{ date: string }>()
const emit = defineEmits<{ change: [date: string] }>()

const isToday = computed(() => props.date === todayIso())

function onPick(event: Event) {
  const value = (event.target as HTMLInputElement).value
  if (value) emit('change', value)
}
</script>

<template>
  <header class="day-header">
    <button
      type="button"
      class="arrow"
      aria-label="Previous day"
      @click="emit('change', addDays(date, -1))"
    >
      ‹
    </button>

    <!-- Invisible date input on top of the title opens the iOS date picker -->
    <label class="title">
      <span>{{ formatLongDate(date) }}</span>
      <input type="date" :value="date" aria-label="Pick a date" @change="onPick" />
    </label>

    <button
      type="button"
      class="arrow"
      aria-label="Next day"
      @click="emit('change', addDays(date, 1))"
    >
      ›
    </button>
  </header>

  <button v-if="!isToday" type="button" class="today-link" @click="emit('change', todayIso())">
    Back to today
  </button>
</template>

<style scoped>
.day-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.arrow {
  width: 44px;
  height: 44px;
  font-size: 1.6rem;
  color: var(--text-muted);
  background: none;
  border: none;
}

.title {
  position: relative;
  font-size: 1.15rem;
  font-weight: 600;
}

.title input {
  position: absolute;
  inset: 0;
  opacity: 0;
  height: 100%;
  padding: 0;
}

.today-link {
  display: block;
  margin: 0 auto 8px;
  font: inherit;
  font-size: 0.85rem;
  color: var(--accent);
  background: none;
  border: none;
}
</style>
