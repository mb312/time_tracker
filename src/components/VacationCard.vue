<script setup lang="ts">
import { formatLongDate } from '@/lib/dates'
import { formatDays, type VacationBalance } from '@/lib/vacation'

defineProps<{ balance: VacationBalance | null }>()
const emit = defineEmits<{ add: [] }>()
</script>

<template>
  <section class="card vacation">
    <span class="muted">Vacation {{ balance?.yearLabel }}</span>

    <template v-if="balance">
      <strong class="days-left">{{ formatDays(balance.left) }} days left</strong>
      <span class="muted">
        Entitled {{ formatDays(balance.entitled) }} · Taken {{ formatDays(balance.taken) }}
      </span>
      <span class="muted">
        Planned {{ formatDays(balance.planned) }} · Carried over
        {{ formatDays(balance.carriedOver) }}
      </span>
      <span v-if="balance.expiring" class="warning">
        {{ formatDays(balance.expiring.days) }} days expire on
        {{ formatLongDate(balance.expiring.date) }}
      </span>
    </template>
    <span v-else class="muted">Loading…</span>

    <button type="button" class="button" @click="emit('add')">+ Add vacation</button>
  </section>
</template>

<style scoped>
.vacation {
  gap: 4px;
}

.days-left {
  font-size: 1.6rem;
}

.warning {
  color: var(--warning);
}

.button {
  margin-top: 12px;
}
</style>
