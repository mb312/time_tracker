<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PeriodHeader from '@/components/PeriodHeader.vue'
import SummaryCard from '@/components/SummaryCard.vue'
import { useEntries } from '@/composables/useEntries'
import { DEFAULT_PROFILE, useProfile } from '@/composables/useProfile'
import { useSwipe } from '@/composables/useSwipe'
import { useToday } from '@/composables/useToday'
import {
  addDays,
  formatDayLabel,
  formatShortRange,
  isoWeekNumber,
  isoWeekday,
  startOfWeek,
} from '@/lib/dates'
import { holidayName } from '@/lib/holidays'
import { targetHoursForDay } from '@/lib/targets'
import type { TimeEntry } from '@/types/entry'

// Kept while the app is open, so the choice survives switching tabs
const showWeekend = ref(false)

const route = useRoute()
const router = useRouter()
const { fetchEntries } = useEntries()
const { profile, loadProfile } = useProfile()
const { today } = useToday(() => loadEntries())

const page = ref<HTMLElement | null>(null)
const monday = computed(() => startOfWeek((route.params.date as string | undefined) || today.value))
const sunday = computed(() => addDays(monday.value, 6))
const isCurrentWeek = computed(() => monday.value === startOfWeek(today.value))

const entries = ref<TimeEntry[]>([])
const isLoading = ref(true)
const loadError = ref('')

async function loadEntries() {
  loadError.value = ''
  try {
    entries.value = await fetchEntries(monday.value, sunday.value)
  } catch {
    loadError.value = 'Could not load entries. Check your connection and try again.'
  } finally {
    isLoading.value = false
  }
}

watch(monday, loadEntries, { immediate: true })

onMounted(() => {
  if (!profile.value) loadProfile().catch(() => {})
})

const settings = computed(() => profile.value ?? DEFAULT_PROFILE)

const allDays = computed(() =>
  Array.from({ length: 7 }, (_, index) => {
    const date = addDays(monday.value, index)
    const dayEntries = entries.value.filter((entry) => entry.work_date === date)
    const hours = dayEntries.reduce((sum, entry) => sum + (entry.duration_min ?? 0), 0) / 60
    // Days before tracking started have no entries in the app, so they don't count
    const target =
      date >= settings.value.tracking_start ? targetHoursForDay(date, settings.value) : 0
    return {
      date,
      hours,
      target,
      progress: target > 0 ? Math.min(100, (hours / target) * 100) : 0,
      isWorkday: settings.value.work_days.includes(isoWeekday(date)),
      holiday: holidayName(date),
      isVacation: dayEntries.some((entry) => entry.kind === 'vacation'),
    }
  }),
)

// Weekend days only when switched on, or when something was worked on them
const visibleDays = computed(() =>
  allDays.value.filter((day) => showWeekend.value || day.isWorkday || day.hours > 0),
)
const hasHiddenDays = computed(() => visibleDays.value.length < 7)

const title = computed(() => {
  const lastShown = visibleDays.value.at(-1)?.date ?? sunday.value
  return `Week ${isoWeekNumber(monday.value)} · ${formatShortRange(monday.value, lastShown)}`
})

const totalHours = computed(() => allDays.value.reduce((sum, day) => sum + day.hours, 0))
const targetHours = computed(() => allDays.value.reduce((sum, day) => sum + day.target, 0))
// Balance up to today, so a running week isn't shown as behind for days still to come
const balanceToDate = computed(() =>
  allDays.value
    .filter((day) => day.date <= today.value)
    .reduce((sum, day) => sum + day.hours - day.target, 0),
)

function goToWeek(isoDate: string) {
  router.push({ name: 'week', params: { date: isoDate } })
}

useSwipe(page, {
  onLeft: () => goToWeek(addDays(monday.value, 7)),
  onRight: () => goToWeek(addDays(monday.value, -7)),
})
</script>

<template>
  <div ref="page" class="week">
    <PeriodHeader
      :title="title"
      :back-label="isCurrentWeek ? undefined : 'Back to this week'"
      @previous="goToWeek(addDays(monday, -7))"
      @next="goToWeek(addDays(monday, 7))"
      @back="goToWeek(today)"
    />

    <SummaryCard :hours="totalHours" :target="targetHours" :balance="balanceToDate" />

    <p v-if="loadError" class="error">{{ loadError }}</p>

    <template v-if="isLoading && entries.length === 0">
      <div class="skeleton" />
      <div class="skeleton" />
      <div class="skeleton" />
    </template>

    <ul v-else class="days">
      <li v-for="day in visibleDays" :key="day.date">
        <button
          type="button"
          class="day"
          :class="{ 'day--today': day.date === today }"
          @click="router.push({ name: 'day', params: { date: day.date } })"
        >
          <span class="day-label">
            {{ formatDayLabel(day.date) }}
            <span v-if="day.holiday" class="tag tag--holiday">{{ day.holiday }}</span>
            <span v-else-if="day.isVacation" class="tag tag--vacation">Vacation</span>
          </span>
          <span class="day-hours">{{ day.hours > 0 ? day.hours.toFixed(2) : '–' }}</span>
          <span v-if="day.target > 0" class="bar" :class="{ 'bar--vacation': day.isVacation }">
            <span :style="{ width: `${day.progress}%` }" />
          </span>
        </button>
      </li>
    </ul>

    <button
      v-if="hasHiddenDays || showWeekend"
      type="button"
      class="link-button"
      @click="showWeekend = !showWeekend"
    >
      {{ showWeekend ? 'Hide weekend' : 'Show weekend' }}
    </button>
  </div>
</template>

<style scoped>
/* Fills the screen so a swipe anywhere changes the week */
.week {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  min-height: 70vh;
}

.days {
  margin: 0;
  padding: 0;
  list-style: none;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}

.day {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: var(--space-2) var(--space-3);
  width: 100%;
  padding: var(--space-3) var(--space-4);
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

.day-label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.day--today .day-label {
  font-weight: 700;
}

.day-hours {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.day .bar {
  grid-column: 1 / -1;
}

.link-button {
  align-self: center;
}
</style>
