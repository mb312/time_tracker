<script setup lang="ts">
import BottomSheet from '@/components/BottomSheet.vue'
import { formatLongDate } from '@/lib/dates'
import { formatDays, type VacationBalance } from '@/lib/vacation'

defineProps<{ balance: VacationBalance }>()
const emit = defineEmits<{ close: []; add: [] }>()
</script>

<template>
  <BottomSheet :title="`Vacation ${balance.yearLabel}`" :show-save="false" @close="emit('close')">
    <dl class="figures">
      <div>
        <dt>Entitled this year</dt>
        <dd>{{ formatDays(balance.entitled) }}</dd>
      </div>
      <div>
        <dt>Carried over</dt>
        <dd>{{ formatDays(balance.carriedOver) }}</dd>
      </div>
      <div>
        <dt>Taken</dt>
        <dd>{{ formatDays(balance.taken) }}</dd>
      </div>
      <div>
        <dt>Planned</dt>
        <dd>{{ formatDays(balance.planned) }}</dd>
      </div>
      <div class="total">
        <dt>Left</dt>
        <dd>{{ formatDays(balance.left) }} days</dd>
      </div>
    </dl>

    <p v-if="balance.expiring" class="warning small">
      {{ formatDays(balance.expiring.days) }} days expire on
      {{ formatLongDate(balance.expiring.date) }}
    </p>

    <button type="button" class="button button--primary" @click="emit('add')">Add vacation</button>
  </BottomSheet>
</template>

<style scoped>
.figures {
  margin: 0;
  padding: var(--space-1) var(--space-4);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.figures div {
  display: flex;
  justify-content: space-between;
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--border);
}

.figures div:last-child {
  border-bottom: none;
}

.figures dd {
  margin: 0;
  font-variant-numeric: tabular-nums;
}

.total {
  font-weight: 700;
}

.warning {
  color: var(--vacation);
}
</style>
