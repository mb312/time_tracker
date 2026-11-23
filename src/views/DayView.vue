<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DayHeader from '@/components/DayHeader.vue'
import EntryList from '@/components/EntryList.vue'
import EntrySheet from '@/components/EntrySheet.vue'
import VacationSheet from '@/components/VacationSheet.vue'
import { useEntries } from '@/composables/useEntries'
import { DEFAULT_PROFILE, useProfile } from '@/composables/useProfile'
import { todayIso } from '@/lib/dates'
import { holidayName } from '@/lib/holidays'
import { targetHoursForDay } from '@/lib/targets'
import { formatHours, formatHoursMinutes } from '@/lib/time'
import type { TimeEntry } from '@/types/entry'

const route = useRoute()
const router = useRouter()
const { fetchEntries, deleteEntry } = useEntries()
const { profile, loadProfile } = useProfile()

const date = computed(() => (route.params.date as string | undefined) || todayIso())
const entries = ref<TimeEntry[]>([])
const loadError = ref('')

const isSheetOpen = ref(false)
const isVacationSheetOpen = ref(false)
const selectedEntry = ref<TimeEntry | null>(null)

const totalHours = computed(
  () => entries.value.reduce((sum, entry) => sum + (entry.duration_min ?? 0), 0) / 60,
)
const holiday = computed(() => holidayName(date.value))
const targetHours = computed(() => targetHoursForDay(date.value, profile.value ?? DEFAULT_PROFILE))

async function loadEntries() {
  loadError.value = ''
  try {
    entries.value = await fetchEntries(date.value, date.value)
  } catch {
    loadError.value = 'Could not load entries.'
  }
}

watch(date, loadEntries, { immediate: true })

onMounted(() => {
  if (!profile.value) loadProfile().catch(() => {})
})

function goToDate(isoDate: string) {
  router.push({ name: 'day', params: { date: isoDate } })
}

function openSheet(entry: TimeEntry | null) {
  if (entry?.kind === 'vacation') return removeVacation(entry)
  selectedEntry.value = entry
  isSheetOpen.value = true
}

async function removeVacation(entry: TimeEntry) {
  if (!confirm('Remove the vacation on this day?')) return
  try {
    await deleteEntry(entry.id)
    await loadEntries()
  } catch {
    loadError.value = 'Removing the vacation failed.'
  }
}

async function onSaved() {
  isSheetOpen.value = false
  isVacationSheetOpen.value = false
  await loadEntries()
}
</script>

<template>
  <DayHeader :date="date" @change="goToDate" />

  <section v-if="holiday" class="card holiday">
    <span class="muted">Public holiday</span>
    <strong>{{ holiday }}</strong>
  </section>

  <section class="card total">
    <span class="muted">{{ date === todayIso() ? 'Today' : 'Total' }}</span>
    <div class="total-row">
      <strong class="total-hours">{{ formatHours(totalHours) }}</strong>
      <span class="muted">{{ formatHoursMinutes(totalHours) }}</span>
    </div>
    <span class="muted">Target {{ formatHours(targetHours) }}</span>
  </section>

  <p v-if="loadError" class="error">{{ loadError }}</p>
  <EntryList :entries="entries" @select="openSheet" />

  <div class="actions">
    <button type="button" class="button button--primary" @click="openSheet(null)">
      + Add entry
    </button>
    <button type="button" class="button" @click="isVacationSheetOpen = true">Vacation</button>
  </div>

  <EntrySheet
    v-if="isSheetOpen"
    :date="date"
    :entry="selectedEntry"
    :day-entries="entries"
    @close="isSheetOpen = false"
    @saved="onSaved"
  />

  <VacationSheet
    v-if="isVacationSheetOpen"
    :date="date"
    :days-left="null"
    @close="isVacationSheetOpen = false"
    @saved="onSaved"
  />
</template>

<style scoped>
.card {
  margin-bottom: 12px;
  gap: 4px;
}

.holiday {
  background: var(--bg);
  border: 1px solid var(--border);
}

.total-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.total-hours {
  font-size: 1.8rem;
}

.actions {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 8px;
  margin-top: 16px;
}

.error {
  color: var(--danger);
}
</style>
