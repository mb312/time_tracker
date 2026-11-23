<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import NumberInput from '@/components/NumberInput.vue'
import { DEFAULT_PROFILE, useProfile } from '@/composables/useProfile'
import { dailyTargetHours } from '@/lib/targets'
import { formatHours, formatHoursMinutes } from '@/lib/time'
import type { WorkProfile } from '@/types/profile'

const WEEKDAYS = [
  { day: 1, label: 'Mon' },
  { day: 2, label: 'Tue' },
  { day: 3, label: 'Wed' },
  { day: 4, label: 'Thu' },
  { day: 5, label: 'Fri' },
  { day: 6, label: 'Sat' },
  { day: 7, label: 'Sun' },
]

const { profile, loadProfile, saveProfile } = useProfile()

const form = ref<WorkProfile>(copyProfile(DEFAULT_PROFILE))
const isNewProfile = ref(true)
const isSaving = ref(false)
const message = ref('')
const isError = ref(false)

const dailyTarget = computed(() => dailyTargetHours(form.value))

onMounted(async () => {
  try {
    await loadProfile()
    if (profile.value) {
      form.value = copyProfile(profile.value)
      isNewProfile.value = false
    }
  } catch {
    showMessage('Could not load your profile.', true)
  }
})

function copyProfile(source: WorkProfile): WorkProfile {
  return { ...source, work_days: [...source.work_days] }
}

function toggleWorkday(day: number) {
  const days = form.value.work_days
  form.value.work_days = days.includes(day)
    ? days.filter((d) => d !== day)
    : [...days, day].sort((a, b) => a - b)
}

function validationError(values: WorkProfile): string {
  if (!values.employment_start || !values.tracking_start) return 'Please fill in both dates.'
  if (values.tracking_start < values.employment_start)
    return 'Tracking cannot start before the employment start date.'
  if (values.weekly_hours <= 0) return 'Weekly hours must be more than 0.'
  if (values.work_days.length === 0) return 'Select at least one workday.'
  if (values.vacation_days_per_year < 0) return 'Vacation days cannot be negative.'
  return ''
}

function showMessage(text: string, error = false) {
  message.value = text
  isError.value = error
}

async function save() {
  const error = validationError(form.value)
  if (error) return showMessage(error, true)

  isSaving.value = true
  try {
    await saveProfile(form.value)
    isNewProfile.value = false
    showMessage('Saved.')
  } catch {
    showMessage('Saving failed. Please try again.', true)
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <form class="profile-form" @submit.prevent="save">
    <p v-if="isNewProfile" class="muted">Not saved yet – check the values and save once.</p>

    <section class="card">
      <h2>Work</h2>
      <label class="field">
        <span>Employment start</span>
        <input v-model="form.employment_start" type="date" />
      </label>
      <label class="field">
        <span>Weekly hours</span>
        <NumberInput v-model="form.weekly_hours" />
      </label>
      <div class="field">
        <span>Workdays</span>
        <div class="weekdays">
          <button
            v-for="weekday in WEEKDAYS"
            :key="weekday.day"
            type="button"
            class="chip"
            :class="{ 'chip--active': form.work_days.includes(weekday.day) }"
            @click="toggleWorkday(weekday.day)"
          >
            {{ weekday.label }}
          </button>
        </div>
      </div>
      <p class="muted">
        Daily target: {{ formatHours(dailyTarget) }} ({{ formatHoursMinutes(dailyTarget) }})
      </p>
    </section>

    <section class="card">
      <h2>Vacation</h2>
      <label class="field">
        <span>Days per year</span>
        <NumberInput v-model="form.vacation_days_per_year" />
      </label>
      <label class="field">
        <span>Vacation year starts</span>
        <select v-model="form.vacation_year">
          <option value="calendar">1 January</option>
          <option value="anniversary">On the employment start date</option>
        </select>
      </label>
      <label class="field">
        <span>First year (pro rata) rounding</span>
        <select v-model="form.first_year_rounding">
          <option value="up">Round up to full days</option>
          <option value="half">Round to half days</option>
          <option value="exact">Exact</option>
        </select>
      </label>
      <label class="checkbox">
        <input v-model="form.half_days_dec_24_31" type="checkbox" />
        <span>24 and 31 December are half days</span>
      </label>
    </section>

    <section class="card">
      <h2>Starting values</h2>
      <p class="muted">From your Excel sheet, for the time before you started using the app.</p>
      <label class="field">
        <span>First day tracked in the app</span>
        <input v-model="form.tracking_start" type="date" />
      </label>
      <label class="field">
        <span>Hours worked before that day</span>
        <NumberInput v-model="form.hours_before_app" />
      </label>
      <label class="field">
        <span>Overtime balance on that day (+/− hours)</span>
        <NumberInput v-model="form.balance_before_app" signed />
      </label>
      <label class="field">
        <span>Vacation days taken before that day</span>
        <NumberInput v-model="form.vacation_used_before_app" />
      </label>
    </section>

    <p v-if="message" :class="isError ? 'error' : 'success'">{{ message }}</p>

    <button class="button button--primary" type="submit" :disabled="isSaving">
      {{ isSaving ? 'Saving…' : 'Save profile' }}
    </button>
  </form>
</template>

<style scoped>
.profile-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.weekdays {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.success {
  margin: 0;
  color: var(--success);
}

.error {
  margin: 0;
  color: var(--danger);
}
</style>
