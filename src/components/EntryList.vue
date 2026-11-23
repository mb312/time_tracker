<script setup lang="ts">
import { computed } from 'vue'
import { endsNextDay, formatHoursMinutes, toMinutes } from '@/lib/time'
import type { TimeEntry } from '@/types/entry'

const props = defineProps<{ entries: TimeEntry[] }>()
const emit = defineEmits<{ select: [entry: TimeEntry] }>()

type Row = { type: 'entry'; entry: TimeEntry } | { type: 'break'; minutes: number; key: string }

// Entries with the gaps between them shown as breaks
const rows = computed<Row[]>(() => {
  const result: Row[] = []
  let previousEnd: string | null = null

  for (const entry of props.entries) {
    if (previousEnd && entry.start_time) {
      const gap = toMinutes(entry.start_time) - toMinutes(previousEnd)
      if (gap > 0) result.push({ type: 'break', minutes: gap, key: `break-${entry.id}` })
    }
    result.push({ type: 'entry', entry })
    if (entry.end_time) previousEnd = entry.end_time
  }
  return result
})

function hoursOf(entry: TimeEntry): number {
  return (entry.duration_min ?? 0) / 60
}

function timeRange(entry: TimeEntry): string {
  if (entry.kind === 'vacation') return 'Vacation'
  if (!entry.start_time || !entry.end_time) return `${entry.start_time?.slice(0, 5)} – …`
  const nextDay = endsNextDay(entry.start_time, entry.end_time) ? ' (+1)' : ''
  return `${entry.start_time.slice(0, 5)} – ${entry.end_time.slice(0, 5)}${nextDay}`
}
</script>

<template>
  <p v-if="entries.length === 0" class="muted empty">No entries yet.</p>

  <ul v-else class="entry-list">
    <template v-for="row in rows" :key="row.type === 'entry' ? row.entry.id : row.key">
      <li v-if="row.type === 'break'" class="break">
        Break {{ formatHoursMinutes(row.minutes / 60) }} h
      </li>

      <li v-else>
        <button type="button" class="entry" @click="emit('select', row.entry)">
          <span class="entry-time">{{ timeRange(row.entry) }}</span>
          <span class="entry-hours">{{ formatHoursMinutes(hoursOf(row.entry)) }} h</span>
          <span v-if="row.entry.description" class="entry-description">
            {{ row.entry.description }}
          </span>
        </button>
      </li>
    </template>
  </ul>
</template>

<style scoped>
.entry-list {
  margin: 0;
  padding: 0;
  list-style: none;
  background: var(--surface);
  border-radius: var(--radius);
}

.entry {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 2px 12px;
  width: 100%;
  padding: 12px 16px;
  font: inherit;
  text-align: left;
  color: var(--text);
  background: none;
  border: none;
  border-bottom: 1px solid var(--border);
}

li:last-child .entry {
  border-bottom: none;
}

.entry-hours {
  font-weight: 600;
}

.entry-description {
  grid-column: 1 / -1;
  font-size: 0.9rem;
  color: var(--text-muted);
}

.break {
  padding: 4px 16px;
  font-size: 0.75rem;
  color: var(--text-muted);
  background: var(--bg);
}

.empty {
  padding: 24px 0;
  text-align: center;
}
</style>
