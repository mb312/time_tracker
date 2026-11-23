<script setup lang="ts">
import { computed, ref } from 'vue'
import BottomSheet from '@/components/BottomSheet.vue'
import DescriptionInput from '@/components/DescriptionInput.vue'
import { useEntries } from '@/composables/useEntries'
import {
  currentTimeRounded,
  durationMinutes,
  endsNextDay,
  formatHoursMinutes,
  toMinutes,
} from '@/lib/time'
import type { TimeEntry } from '@/types/entry'

const props = defineProps<{
  date: string
  entry: TimeEntry | null // null = new entry
  dayEntries: TimeEntry[]
}>()
const emit = defineEmits<{ close: []; saved: [] }>()

const { saveEntry, deleteEntry } = useEntries()

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

async function remove() {
  if (!props.entry || !confirm('Delete this entry?')) return
  try {
    await deleteEntry(props.entry.id)
    emit('saved')
  } catch {
    errorMessage.value = 'Deleting failed. Please try again.'
  }
}
</script>

<template>
  <BottomSheet
    :title="isEditing ? 'Edit entry' : 'New entry'"
    :is-saving="isSaving"
    @close="emit('close')"
    @save="save"
  >
    <label class="field">
      <span>Date</span>
      <input v-model="workDate" type="date" required />
    </label>

    <div class="times">
      <label class="field">
        <span>From</span>
        <input v-model="startTime" type="time" required />
      </label>
      <label class="field">
        <span>To</span>
        <input v-model="endTime" type="time" required />
      </label>
    </div>

    <div class="field">
      <span>Description</span>
      <DescriptionInput v-model="description" />
    </div>

    <p class="muted">
      Duration {{ formatHoursMinutes(durationHours) }} h
      <template v-if="isOvernight"> · ends the next day</template>
    </p>

    <p v-if="overlappingEntry" class="warning">
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
.times {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.warning {
  margin: 0;
  color: var(--warning);
}

.error {
  margin: 0;
  color: var(--danger);
}

.delete {
  color: var(--danger);
}
</style>
