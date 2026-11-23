<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()

const tabs = [
  { name: 'day', label: 'Day' },
  { name: 'week', label: 'Week' },
  { name: 'month', label: 'Month' },
  { name: 'settings', label: 'Settings' },
]
</script>

<template>
  <nav class="tab-bar">
    <RouterLink
      v-for="tab in tabs"
      :key="tab.name"
      :to="{ name: tab.name }"
      class="tab"
      :class="{ 'tab--active': route.name === tab.name }"
    >
      {{ tab.label }}
    </RouterLink>
  </nav>
</template>

<style scoped>
.tab-bar {
  position: fixed;
  inset: auto 0 0 0;
  display: flex;
  padding-bottom: env(safe-area-inset-bottom);
  background: var(--surface);
  border-top: 1px solid var(--border);
}

.tab {
  flex: 1;
  padding: 14px 0;
  text-align: center;
  font-size: 0.8rem;
  color: var(--text-muted);
  text-decoration: none;
}

.tab--active {
  color: var(--text);
  font-weight: 600;
}
</style>
