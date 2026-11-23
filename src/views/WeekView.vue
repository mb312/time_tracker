<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PeriodHeader from '@/components/PeriodHeader.vue'
import { useEntries } from '@/composables/useEntries'
import { DEFAULT_PROFILE, useProfile } from '@/composables/useProfile'
import {
  addDays,
  formatDayLabel,
  formatShortRange,
  isoWeekNumber,
  startOfWeek,
  todayIso,
} from '@/lib/dates'
import { holidayName } from '@/lib/holidays'
import { targetHoursForDay } from '@/lib/targets'
import { formatHours, formatHoursMinutes, formatSignedHours } from '@/lib/time'
import type { TimeEntry } from '@/types/entry'

const route = useRoute()
const router = useRouter()
const { fetchEntries } = useEntries()
const { profile, loadProfile } = useProfile()

const today = todayIso()
const monday = computed(() => startOfWeek((route.params.date as string | undefined) || today))
const sunday = computed(() => addDays(monday.value, 6))
const isCurrentWeek = computed(() => monday.value === startOfWeek(today))
const title = computed(
  () => `Week ${isoWeekNumber(monday.value)} · ${formatShortRange(monday.value, sunday.value)}`,
)

const entries = ref<TimeEntry[]>([])
const loadError = ref('')

async function loadEntries() {
  loadError.value = ''
  try {
    entries.value = await fetchEntries(monday.value, sunday.value)
  } catch {
    loadError.value = 'Could not load entries.'
  }
}

watch(monday, loadEntries, { immediate: true })

onMounted(() => {
  if (!profile.value) loadProfile().catch(() => {})
})

const days = computed(() => {
  const settings = profile.value ?? DEFAULT_PROFILE
  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(monday.value, index)
    const dayEntries = entries.value.filter((entry) => entry.work_date === date)
    const minutes = dayEntries.reduce((sum, entry) => sum + (entry.duration_min ?? 0), 0)

    // Days before tracking started have no entries in the app, so they don't count
    const isTracked = date >= settings.tracking_start
    return {
      date,
      hours: minutes / 60,
      target: isTracked ? targetHoursForDay(date, settings) : 0,
      holiday: holidayName(date),
      isVacation: dayEntries.some((entry) => entry.kind === 'vacation'),
    }
  })
})

const totalHours = computed(() => days.value.reduce((sum, day) => sum + day.hours, 0))
const targetHours = computed(() => days.value.reduce((sum, day) => sum + day.target, 0))

// Balance up to today, so a running week isn't shown as behind for days still to come
const balanceToDate = computed(() =>
  days.value
    .filter((day) => day.date <= today)
    .reduce((sum, day) => sum + day.hours - day.target, 0),
)

function goToWeek(isoDate: string) {
  router.push({ name: 'week', params: { date: isoDate } })
}
</script>

<template>
  <PeriodHeader
    :title="title"
    :back-label="isCurrentWeek ? undefined : 'Back to this week'"
    @previous="goToWeek(addDays(monday, -7))"
    @next="goToWeek(addDays(monday, 7))"
    @back="goToWeek(today)"
  />

  <section class="card total">
    <span class="muted">Week total</span>
    <div class="total-row">
      <strong class="total-hours">{{ formatHours(totalHours) }}</strong>
      <span class="muted">{{ formatHoursMinutes(totalHours) }}</span>
    </div>
    <div class="figures">
      <span class="muted">Target {{ formatHours(targetHours) }}</span>
      <span class="muted">Balance to date {{ formatSignedHours(balanceToDate) }}</span>
    </div>
  </section>

  <p v-if="loadError" class="error">{{ loadError }}</p>

  <ul class="days">
    <li v-for="day in days" :key="day.date">
      <button
        type="button"
        class="day"
        :class="{ 'day--today': day.date === today, 'day--off': day.target === 0 }"
        @click="router.push({ name: 'day', params: { date: day.date } })"
      >
        <span class="day-label">
          {{ formatDayLabel(day.date) }}
          <small v-if="day.holiday" class="muted">{{ day.holiday }}</small>
          <small v-else-if="day.isVacation" class="muted">Vacation</small>
        </span>
        <span class="day-hours">{{ day.hours > 0 ? formatHours(day.hours) : '–' }}</span>
      </button>
    </li>
  </ul>
</template>

<style scoped>
.total {
  gap: 4px;
  margin: 4px 0 12px;
}

.total-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.total-hours {
  font-size: 1.8rem;
}

.figures {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 0.9rem;
}

.days {
  margin: 0;
  padding: 0;
  list-style: none;
  background: var(--surface);
  border-radius: var(--radius);
}

.day {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 14px 16px;
  font: inherit;
  text-align: left;
  color: var(--text);
  background: none;
  border: none;
  border-bottom: 1px solid var(--border);
}

li:last-child .day {
  border-bottom: none;
}

.day-label small {
  display: block;
  font-size: 0.75rem;
}

.day--off {
  color: var(--text-muted);
}

.day--today .day-label {
  font-weight: 600;
}

.day-hours {
  font-variant-numeric: tabular-nums;
}

.error {
  color: var(--danger);
}
</style>
