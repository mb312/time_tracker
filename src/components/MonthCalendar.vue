<script setup lang="ts">
import { computed } from 'vue'
import { addDays, firstOfMonth, isoWeekday, lastOfMonth, todayIso } from '@/lib/dates'
import { holidayName } from '@/lib/holidays'
import { targetHoursForDay } from '@/lib/targets'
import type { DailyTotal } from '@/types/entry'
import type { WorkProfile } from '@/types/profile'

const props = defineProps<{ month: string; totals: DailyTotal[]; profile: WorkProfile }>()
const emit = defineEmits<{ select: [date: string] }>()

const WEEKDAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const today = todayIso()

// Empty cells before the 1st, so the month starts under the right weekday
const leadingBlanks = computed(() => isoWeekday(firstOfMonth(props.month)) - 1)

const days = computed(() => {
  const totalsByDate = new Map(props.totals.map((total) => [total.work_date, total]))
  const result = []

  for (
    let date = firstOfMonth(props.month);
    date <= lastOfMonth(props.month);
    date = addDays(date, 1)
  ) {
    const total = totalsByDate.get(date)
    const minutes = (total?.work_min ?? 0) + (total?.vacation_min ?? 0)
    result.push({
      date,
      dayNumber: Number(date.slice(8)),
      hours: minutes / 60,
      isVacation: (total?.vacation_min ?? 0) > 0,
      isHoliday: holidayName(date) !== null,
      isOff: targetHoursForDay(date, props.profile) === 0,
    })
  }
  return result
})
</script>

<template>
  <div class="calendar">
    <span v-for="(letter, index) in WEEKDAY_LETTERS" :key="index" class="weekday">
      {{ letter }}
    </span>
    <span v-for="blank in leadingBlanks" :key="`blank-${blank}`" />

    <button
      v-for="day in days"
      :key="day.date"
      type="button"
      class="day"
      :class="{
        'day--today': day.date === today,
        'day--vacation': day.isVacation,
        'day--holiday': day.isHoliday,
        'day--off': day.isOff,
      }"
      @click="emit('select', day.date)"
    >
      <span class="day-number">{{ day.dayNumber }}</span>
      <span class="day-hours">{{ day.hours > 0 ? day.hours.toFixed(2) : '' }}</span>
    </button>
  </div>

  <p class="legend muted">
    <span class="legend-item"><span class="swatch swatch--vacation" />Vacation</span>
    <span class="legend-item"><span class="swatch swatch--holiday" />Public holiday</span>
  </p>
</template>

<style scoped>
.calendar {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  padding: 12px 8px;
  background: var(--surface);
  border-radius: var(--radius);
}

.weekday {
  padding-bottom: 4px;
  font-size: 0.75rem;
  text-align: center;
  color: var(--text-muted);
}

.day {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-height: 48px;
  padding: 6px 0;
  font: inherit;
  color: var(--text);
  background: none;
  border: 1.5px solid transparent;
  border-radius: 8px;
}

.day-number {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.day-hours {
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
}

.day--off .day-number {
  opacity: 0.6;
}

.day--vacation {
  background: var(--vacation-tint);
}

.day--holiday {
  background: var(--holiday-tint);
}

.day--today {
  border-color: var(--accent);
}

.legend {
  display: flex;
  gap: 16px;
  margin: 8px 0 0;
  font-size: 0.75rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.swatch {
  width: 12px;
  height: 12px;
  border-radius: 3px;
}

.swatch--vacation {
  background: var(--vacation-tint);
}

.swatch--holiday {
  background: var(--holiday-tint);
}
</style>
