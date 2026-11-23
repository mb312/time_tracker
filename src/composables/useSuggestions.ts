import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import type { DescriptionStat } from '@/types/entry'

const stats = ref<DescriptionStat[]>([])

// Reloaded each time the entry sheet opens, so new descriptions show up right away
async function loadStats(): Promise<void> {
  const { data, error } = await supabase.from('description_stats').select('*')
  if (error) throw error
  stats.value = data as DescriptionStat[]
}

export function useSuggestions() {
  return { stats, loadStats }
}
