import { supabase } from '@/lib/supabase'
import type { DailyTotal } from '@/types/entry'

const PAGE_SIZE = 1000 // Supabase returns at most 1000 rows per request

// Work and vacation minutes per day between two dates (inclusive)
async function fetchDailyTotals(fromDate: string, toDate: string): Promise<DailyTotal[]> {
  const totals: DailyTotal[] = []

  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await supabase
      .from('daily_totals')
      .select('*')
      .gte('work_date', fromDate)
      .lte('work_date', toDate)
      .order('work_date')
      .range(offset, offset + PAGE_SIZE - 1)
    if (error) throw error

    totals.push(...(data as DailyTotal[]))
    if (data.length < PAGE_SIZE) return totals
  }
}

export function useStats() {
  return { fetchDailyTotals }
}
