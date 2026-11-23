<script setup lang="ts">
// Panel sliding up from the bottom with Cancel / title / Save (or just Close)
withDefaults(defineProps<{ title: string; isSaving?: boolean; showSave?: boolean }>(), {
  showSave: true,
})
const emit = defineEmits<{ close: []; save: [] }>()
</script>

<template>
  <Teleport to="body">
    <div class="overlay" @click.self="emit('close')">
      <form class="sheet" @submit.prevent="emit('save')">
        <header class="sheet-header">
          <button type="button" class="link" @click="emit('close')">
            {{ showSave ? 'Cancel' : 'Close' }}
          </button>
          <h2>{{ title }}</h2>
          <button v-if="showSave" type="submit" class="link link--strong" :disabled="isSaving">
            Save
          </button>
          <span v-else class="spacer" />
        </header>
        <slot />
      </form>
    </div>
  </Teleport>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 10;
  display: flex;
  align-items: flex-end;
  background: rgb(0 0 0 / 0.35);
}

.sheet {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  padding: 16px 16px calc(env(safe-area-inset-bottom) + 24px);
  background: var(--bg);
  border-radius: 16px 16px 0 0;
}

.sheet-header {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
}

.sheet-header > :last-child {
  justify-self: end;
}

.link {
  justify-self: start;
  padding: 8px 0;
  font: inherit;
  color: var(--accent);
  background: none;
  border: none;
}

.link--strong {
  font-weight: 600;
}
</style>
