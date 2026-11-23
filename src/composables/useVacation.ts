import { addDays } from '@/lib/dates'
import { supabase } from '@/lib/supabase'
import { dailyTargetHours } from '@/lib/targets'
import type { VacationUsage } from '@/lib/vacation'
import type { TimeEntry } from '@/types/entry'
import type { WorkProfile } from '@/types/profile'

async function fetchVacationEntries(): Promise<TimeEntry[]> {
  const { data, error } = await supabase
    .from('time_entries')
    .select('*')
    .eq('kind', 'vacation')
    .order('work_date')
  if (error) throw error
  return data as TimeEntry[]
}

async function addVacationDays(days: { date: string; creditedMin: number }[]): Promise<void> {
  const rows = days.map((day) => ({
    work_date: day.date,
    kind: 'vacation',
    credited_min: day.creditedMin,
    description: 'Vacation',
  }))
  const { error } = await supabase.from('time_entries').insert(rows)
  if (error) throw error
}

// Vacation entries and the days taken before the app, counted in days (half day = 0.5)
function toVacationUsages(entries: TimeEntry[], profile: WorkProfile): VacationUsage[] {
  const minutesPerDay = dailyTargetHours(profile) * 60
  if (minutesPerDay === 0) return []

  const usages = entries.map((entry) => ({
    date: entry.work_date,
    days: (entry.credited_min ?? 0) / minutesPerDay,
  }))
  if (profile.vacation_used_before_app > 0) {
    usages.push({
      date: addDays(profile.tracking_start, -1),
      days: profile.vacation_used_before_app,
    })
  }
  return usages
}

export function useVacation() {
  return { fetchVacationEntries, addVacationDays, toVacationUsages }
}
