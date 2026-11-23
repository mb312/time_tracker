<script setup lang="ts">
import { computed } from 'vue'
import { formatHours, formatSignedHours } from '@/lib/time'

// Hours against the target, with balance and a progress bar (Day and Week)
const props = defineProps<{
  hours: number
  target: number
  balance: number | null
  tag?: string // e.g. a holiday name
}>()

const progress = computed(() =>
  props.target > 0 ? Math.min(100, (props.hours / props.target) * 100) : 0,
)
</script>

<template>
  <section class="card summary">
    <div class="row">
      <strong class="hours">{{ formatHours(hours) }}</strong>
      <strong v-if="balance !== null" class="balance" :class="balance >= 0 ? 'good' : 'bad'">
        {{ formatSignedHours(balance) }}
      </strong>
    </div>
    <div class="row small muted">
      <span>
        of {{ formatHours(target) }}
        <span v-if="tag" class="tag tag--holiday">{{ tag }}</span>
      </span>
      <span v-if="balance !== null">balance</span>
    </div>
    <div v-if="target > 0" class="bar"><span :style="{ width: `${progress}%` }" /></div>
  </section>
</template>

<style scoped>
.summary {
  gap: var(--space-1);
}

.row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-2);
}

.hours {
  font-size: var(--text-xl);
  font-variant-numeric: tabular-nums;
}

.balance {
  font-size: var(--text-md);
  font-variant-numeric: tabular-nums;
}

.bar {
  margin-top: var(--space-2);
}
</style>
