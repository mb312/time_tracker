import { addDays, toIsoDate } from '@/lib/dates'
import type { FirstYearRounding, WorkProfile } from '@/types/profile'

type VacationSettings = Pick<
  WorkProfile,
  'employment_start' | 'vacation_days_per_year' | 'vacation_year' | 'first_year_rounding'
>

export interface VacationUsage {
  date: string
  days: number // 1 = full day, 0.5 = half day
}

interface VacationYear {
  label: string
  start: string
  end: string
  expires: string // end of the second following year
  entitled: number
  remaining: number
}

export interface VacationBalance {
  yearLabel: string
  entitled: number
  carriedOver: number
  taken: number
  planned: number
  left: number
  expiring: { days: number; date: string } | null
}

function addYears(isoDate: string, years: number): string {
  const [year = 0, month = 1, day = 1] = isoDate.split('-').map(Number)
  return toIsoDate(new Date(year + years, month - 1, day, 12))
}

function roundDays(days: number, rounding: FirstYearRounding): number {
  if (rounding === 'up') return Math.ceil(days - 1e-9)
  if (rounding === 'half') return Math.round(days * 2) / 2
  return Math.round(days * 100) / 100
}

// Full months in the first calendar year: start 1 May → 8, start 15 May → 7
function monthsInFirstYear(employmentStart: string): number {
  const month = Number(employmentStart.slice(5, 7))
  const day = Number(employmentStart.slice(8, 10))
  return 12 - (month - 1) - (day > 1 ? 1 : 0)
}

function buildVacationYears(settings: VacationSettings, lastYear: number): VacationYear[] {
  const start = settings.employment_start
  const startYear = Number(start.slice(0, 4))
  const fullEntitlement = settings.vacation_days_per_year
  const years: VacationYear[] = []

  for (let index = 0; startYear + index <= lastYear; index++) {
    if (settings.vacation_year === 'calendar') {
      const year = startYear + index
      const entitled =
        index === 0
          ? roundDays(
              (fullEntitlement * monthsInFirstYear(start)) / 12,
              settings.first_year_rounding,
            )
          : fullEntitlement
      years.push({
        label: String(year),
        start: index === 0 ? start : `${year}-01-01`,
        end: `${year}-12-31`,
        expires: `${year + 2}-12-31`,
        entitled,
        remaining: entitled,
      })
    } else {
      const yearStart = addYears(start, index)
      const shortNextYear = String((startYear + index + 1) % 100).padStart(2, '0')
      years.push({
        label: `${startYear + index}/${shortNextYear}`,
        start: yearStart,
        end: addDays(addYears(start, index + 1), -1),
        expires: addDays(addYears(start, index + 3), -1),
        entitled: fullEntitlement,
        remaining: fullEntitlement,
      })
    }
  }
  return years
}

// Uses the oldest available days first; without enough days the year of the usage goes negative
function allocate(years: VacationYear[], usages: VacationUsage[]): VacationYear[] {
  const result = years.map((year) => ({ ...year, remaining: year.entitled }))
  const sortedUsages = [...usages].sort((a, b) => a.date.localeCompare(b.date))

  for (const usage of sortedUsages) {
    let needed = usage.days
    for (const year of result) {
      if (needed <= 0) break
      const isAvailable = year.start <= usage.date && year.expires >= usage.date
      if (!isAvailable || year.remaining <= 0) continue
      const used = Math.min(year.remaining, needed)
      year.remaining -= used
      needed -= used
    }
    if (needed > 0) {
      const ownYear = result.find((year) => year.start <= usage.date && year.end >= usage.date)
      const fallback = ownYear ?? result.at(-1)
      if (fallback) fallback.remaining -= needed
    }
  }
  return result
}

function sumDays(usages: VacationUsage[]): number {
  return usages.reduce((sum, usage) => sum + usage.days, 0)
}

export function calculateVacationBalance(
  settings: VacationSettings,
  usages: VacationUsage[],
  today: string,
): VacationBalance {
  const lastUsageYear = Math.max(0, ...usages.map((usage) => Number(usage.date.slice(0, 4))))
  const years = buildVacationYears(settings, Math.max(Number(today.slice(0, 4)), lastUsageYear))
  const currentYear = years.find((year) => year.start <= today && year.end >= today) ?? years.at(-1)

  if (!currentYear) {
    return {
      yearLabel: '',
      entitled: 0,
      carriedOver: 0,
      taken: 0,
      planned: 0,
      left: 0,
      expiring: null,
    }
  }

  const isActiveOn = (year: VacationYear, date: string) =>
    year.start <= date && year.expires >= date

  const afterAllUsages = allocate(years, usages)
  const activeToday = afterAllUsages.filter((year) => isActiveOn(year, today))
  const left = activeToday.reduce((sum, year) => sum + year.remaining, 0)

  const beforeCurrentYear = allocate(
    years,
    usages.filter((usage) => usage.date < currentYear.start),
  )
  const carriedOver = beforeCurrentYear
    .filter((year) => year.start < currentYear.start && isActiveOn(year, currentYear.start))
    .reduce((sum, year) => sum + Math.max(0, year.remaining), 0)

  const expiryWarningDate = addDays(today, 92)
  const expiringYear = activeToday.find(
    (year) => year.remaining > 0 && year.expires <= expiryWarningDate,
  )

  return {
    yearLabel: currentYear.label,
    entitled: currentYear.entitled,
    carriedOver,
    taken: sumDays(usages.filter((u) => u.date >= currentYear.start && u.date <= today)),
    planned: sumDays(usages.filter((u) => u.date > today)),
    left,
    expiring: expiringYear ? { days: expiringYear.remaining, date: expiringYear.expires } : null,
  }
}

// 17 → '17', 16.5 → '16.5', 16.6667 → '16.67'
export function formatDays(days: number): string {
  return String(Math.round(days * 100) / 100)
}
