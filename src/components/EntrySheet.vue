<script setup lang="ts">
import { computed, ref } from 'vue'
import BottomSheet from '@/components/BottomSheet.vue'
import DescriptionInput from '@/components/DescriptionInput.vue'
import { useEntries } from '@/composables/useEntries'
import { formatLongDate } from '@/lib/dates'
import {
  currentTimeRounded,
  durationMinutes,
  endsNextDay,
  formatHoursMinutes,
  fromMinutes,
  toMinutes,
} from '@/lib/time'
import type { TimeEntry } from '@/types/entry'

const props = defineProps<{
  date: string
  entry: TimeEntry | null // null = new entry
  dayEntries: TimeEntry[]
}>()
const emit = defineEmits<{ close: []; saved: []; deleted: [entry: TimeEntry] }>()

const { saveEntry } = useEntries()

const isEditing = props.entry !== null
const workDate = ref(props.entry?.work_date ?? props.date)
const startTime = ref(props.entry?.start_time?.slice(0, 5) ?? defaultStartTime())
const endTime = ref(props.entry?.end_time?.slice(0, 5) ?? defaultEndTime(startTime.value))
const description = ref(props.entry?.description ?? '')
const errorMessage = ref('')
const isSaving = ref(false)

// "From" continues where the day's last entry ended
function defaultStartTime(): string {
  const latestEnd = props.dayEntries.reduce(
    (latest, entry) => (entry.end_time && entry.end_time > latest ? entry.end_time : latest),
    '',
  )
  return latestEnd ? latestEnd.slice(0, 5) : currentTimeRounded(15)
}

function defaultEndTime(start: string): string {
  const now = currentTimeRounded(5)
  return toMinutes(now) > toMinutes(start) ? now : ''
}

// Quick buttons: "Now" and ±15 minutes
function shiftTime(time: string, minutes: number): string {
  const base = time ? toMinutes(time) : toMinutes(currentTimeRounded(5))
  return fromMinutes((base + minutes + 1440) % 1440)
}

// +15 on "From": if it reaches "To", "To" moves along, so the entry never turns into a night shift
function addToStart(minutes: number) {
  const wasSameDay = !!endTime.value && toMinutes(endTime.value) > toMinutes(startTime.value)
  startTime.value = shiftTime(startTime.value, minutes)
  if (wasSameDay && toMinutes(startTime.value) >= toMinutes(endTime.value)) {
    endTime.value = shiftTime(endTime.value, minutes)
  }
}

const hasValidTimes = computed(
  () => !!startTime.value && !!endTime.value && startTime.value !== endTime.value,
)

const isOvernight = computed(
  () => hasValidTimes.value && endsNextDay(startTime.value, endTime.value),
)

const durationHours = computed(() =>
  hasValidTimes.value ? durationMinutes(startTime.value, endTime.value) / 60 : 0,
)

// Only checked against the day that is open in the day view
const overlappingEntry = computed(() => {
  if (!hasValidTimes.value || workDate.value !== props.date) return null
  const start = toMinutes(startTime.value)
  const end = start + durationMinutes(startTime.value, endTime.value)

  return (
    props.dayEntries.find((other) => {
      if (other.id === props.entry?.id || !other.start_time || !other.end_time) return false
      const otherStart = toMinutes(other.start_time)
      const otherEnd = otherStart + durationMinutes(other.start_time, other.end_time)
      return start < otherEnd && otherStart < end
    }) ?? null
  )
})

async function save() {
  if (!hasValidTimes.value) {
    errorMessage.value = '"From" and "To" must be different times.'
    return
  }

  isSaving.value = true
  try {
    await saveEntry({
      id: props.entry?.id,
      work_date: workDate.value,
      start_time: startTime.value,
      end_time: endTime.value,
      description: description.value.trim(),
    })
    emit('saved')
  } catch {
    errorMessage.value = 'Saving failed. Please try again.'
  } finally {
    isSaving.value = false
  }
}

// The day view deletes the entry and offers Undo
function remove() {
  if (props.entry) emit('deleted', props.entry)
}
</script>

<template>
  <BottomSheet
    :title="isEditing ? 'Edit entry' : 'New entry'"
    :is-saving="isSaving"
    @close="emit('close')"
    @save="save"
  >
    <!-- Tapping the date opens the iOS date picker -->
    <label class="date-pill">
      <span>{{ formatLongDate(workDate) }} ▾</span>
      <input v-model="workDate" type="date" aria-label="Date" required />
    </label>

    <div class="times">
      <div class="time-field">
        <label class="field">
          <span>From</span>
          <input v-model="startTime" type="time" required />
        </label>
        <div class="quick">
          <button type="button" class="chip" @click="startTime = currentTimeRounded(5)">Now</button>
          <button type="button" class="chip" @click="startTime = shiftTime(startTime, -15)">
            −15
          </button>
          <button type="button" class="chip" @click="addToStart(15)">+15</button>
        </div>
      </div>
      <div class="time-field">
        <label class="field">
          <span>To</span>
          <input v-model="endTime" type="time" required />
        </label>
        <div class="quick">
          <button type="button" class="chip" @click="endTime = currentTimeRounded(5)">Now</button>
          <button type="button" class="chip" @click="endTime = shiftTime(endTime, -15)">−15</button>
          <button type="button" class="chip" @click="endTime = shiftTime(endTime, 15)">+15</button>
        </div>
      </div>
    </div>

    <div class="field">
      <span>Description</span>
      <DescriptionInput v-model="description" />
    </div>

    <p class="muted small">
      Duration {{ formatHoursMinutes(durationHours) }} h
      <template v-if="isOvernight"> · ends the next day</template>
    </p>

    <p v-if="overlappingEntry" class="warning small">
      Overlaps with {{ overlappingEntry.start_time?.slice(0, 5) }} –
      {{ overlappingEntry.end_time?.slice(0, 5) }}
      {{ overlappingEntry.description }}
    </p>
    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

    <button v-if="isEditing" type="button" class="button delete" @click="remove">
      Delete entry
    </button>
  </BottomSheet>
</template>

<style scoped>
.date-pill {
  position: relative;
  align-self: flex-start;
  padding: 6px var(--space-3);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--accent);
  background: var(--accent-soft);
  border-radius: 999px;
}

.date-pill input {
  position: absolute;
  inset: 0;
  height: 100%;
  padding: 0;
  opacity: 0;
}

.times {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}

.time-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.quick {
  display: flex;
  gap: var(--space-1);
}

.quick .chip {
  flex: 1;
  padding: 6px 0;
  font-size: var(--text-xs);
}

.warning {
  color: var(--vacation);
}

.delete {
  color: var(--bad);
}
</style>
