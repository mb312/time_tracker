<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MonthCalendar from '@/components/MonthCalendar.vue'
import PeriodHeader from '@/components/PeriodHeader.vue'
import PeriodSheet, { type PeriodPreset } from '@/components/PeriodSheet.vue'
import VacationDetailsSheet from '@/components/VacationDetailsSheet.vue'
import VacationSheet from '@/components/VacationSheet.vue'
import { DEFAULT_PROFILE, useProfile } from '@/composables/useProfile'
import { useStats } from '@/composables/useStats'
import { useSwipe } from '@/composables/useSwipe'
import { useToast } from '@/composables/useToast'
import { useToday } from '@/composables/useToday'
import { useVacation } from '@/composables/useVacation'
import { addMonths, firstOfMonth, formatMonthTitle, lastOfMonth } from '@/lib/dates'
import { summarizePeriod } from '@/lib/stats'
import { formatHours, formatSignedHours } from '@/lib/time'
import { calculateVacationBalance, formatDays } from '@/lib/vacation'
import type { DailyTotal, TimeEntry } from '@/types/entry'

const route = useRoute()
const router = useRouter()
const { profile, loadProfile } = useProfile()
const { fetchDailyTotals } = useStats()
const { fetchVacationEntries, toVacationUsages } = useVacation()
const { showToast } = useToast()
const { today } = useToday(() => loadData())

const page = ref<HTMLElement | null>(null)
const currentMonth = computed(() => today.value.slice(0, 7))
const month = computed(() => (route.params.month as string | undefined) || currentMonth.value)

const totals = ref<DailyTotal[]>([])
const vacationEntries = ref<TimeEntry[]>([])
const isLoading = ref(true)
const loadError = ref('')

const periodSheetPreset = ref<PeriodPreset | null>(null)
const isVacationDetailsOpen = ref(false)
const isVacationSheetOpen = ref(false)

const settings = computed(() => profile.value ?? DEFAULT_PROFILE)

// Everything from the employment start up to the end of this year (or the shown month)
const loadedUntil = computed(() => {
  const endOfYear = `${today.value.slice(0, 4)}-12-31`
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
  } catch {
    loadError.value = 'Could not load your data. Check your connection and try again.'
  } finally {
    isLoading.value = false
  }
}

watch(loadedUntil, loadData, { immediate: true })

const monthSummary = computed(() =>
  summarizePeriod(
    firstOfMonth(month.value),
    lastOfMonth(month.value),
    totals.value,
    settings.value,
    today.value,
  ),
)
const sinceStart = computed(() =>
  summarizePeriod(
    settings.value.employment_start,
    today.value,
    totals.value,
    settings.value,
    today.value,
  ),
)
const vacationBalance = computed(() =>
  calculateVacationBalance(
    settings.value,
    toVacationUsages(vacationEntries.value, settings.value),
    today.value,
  ),
)

function goToMonth(value: string) {
  router.push({ name: 'month', params: { month: value } })
}

useSwipe(page, {
  onLeft: () => goToMonth(addMonths(month.value, 1)),
  onRight: () => goToMonth(addMonths(month.value, -1)),
})

function openVacationBooking() {
  isVacationDetailsOpen.value = false
  isVacationSheetOpen.value = true
}

async function onVacationSaved(bookedDays: number) {
  isVacationSheetOpen.value = false
  await loadData()
  showToast(`Vacation booked: ${formatDays(bookedDays)} ${bookedDays === 1 ? 'day' : 'days'}`)
}
</script>

<template>
  <div ref="page" class="month">
    <PeriodHeader
      :title="formatMonthTitle(month)"
      :back-label="month === currentMonth ? undefined : 'Back to this month'"
      @previous="goToMonth(addMonths(month, -1))"
      @next="goToMonth(addMonths(month, 1))"
      @back="goToMonth(currentMonth)"
    />

    <p v-if="loadError" class="error">{{ loadError }}</p>

    <!-- Tapping the strip opens the period check for this month -->
    <button type="button" class="card strip" @click="periodSheetPreset = 'month'">
      <span class="stat">
        <span class="label">Hours</span>
        <strong>{{ formatHours(monthSummary.workedHours + monthSummary.vacationHours) }}</strong>
      </span>
      <span class="stat">
        <span class="label">Target</span>
        <strong>{{ formatHours(monthSummary.targetHours) }}</strong>
      </span>
      <span class="stat stat--right">
        <span class="label">Balance</span>
        <strong :class="monthSummary.balanceToDate >= 0 ? 'good' : 'bad'">
          {{ formatSignedHours(monthSummary.balanceToDate) }}
        </strong>
      </span>
    </button>

    <div v-if="isLoading && totals.length === 0" class="skeleton calendar-placeholder" />
    <MonthCalendar
      v-else
      :month="month"
      :totals="totals"
      :profile="settings"
      @select="(date) => router.push({ name: 'day', params: { date } })"
    />

    <div class="cards">
      <button type="button" class="card small-card" @click="periodSheetPreset = 'start'">
        <span class="label">Since start</span>
        <strong>{{ formatHours(sinceStart.workedHours) }}</strong>
        <span class="small" :class="sinceStart.balanceToDate >= 0 ? 'good' : 'bad'">
          {{ formatSignedHours(sinceStart.balanceToDate) }}
        </span>
      </button>

      <div
        class="card small-card vacation-card"
        role="button"
        tabindex="0"
        @click="isVacationDetailsOpen = true"
        @keydown.enter="isVacationDetailsOpen = true"
      >
        <span class="label">Vacation</span>
        <strong>{{ formatDays(vacationBalance.left) }} days left</strong>
        <button type="button" class="link-button add-vacation" @click.stop="openVacationBooking">
          + Add
        </button>
      </div>
    </div>
  </div>

  <PeriodSheet
    v-if="periodSheetPreset"
    :totals="totals"
    :loaded-until="loadedUntil"
    :profile="settings"
    :month="month"
    :initial-preset="periodSheetPreset"
    @close="periodSheetPreset = null"
  />

  <VacationDetailsSheet
    v-if="isVacationDetailsOpen"
    :balance="vacationBalance"
    @close="isVacationDetailsOpen = false"
    @add="openVacationBooking"
  />

  <VacationSheet
    v-if="isVacationSheetOpen"
    :date="today"
    :days-left="vacationBalance.left"
    @close="isVacationSheetOpen = false"
    @saved="onVacationSaved"
  />
</template>

<style scoped>
/* Fills the screen so a swipe anywhere changes the month */
.month {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  min-height: 70vh;
}

button.card,
.vacation-card {
  width: 100%;
  font: inherit;
  text-align: left;
  color: var(--text);
  cursor: pointer;
}

.strip {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  padding: var(--space-3) var(--space-4);
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-variant-numeric: tabular-nums;
}

.stat--right {
  align-items: flex-end;
}

.label {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}

.small-card {
  gap: 2px;
  padding: var(--space-3);
  font-variant-numeric: tabular-nums;
}

.add-vacation {
  align-self: flex-start;
  padding: 0;
}

.calendar-placeholder {
  height: 280px;
}
</style>
