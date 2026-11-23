<script setup lang="ts">
import { computed } from 'vue'
import PeriodHeader from '@/components/PeriodHeader.vue'
import { useToday } from '@/composables/useToday'
import { addDays, formatLongDate } from '@/lib/dates'

const props = defineProps<{ date: string }>()
const emit = defineEmits<{ change: [date: string] }>()

const { today } = useToday()
const isToday = computed(() => props.date === today.value)

function onPick(event: Event) {
  const value = (event.target as HTMLInputElement).value
  if (value) emit('change', value)
}
</script>

<template>
  <PeriodHeader
    :title="formatLongDate(date)"
    :back-label="isToday ? undefined : 'Back to today'"
    @previous="emit('change', addDays(date, -1))"
    @next="emit('change', addDays(date, 1))"
    @back="emit('change', today)"
  >
    <!-- Invisible date input on top of the title opens the iOS date picker -->
    <label class="title">
      <h1>{{ formatLongDate(date) }}</h1>
      <input type="date" :value="date" aria-label="Pick a date" @change="onPick" />
    </label>
  </PeriodHeader>
</template>

<style scoped>
.title {
  position: relative;
}

.title input {
  position: absolute;
  inset: 0;
  height: 100%;
  padding: 0;
  opacity: 0;
}
</style>
