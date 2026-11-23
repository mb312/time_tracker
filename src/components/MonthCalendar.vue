<script setup lang="ts">
import { computed } from 'vue'
import { useToday } from '@/composables/useToday'
import { addDays, firstOfMonth, isoWeekday, lastOfMonth } from '@/lib/dates'
import { holidayName } from '@/lib/holidays'
import type { DailyTotal } from '@/types/entry'
import type { WorkProfile } from '@/types/profile'

// Calendar with one column per workday (Mon–Fri by default); weekend hours still count in totals
const props = defineProps<{ month: string; totals: DailyTotal[]; profile: WorkProfile }>()
const emit = defineEmits<{ select: [date: string] }>()

const WEEKDAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const { today } = useToday()

const columns = computed(() => [...props.profile.work_days].sort((a, b) => a - b))

const days = computed(() => {
  const totalsByDate = new Map(props.totals.map((total) => [total.work_date, total]))
  const firstDay = firstOfMonth(props.month)
  const offset = isoWeekday(firstDay) - 1
  const result = []

  for (let date = firstDay; date <= lastOfMonth(props.month); date = addDays(date, 1)) {
    const column = columns.value.indexOf(isoWeekday(date))
    if (column === -1) continue
    const total = totalsByDate.get(date)
    const minutes = (total?.work_min ?? 0) + (total?.vacation_min ?? 0)
    result.push({
      date,
      dayNumber: Number(date.slice(8)),
      week: Math.floor((Number(date.slice(8)) - 1 + offset) / 7),
      column,
      hours: minutes / 60,
      isVacation: (total?.vacation_min ?? 0) > 0,
      isHoliday: holidayName(date) !== null,
    })
  }

  // Start at the first week that has a workday in this month
  const firstWeek = Math.min(...result.map((day) => day.week))
  return result.map((day) => ({ ...day, week: day.week - firstWeek }))
})
</script>

<template>
  <div class="calendar" :style="{ gridTemplateColumns: `repeat(${columns.length}, 1fr)` }">
    <span v-for="weekday in columns" :key="weekday" class="weekday">
      {{ WEEKDAY_LETTERS[weekday - 1] }}
    </span>

    <button
      v-for="day in days"
      :key="day.date"
      type="button"
      class="day"
      :class="{
        'day--today': day.date === today,
        'day--vacation': day.isVacation,
        'day--holiday': day.isHoliday,
      }"
      :style="{ gridRow: day.week + 2, gridColumn: day.column + 1 }"
      @click="emit('select', day.date)"
    >
      <span class="day-number">{{ day.dayNumber }}</span>
      <span class="day-hours">{{ day.hours > 0 ? day.hours.toFixed(2) : '' }}</span>
    </button>
  </div>
</template>

<style scoped>
.calendar {
  display: grid;
  gap: var(--space-1);
  padding: var(--space-3) var(--space-2);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.weekday {
  padding-bottom: var(--space-1);
  font-size: var(--text-xs);
  text-align: center;
  color: var(--text-muted);
}

.day {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-height: 50px;
  padding: 6px 0;
  font: inherit;
  color: var(--text);
  background: none;
  border: 1.5px solid transparent;
  border-radius: 8px;
}

.day-number {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.day-hours {
  font-size: var(--text-sm);
  font-variant-numeric: tabular-nums;
}

.day--vacation {
  background: var(--vacation-soft);
}

.day--vacation .day-hours {
  color: var(--vacation);
}

.day--holiday {
  background: var(--holiday-soft);
}

.day--today {
  border-color: var(--accent);
}
</style>
