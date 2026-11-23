<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()

// Icons are simple 24×24 line drawings (SVG path data)
const tabs = [
  {
    name: 'day',
    label: 'Day',
    icon: 'M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM3 10h18M8 3v4M16 3v4M8 14h3v3H8z',
  },
  { name: 'week', label: 'Week', icon: 'M4 7h16M4 12h16M4 17h10' },
  {
    name: 'month',
    label: 'Month',
    icon: 'M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM3 10h18M3 15.5h18M9 10v11M15 10v11',
  },
  { name: 'settings', label: 'Settings', icon: 'M4 8h9M17 8h3M15 6v4M4 16h3M11 16h9M9 14v4' },
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
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path :d="tab.icon" />
      </svg>
      <span>{{ tab.label }}</span>
    </RouterLink>
  </nav>
</template>

<style scoped>
.tab-bar {
  position: fixed;
  inset: auto 0 0 0;
  z-index: 6;
  display: flex;
  padding-bottom: env(safe-area-inset-bottom);
  background: var(--surface);
  border-top: 1px solid var(--border);
}

.tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: var(--space-2) 0 var(--space-2);
  font-size: var(--text-xs);
  color: var(--text-muted);
  text-decoration: none;
}

.tab svg {
  width: 24px;
  height: 24px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.tab--active {
  color: var(--accent);
  font-weight: 600;
}
</style>
