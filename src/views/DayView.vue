<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AddButton from '@/components/AddButton.vue'
import DayHeader from '@/components/DayHeader.vue'
import EntryList from '@/components/EntryList.vue'
import EntrySheet from '@/components/EntrySheet.vue'
import SummaryCard from '@/components/SummaryCard.vue'
import VacationSheet from '@/components/VacationSheet.vue'
import { useEntries } from '@/composables/useEntries'
import { DEFAULT_PROFILE, useProfile } from '@/composables/useProfile'
import { useSwipe } from '@/composables/useSwipe'
import { useToast } from '@/composables/useToast'
import { useToday } from '@/composables/useToday'
import { addDays } from '@/lib/dates'
import { holidayName } from '@/lib/holidays'
import { targetHoursForDay } from '@/lib/targets'
import { formatDays } from '@/lib/vacation'
import type { TimeEntry } from '@/types/entry'

const route = useRoute()
const router = useRouter()
const { fetchEntries, deleteEntry, restoreEntry } = useEntries()
const { profile, loadProfile } = useProfile()
const { showToast } = useToast()
const { today } = useToday(() => loadEntries())

const page = ref<HTMLElement | null>(null)
const date = computed(() => (route.params.date as string | undefined) || today.value)
const entries = ref<TimeEntry[]>([])
const isLoading = ref(true)
const loadError = ref('')

const isEntrySheetOpen = ref(false)
const isVacationSheetOpen = ref(false)
const selectedEntry = ref<TimeEntry | null>(null)

const totalHours = computed(
  () => entries.value.reduce((sum, entry) => sum + (entry.duration_min ?? 0), 0) / 60,
)
const targetHours = computed(() => targetHoursForDay(date.value, profile.value ?? DEFAULT_PROFILE))
const holiday = computed(() => holidayName(date.value) ?? undefined)
// No balance for days still to come
const balance = computed(() =>
  date.value <= today.value ? totalHours.value - targetHours.value : null,
)

async function loadEntries() {
  loadError.value = ''
  try {
    entries.value = await fetchEntries(date.value, date.value)
  } catch {
    loadError.value = 'Could not load entries. Check your connection and try again.'
  } finally {
    isLoading.value = false
  }
}

watch(
  date,
  () => {
    isLoading.value = true
    loadEntries()
  },
  { immediate: true },
)

onMounted(() => {
  if (!profile.value) loadProfile().catch(() => {})
})

function goToDate(isoDate: string) {
  router.push({ name: 'day', params: { date: isoDate } })
}

useSwipe(page, {
  onLeft: () => goToDate(addDays(date.value, 1)),
  onRight: () => goToDate(addDays(date.value, -1)),
})

function openNewEntry() {
  selectedEntry.value = null
  isEntrySheetOpen.value = true
}

function openEntry(entry: TimeEntry) {
  if (entry.kind === 'vacation') {
    removeWithUndo(entry, 'Vacation removed')
    return
  }
  selectedEntry.value = entry
  isEntrySheetOpen.value = true
}

async function removeWithUndo(entry: TimeEntry, message: string) {
  try {
    await deleteEntry(entry.id)
    await loadEntries()
    showToast(message, 'Undo', async () => {
      await restoreEntry(entry)
      await loadEntries()
    })
  } catch {
    showToast('Deleting failed. Please try again.')
  }
}

async function onEntrySaved() {
  isEntrySheetOpen.value = false
  await loadEntries()
  showToast('Entry saved')
}

async function onEntryDeleted(entry: TimeEntry) {
  isEntrySheetOpen.value = false
  await removeWithUndo(entry, 'Entry deleted')
}

async function onVacationSaved(bookedDays: number) {
  isVacationSheetOpen.value = false
  await loadEntries()
  showToast(`Vacation booked: ${formatDays(bookedDays)} ${bookedDays === 1 ? 'day' : 'days'}`)
}
</script>

<template>
  <div ref="page" class="day">
    <DayHeader :date="date" @change="goToDate" />
    <SummaryCard :hours="totalHours" :target="targetHours" :balance="balance" :tag="holiday" />

    <p v-if="loadError" class="error">{{ loadError }}</p>
    <template v-if="isLoading && entries.length === 0">
      <div class="skeleton" />
      <div class="skeleton" />
    </template>
    <EntryList v-else :entries="entries" @select="openEntry" />
  </div>

  <AddButton @entry="openNewEntry" @vacation="isVacationSheetOpen = true" />

  <EntrySheet
    v-if="isEntrySheetOpen"
    :date="date"
    :entry="selectedEntry"
    :day-entries="entries"
    @close="isEntrySheetOpen = false"
    @saved="onEntrySaved"
    @deleted="onEntryDeleted"
  />

  <VacationSheet
    v-if="isVacationSheetOpen"
    :date="date"
    :days-left="null"
    @close="isVacationSheetOpen = false"
    @saved="onVacationSaved"
  />
</template>

<style scoped>
/* Fills the screen so a swipe anywhere changes the day */
.day {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  min-height: 70vh;
}
</style>
