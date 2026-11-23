<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MonthCalendar from '@/components/MonthCalendar.vue'
import PeriodHeader from '@/components/PeriodHeader.vue'
import PeriodSheet, { type PeriodPreset } from '@/components/PeriodSheet.vue'
import VacationCard from '@/components/VacationCard.vue'
import VacationSheet from '@/components/VacationSheet.vue'
import { DEFAULT_PROFILE, useProfile } from '@/composables/useProfile'
import { useStats } from '@/composables/useStats'
import { useVacation } from '@/composables/useVacation'
import {
  addMonths,
  firstOfMonth,
  formatLongDate,
  formatMonthTitle,
  lastOfMonth,
  todayIso,
} from '@/lib/dates'
import { formatTimeEmployed, summarizePeriod } from '@/lib/stats'
import { formatHours, formatSignedHours } from '@/lib/time'
import { calculateVacationBalance } from '@/lib/vacation'
import type { DailyTotal, TimeEntry } from '@/types/entry'

const route = useRoute()
const router = useRouter()
const { profile, loadProfile } = useProfile()
const { fetchDailyTotals } = useStats()
const { fetchVacationEntries, toVacationUsages } = useVacation()

const today = todayIso()
const currentMonth = today.slice(0, 7)
const month = computed(() => (route.params.month as string | undefined) || currentMonth)

const totals = ref<DailyTotal[]>([])
const vacationEntries = ref<TimeEntry[]>([])
const isLoaded = ref(false)
const loadError = ref('')
const periodSheetPreset = ref<PeriodPreset | null>(null)
const isVacationSheetOpen = ref(false)

const settings = computed(() => profile.value ?? DEFAULT_PROFILE)

// Everything from the employment start up to the end of this year (or the shown month)
const loadedUntil = computed(() => {
  const endOfYear = `${today.slice(0, 4)}-12-31`
  const endOfMonth = lastOfMonth(month.value)
  return endOfMonth > endOfYear ? endOfMonth : endOfYear
})

async function loadData() {
  loadError.value = ''
  try {
    if (!profile.value) await loadProfile()
    const [dailyTotals, vacation] = await Promise.all([
      fetchDailyTotals(settings.value.employment_start, loadedUntil.value),
      fetchVacationEntries(),
    ])
    totals.value = dailyTotals
    vacationEntries.value = vacation
    isLoaded.value = true
  } catch {
    loadError.value = 'Could not load your data.'
  }
}

watch(loadedUntil, loadData, { immediate: true })

const monthSummary = computed(() =>
  summarizePeriod(
    firstOfMonth(month.value),
    lastOfMonth(month.value),
    totals.value,
    settings.value,
    today,
  ),
)
const monthTotal = computed(() => monthSummary.value.workedHours + monthSummary.value.vacationHours)
const sinceStart = computed(() =>
  summarizePeriod(settings.value.employment_start, today, totals.value, settings.value, today),
)

const vacationBalance = computed(() =>
  isLoaded.value
    ? calculateVacationBalance(
        settings.value,
        toVacationUsages(vacationEntries.value, settings.value),
        today,
      )
    : null,
)

function goToMonth(value: string) {
  router.push({ name: 'month', params: { month: value } })
}

async function onVacationSaved() {
  isVacationSheetOpen.value = false
  await loadData()
}
</script>

<template>
  <PeriodHeader
    :title="formatMonthTitle(month)"
    :back-label="month === currentMonth ? undefined : 'Back to this month'"
    @previous="goToMonth(addMonths(month, -1))"
    @next="goToMonth(addMonths(month, 1))"
    @back="goToMonth(currentMonth)"
  />

  <p v-if="loadError" class="error">{{ loadError }}</p>

  <div class="summary-cards">
    <section class="card">
      <span class="muted">Month</span>
      <strong class="value">{{ formatHours(monthTotal) }}</strong>
    </section>
    <button type="button" class="card balance" @click="periodSheetPreset = 'month'">
      <span class="muted">Balance to date</span>
      <strong class="value">{{ formatSignedHours(monthSummary.balanceToDate) }}</strong>
    </button>
  </div>

  <MonthCalendar
    :month="month"
    :totals="totals"
    :profile="settings"
    @select="(date) => router.push({ name: 'day', params: { date } })"
  />

  <p class="muted figures">
    Month target {{ formatHours(monthSummary.targetHours) }} · Balance since start
    {{ formatSignedHours(sinceStart.balanceToDate) }}
  </p>

  <button type="button" class="card since-start" @click="periodSheetPreset = 'start'">
    <span class="muted">Worked since {{ formatLongDate(settings.employment_start) }}</span>
    <strong class="value">{{ formatHours(sinceStart.workedHours) }}</strong>
    <span class="muted">{{ formatTimeEmployed(settings.employment_start, today) }} employed</span>
  </button>

  <VacationCard :balance="vacationBalance" @add="isVacationSheetOpen = true" />

  <button type="button" class="button period-button" @click="periodSheetPreset = 'month'">
    Period check
  </button>

  <PeriodSheet
    v-if="periodSheetPreset"
    :totals="totals"
    :loaded-until="loadedUntil"
    :profile="settings"
    :month="month"
    :initial-preset="periodSheetPreset"
    @close="periodSheetPreset = null"
  />

  <VacationSheet
    v-if="isVacationSheetOpen"
    :date="today"
    :days-left="vacationBalance?.left ?? null"
    @close="isVacationSheetOpen = false"
    @saved="onVacationSaved"
  />
</template>

<style scoped>
.summary-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin: 4px 0 12px;
}

.card {
  gap: 4px;
  margin-bottom: 12px;
}

.summary-cards .card {
  margin-bottom: 0;
}

/* Cards that open the period check */
button.card {
  width: 100%;
  font: inherit;
  text-align: left;
  color: var(--text);
  border: 1px solid var(--border);
}

.value {
  font-size: 1.4rem;
}

.figures {
  margin: 8px 0 16px;
  font-size: 0.85rem;
}

.period-button {
  width: 100%;
}

.error {
  color: var(--danger);
}
</style>
