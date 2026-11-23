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
  if (!entry.start_time || !entry.end_time) return `${entry.start_time?.slice(0, 5)} – …`
  const nextDay = endsNextDay(entry.start_time, entry.end_time) ? ' (+1)' : ''
  return `${entry.start_time.slice(0, 5)} – ${entry.end_time.slice(0, 5)}${nextDay}`
}
</script>

<template>
  <p v-if="entries.length === 0" class="empty muted">No entries yet. Tap + to add one.</p>

  <ul v-else class="entry-list">
    <template v-for="row in rows" :key="row.type === 'entry' ? row.entry.id : row.key">
      <li v-if="row.type === 'break'" class="break">
        Break {{ formatHoursMinutes(row.minutes / 60) }}
      </li>

      <li v-else>
        <button type="button" class="entry" @click="emit('select', row.entry)">
          <template v-if="row.entry.kind === 'vacation'">
            <span class="tag tag--vacation">Vacation</span>
            <span class="entry-hours">{{ formatHoursMinutes(hoursOf(row.entry)) }}</span>
            <span class="entry-description">Tap to remove</span>
          </template>
          <template v-else>
            <span class="entry-time">{{ timeRange(row.entry) }}</span>
            <span class="entry-hours">{{ formatHoursMinutes(hoursOf(row.entry)) }}</span>
            <span v-if="row.entry.description" class="entry-description">
              {{ row.entry.description }}
            </span>
          </template>
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
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}

.entry {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 2px var(--space-3);
  width: 100%;
  padding: var(--space-3) var(--space-4);
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

.entry-time,
.entry-hours {
  font-variant-numeric: tabular-nums;
}

.entry-hours {
  font-weight: 600;
}

.entry .tag {
  justify-self: start;
}

.entry-description {
  grid-column: 1 / -1;
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.break {
  padding: var(--space-1) var(--space-4);
  font-size: var(--text-xs);
  text-align: center;
  color: var(--text-muted);
  background: var(--bg);
  border-bottom: 1px solid var(--border);
}

.empty {
  padding: var(--space-6) 0;
  text-align: center;
}
</style>
