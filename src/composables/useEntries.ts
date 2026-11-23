import { supabase } from '@/lib/supabase'
import type { TimeEntry, WorkEntryInput } from '@/types/entry'

// Entries between two dates (inclusive), sorted by day and start time
async function fetchEntries(fromDate: string, toDate: string): Promise<TimeEntry[]> {
  const { data, error } = await supabase
    .from('time_entries')
    .select('*')
    .gte('work_date', fromDate)
    .lte('work_date', toDate)
    .order('work_date')
    .order('start_time', { nullsFirst: true })
  if (error) throw error
  return data as TimeEntry[]
}

async function saveEntry({ id, ...values }: WorkEntryInput): Promise<void> {
  if (id) {
    const { error } = await supabase.from('time_entries').update(values).eq('id', id)
    if (error) throw error
  } else {
    const { error } = await supabase.from('time_entries').insert({ ...values, kind: 'work' })
    if (error) throw error
  }
}

async function deleteEntry(id: string): Promise<void> {
  const { error } = await supabase.from('time_entries').delete().eq('id', id)
  if (error) throw error
}

export function useEntries() {
  return { fetchEntries, saveEntry, deleteEntry }
}
