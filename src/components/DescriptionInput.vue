<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useSuggestions } from '@/composables/useSuggestions'
import { todayIso } from '@/lib/dates'
import { rankSuggestions, type Suggestion } from '@/lib/suggestions'

const model = defineModel<string>({ required: true })

const { stats, loadStats } = useSuggestions()
const inputElement = ref<HTMLInputElement | null>(null)
const isFocused = ref(false)
const today = todayIso()

onMounted(() => loadStats().catch(() => {}))

const suggestions = computed(() => rankSuggestions(stats.value, model.value, today))
const isEmpty = computed(() => model.value.trim() === '')
const showList = computed(() => isFocused.value && !isEmpty.value && suggestions.value.length > 0)
const showChips = computed(() => isEmpty.value && suggestions.value.length > 0)

// A part starts a combined description ("Project X – "), a full description finishes it
function pick(suggestion: Suggestion) {
  if (suggestion.isPart) {
    model.value = `${suggestion.text} – `
    inputElement.value?.focus()
  } else {
    model.value = suggestion.text
    inputElement.value?.blur()
  }
}

function usageText(suggestion: Suggestion): string {
  const days = Math.round((Date.parse(today) - Date.parse(suggestion.lastUsed)) / 86_400_000)
  const lastUsed = days <= 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`
  const prefix = suggestion.isPart ? 'Part · ' : ''
  return `${prefix}used ${suggestion.timesUsed}× · ${lastUsed}`
}
</script>

<template>
  <div class="description-input">
    <input
      ref="inputElement"
      v-model="model"
      type="text"
      autocomplete="off"
      autocapitalize="sentences"
      @focus="isFocused = true"
      @blur="isFocused = false"
    />

    <!-- mousedown.prevent keeps the input focused, so the tap reaches the button -->
    <ul v-if="showList" class="suggestions">
      <li v-for="suggestion in suggestions" :key="`${suggestion.isPart}-${suggestion.text}`">
        <button type="button" @mousedown.prevent @click="pick(suggestion)">
          <span>{{ suggestion.text }}</span>
          <small class="muted">{{ usageText(suggestion) }}</small>
        </button>
      </li>
    </ul>

    <div v-if="showChips" class="chips">
      <button
        v-for="suggestion in suggestions"
        :key="suggestion.text"
        type="button"
        class="chip"
        @click="pick(suggestion)"
      >
        {{ suggestion.text }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.description-input {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.suggestions {
  margin: 0;
  padding: 0;
  list-style: none;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.suggestions button {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  padding: 10px 12px;
  font: inherit;
  text-align: left;
  color: var(--text);
  background: none;
  border: none;
  border-bottom: 1px solid var(--border);
}

.suggestions li:last-child button {
  border-bottom: none;
}

.suggestions small {
  font-size: 0.75rem;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
</style>
