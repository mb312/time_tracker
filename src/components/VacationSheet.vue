<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import BottomSheet from '@/components/BottomSheet.vue'
import { useEntries } from '@/composables/useEntries'
import { DEFAULT_PROFILE, useProfile } from '@/composables/useProfile'
import { useVacation } from '@/composables/useVacation'
import { addDays, formatLongDate, isoWeekday } from '@/lib/dates'
import { holidayName } from '@/lib/holidays'
import { dailyTargetHours, targetHoursForDay } from '@/lib/targets'
import { formatHoursMinutes } from '@/lib/time'
import { formatDays } from '@/lib/vacation'
import type { TimeEntry } from '@/types/entry'

const props = defineProps<{
  date: string
  daysLeft: number | null // null when the balance isn't known on this screen
}>()
const emit = defineEmits<{ close: []; saved: [bookedDays: number] }>()

const { profile } = useProfile()
const { fetchEntries } = useEntries()
const { addVacationDays } = useVacation()

const MAX_RANGE_DAYS = 62

const fromDate = ref(props.date)
const toDate = ref(props.date)
const isHalfDay = ref(false)
const periodEntries = ref<TimeEntry[]>([])
const selectedDates = ref<string[]>([])
const errorMessage = ref('')
const isSaving = ref(false)
const isListOpen = ref(false)

const settings = computed(() => profile.value ?? DEFAULT_PROFILE)

// A later "From" moves "To" along, so the range never runs backwards
watch(fromDate, (from) => {
  if (toDate.value < from) toDate.value = from
})

const rangeError = computed(() => {
  if (!fromDate.value || !toDate.value) return 'Please choose both dates.'
  if (toDate.value < fromDate.value) return '"To" must not be before "From".'
  if (addDays(fromDate.value, MAX_RANGE_DAYS) < toDate.value)
    return `Please choose at most ${MAX_RANGE_DAYS} days at once.`
  return ''
})

function datesInRange(): string[] {
  if (rangeError.value) return []
  const dates = []
  for (let date = fromDate.value; date <= toDate.value; date = addDays(date, 1)) dates.push(date)
  return dates
}

// Holidays on regular workdays: shown as "not counted", like weekends they cost no vacation
const skippedHolidays = computed(() =>
  datesInRange()
    .filter((date) => settings.value.work_days.includes(isoWeekday(date)))
    .map((date) => ({ date, name: holidayName(date) }))
    .filter((day) => day.name !== null),
)

// Workdays in the range (weekends and holidays have a target of 0 and are left out)
const workdays = computed(() => {
  const result = []
  for (const date of datesInRange()) {
    const target = targetHoursForDay(date, settings.value)
    if (target === 0) continue
    const dayEntries = periodEntries.value.filter((entry) => entry.work_date === date)
    result.push({
      date,
      target,
      isBooked: dayEntries.some((entry) => entry.kind === 'vacation'),
      hasWork: dayEntries.some((entry) => entry.kind === 'work'),
    })
  }
  return result
})

watch(
  [fromDate, toDate],
  async () => {
    if (rangeError.value) return
    try {
      periodEntries.value = await fetchEntries(fromDate.value, toDate.value)
    } catch {
      periodEntries.value = []
    }
    // Pre-select free workdays; days with work entries stay unticked until chosen
    selectedDates.value = workdays.value
      .filter((day) => !day.isBooked && !day.hasWork)
      .map((day) => day.date)
  },
  { immediate: true },
)

function creditedMinutes(target: number): number {
  return Math.round(target * 60 * (isHalfDay.value ? 0.5 : 1))
}

// Short ranges show their days right away; longer ones fold the list
const showList = computed(() => isListOpen.value || workdays.value.length <= 5)
const selectedCount = computed(
  () => workdays.value.filter((day) => selectedDates.value.includes(day.date)).length,
)

const bookedDays = computed(() => {
  const minutesPerDay = dailyTargetHours(settings.value) * 60
  return workdays.value
    .filter((day) => selectedDates.value.includes(day.date))
    .reduce((sum, day) => sum + creditedMinutes(day.target) / minutesPerDay, 0)
})

async function save() {
  if (rangeError.value) {
    errorMessage.value = rangeError.value
    return
  }
  const days = workdays.value.filter((day) => selectedDates.value.includes(day.date))
  if (days.length === 0) {
    errorMessage.value = 'Select at least one day.'
    return
  }

  isSaving.value = true
  try {
    await addVacationDays(
      days.map((day) => ({ date: day.date, creditedMin: creditedMinutes(day.target) })),
    )
    emit('saved', bookedDays.value)
  } catch {
    errorMessage.value = 'Saving failed. Please try again.'
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <BottomSheet title="Add vacation" :is-saving="isSaving" @close="emit('close')" @save="save">
    <div class="range">
      <label class="field">
        <span>From</span>
        <input v-model="fromDate" type="date" required />
      </label>
      <label class="field">
        <span>To</span>
        <input v-model="toDate" type="date" :min="fromDate" required />
      </label>
    </div>

    <p v-if="rangeError" class="error">{{ rangeError }}</p>

    <p v-if="!rangeError && workdays.length === 0" class="muted">No workdays in this period.</p>

    <button
      v-if="workdays.length > 5"
      type="button"
      class="list-toggle"
      @click="isListOpen = !isListOpen"
    >
      <span>{{ selectedCount }} of {{ workdays.length }} workdays selected</span>
      <span class="link-text">{{ isListOpen ? 'Hide days' : 'Edit days' }}</span>
    </button>

    <ul v-if="workdays.length > 0 && showList" class="days">
      <li v-for="day in workdays" :key="day.date">
        <label class="checkbox">
          <input
            v-model="selectedDates"
            type="checkbox"
            :value="day.date"
            :disabled="day.isBooked"
          />
          <span class="day-text">
            {{ formatLongDate(day.date) }}
            <small v-if="day.isBooked" class="muted">already booked</small>
            <small v-else-if="day.hasWork" class="warning">has work entries</small>
          </span>
          <span class="muted">{{ formatHoursMinutes(creditedMinutes(day.target) / 60) }} h</span>
        </label>
      </li>
    </ul>

    <p v-if="skippedHolidays.length > 0" class="muted small">
      Not counted:
      <template v-for="(holiday, index) in skippedHolidays" :key="holiday.date">
        {{ index > 0 ? ', ' : '' }}{{ holiday.name }} ({{ formatLongDate(holiday.date) }})
      </template>
    </p>

    <label class="checkbox">
      <input v-model="isHalfDay" type="checkbox" />
      <span>Half day</span>
    </label>

    <p class="summary">
      Books {{ formatDays(bookedDays) }} {{ bookedDays === 1 ? 'day' : 'days' }}
      <template v-if="daysLeft !== null">
        · {{ formatDays(daysLeft - bookedDays) }} left after</template
      >
    </p>

    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
  </BottomSheet>
</template>

<style scoped>
.range {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}

.list-toggle {
  display: flex;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  font: inherit;
  font-size: var(--text-sm);
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.link-text {
  color: var(--accent);
}

.days {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin: 0;
  padding: var(--space-3) var(--space-4);
  list-style: none;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.day-text {
  flex: 1;
}

.day-text small {
  display: block;
  font-size: var(--text-xs);
}

.warning {
  color: var(--vacation);
}

.summary {
  font-weight: 600;
}
</style>
