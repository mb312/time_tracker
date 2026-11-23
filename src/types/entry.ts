export type EntryKind = 'work' | 'vacation'

// Mirrors the time_entries table
export interface TimeEntry {
  id: string
  work_date: string // 'YYYY-MM-DD'
  kind: EntryKind
  start_time: string | null // 'HH:MM:SS'
  end_time: string | null
  credited_min: number | null
  description: string
  duration_min: number | null
}

// Row of the description_stats view
export interface DescriptionStat {
  description: string
  times_used: number
  last_used: string
}

// Row of the daily_totals view
export interface DailyTotal {
  work_date: string
  work_min: number
  vacation_min: number
}

export interface WorkEntryInput {
  id?: string
  work_date: string
  start_time: string // 'HH:MM'
  end_time: string
  description: string
}
