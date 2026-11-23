<script setup lang="ts">
import { ref, watch } from 'vue'

// Text field for numbers that accepts "7,5" as well as "7.5"
const props = defineProps<{ signed?: boolean }>()
const model = defineModel<number>({ required: true })

const text = ref(String(model.value))

watch(model, (value) => {
  if (parseNumber(text.value) !== value) text.value = String(value)
})

function parseNumber(input: string): number {
  return Number(input.replace(',', '.').trim())
}

function onInput() {
  const value = parseNumber(text.value)
  if (!Number.isNaN(value)) model.value = value
}
</script>

<template>
  <!-- iOS number pads have no minus key, so signed values use the normal keyboard -->
  <input
    v-model="text"
    type="text"
    :inputmode="props.signed ? 'text' : 'decimal'"
    @input="onInput"
  />
</template>
