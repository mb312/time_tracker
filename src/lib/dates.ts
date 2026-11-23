// Dates are passed around as 'YYYY-MM-DD' strings, always in local time.

export function toIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function todayIso(): string {
  return toIsoDate(new Date())
}

// Noon avoids off-by-one errors around daylight saving changes
function parseIsoDate(isoDate: string): Date {
  return new Date(`${isoDate}T12:00:00`)
}

export function addDays(isoDate: string, days: number): string {
  const date = parseIsoDate(isoDate)
  date.setDate(date.getDate() + days)
  return toIsoDate(date)
}

// 1 = Monday … 7 = Sunday
export function isoWeekday(isoDate: string): number {
  const day = parseIsoDate(isoDate).getDay()
  return day === 0 ? 7 : day
}

export function startOfWeek(isoDate: string): string {
  return addDays(isoDate, 1 - isoWeekday(isoDate))
}

// ISO 8601: the week belongs to the year of its Thursday
export function isoWeekNumber(isoDate: string): number {
  const thursday = parseIsoDate(addDays(isoDate, 4 - isoWeekday(isoDate)))
  const firstOfYear = new Date(thursday.getFullYear(), 0, 1, 12)
  return Math.floor((thursday.getTime() - firstOfYear.getTime()) / 86_400_000 / 7) + 1
}

// 'Mon 23'
export function formatDayLabel(isoDate: string): string {
  return parseIsoDate(isoDate).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' })
}

// '23–29 Nov' or '30 Nov – 6 Dec'
export function formatShortRange(fromDate: string, toDate: string): string {
  const from = parseIsoDate(fromDate)
  const to = parseIsoDate(toDate)
  const toText = to.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  if (from.getMonth() === to.getMonth()) return `${from.getDate()}–${toText}`
  return `${from.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${toText}`
}

// Months are passed around as 'YYYY-MM'
export function firstOfMonth(month: string): string {
  return `${month}-01`
}

export function lastOfMonth(month: string): string {
  return addDays(firstOfMonth(addMonths(month, 1)), -1)
}

export function addMonths(month: string, count: number): string {
  const [year = 0, monthNumber = 1] = month.split('-').map(Number)
  return toIsoDate(new Date(year, monthNumber - 1 + count, 1, 12)).slice(0, 7)
}

// 'November 2026'
export function formatMonthTitle(month: string): string {
  return parseIsoDate(firstOfMonth(month)).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  })
}

// 'Mon 23 Nov 2026'
export function formatLongDate(isoDate: string): string {
  return parseIsoDate(isoDate).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
