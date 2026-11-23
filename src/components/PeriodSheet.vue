<script setup lang="ts">
import { computed, ref } from 'vue'
import BottomSheet from '@/components/BottomSheet.vue'
import { firstOfMonth, formatMonthTitle, lastOfMonth, todayIso } from '@/lib/dates'
import { summarizePeriod } from '@/lib/stats'
import { formatHours, formatSignedHours } from '@/lib/time'
import type { DailyTotal } from '@/types/entry'
import type { WorkProfile } from '@/types/profile'

export type PeriodPreset = 'month' | 'year' | 'start' | 'custom'

const props = defineProps<{
  totals: DailyTotal[] // must cover employment start up to loadedUntil
  loadedUntil: string
  profile: WorkProfile
  month: string // month shown on the month screen
  initialPreset: PeriodPreset
}>()
const emit = defineEmits<{ close: [] }>()

const today = todayIso()
const year = today.slice(0, 4)

function presetRange(preset: PeriodPreset): { from: string; to: string } {
  if (preset === 'year') return { from: `${year}-01-01`, to: `${year}-12-31` }
  if (preset === 'start') return { from: props.profile.employment_start, to: today }
  return { from: firstOfMonth(props.month), to: lastOfMonth(props.month) }
}

const preset = ref<PeriodPreset>(props.initialPreset)
const fromDate = ref(presetRange(props.initialPreset).from)
const toDate = ref(presetRange(props.initialPreset).to)

function choosePreset(value: PeriodPreset) {
  preset.value = value
  if (value === 'custom') return
  const range = presetRange(value)
  fromDate.value = range.from
  toDate.value = range.to
}

const summary = computed(() =>
  fromDate.value && toDate.value && fromDate.value <= toDate.value
    ? summarizePeriod(fromDate.value, toDate.value, props.totals, props.profile, today)
    : null,
)

// Running period: hours still needed (or overtime once reached); finished period: balance
const mainFigure = computed(() => {
  const value = summary.value
  if (!value) return null
  if (value.stillToWork !== null && value.stillToWork > 0) {
    const perDay = value.workdaysLeft > 0 ? value.stillToWork / value.workdaysLeft : null
    return {
      label: 'Still to work',
      text: formatHours(value.stillToWork),
      detail: perDay
        ? `${value.workdaysLeft} workdays left · ${formatHours(perDay)}/day`
        : 'No workdays left in this period',
      isGood: false,
    }
  }
  const balance = value.stillToWork !== null ? -value.stillToWork : value.balanceToDate
  return {
    label: balance >= 0 ? 'Overtime' : 'Hours missing',
    text: formatSignedHours(balance),
    detail: value.stillToWork !== null ? 'Target for the period reached' : 'Period finished',
    isGood: balance >= 0,
  }
})

const presets: { value: PeriodPreset; label: string }[] = [
  { value: 'month', label: formatMonthTitle(props.month) },
  { value: 'year', label: 'This year' },
  { value: 'start', label: 'Since start' },
  { value: 'custom', label: 'Custom' },
]
</script>

<template>
  <BottomSheet title="Period check" :show-save="false" @close="emit('close')">
    <div class="presets">
      <button
        v-for="option in presets"
        :key="option.value"
        type="button"
        class="chip"
        :class="{ 'chip--active': preset === option.value }"
        @click="choosePreset(option.value)"
      >
        {{ option.label }}
      </button>
    </div>

    <div class="range">
      <label class="field">
        <span>From</span>
        <input
          v-model="fromDate"
          type="date"
          :min="profile.employment_start"
          :max="loadedUntil"
          @input="preset = 'custom'"
        />
      </label>
      <label class="field">
        <span>To</span>
        <input
          v-model="toDate"
          type="date"
          :min="fromDate"
          :max="loadedUntil"
          @input="preset = 'custom'"
        />
      </label>
    </div>

    <template v-if="summary && mainFigure">
      <section class="card main" :class="{ 'main--good': mainFigure.isGood }">
        <span class="muted">{{ mainFigure.label }}</span>
        <strong class="main-value">{{ mainFigure.text }}</strong>
        <span class="muted">{{ mainFigure.detail }}</span>
      </section>

      <dl class="figures">
        <div>
          <dt>Target</dt>
          <dd>{{ formatHours(summary.targetHours) }}</dd>
        </div>
        <div>
          <dt>Worked</dt>
          <dd>{{ formatHours(summary.workedHours) }}</dd>
        </div>
        <div>
          <dt>Vacation</dt>
          <dd>{{ formatHours(summary.vacationHours) }}</dd>
        </div>
        <div>
          <dt>Balance to date</dt>
          <dd>{{ formatSignedHours(summary.balanceToDate) }}</dd>
        </div>
        <div>
          <dt>Public holidays</dt>
          <dd>{{ summary.holidayWorkdays }} workdays</dd>
        </div>
      </dl>
    </template>
    <p v-else class="error">Please choose a valid period.</p>
  </BottomSheet>
</template>

<style scoped>
.presets {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.range {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.main {
  gap: 4px;
  border: 2px solid var(--accent);
}

.main--good {
  border-color: var(--success);
}

.main-value {
  font-size: 1.8rem;
}

.figures {
  margin: 0;
  padding: 4px 16px;
  background: var(--surface);
  border-radius: var(--radius);
}

.figures div {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
}

.figures div:last-child {
  border-bottom: none;
}

.figures dd {
  margin: 0;
  font-variant-numeric: tabular-nums;
}

.error {
  margin: 0;
  color: var(--danger);
}
</style>
