import { addDays, toIsoDate } from '@/lib/dates'

export interface Holiday {
  date: string
  name: string
}

// Gregorian Easter Sunday (Meeus algorithm)
function easterSunday(year: number): string {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return toIsoDate(new Date(year, month - 1, day))
}

// The 13 statutory public holidays in Austria
export function austrianHolidays(year: number): Holiday[] {
  const easter = easterSunday(year)
  const fixed = (monthDay: string, name: string) => ({ date: `${year}-${monthDay}`, name })

  return [
    fixed('01-01', 'Neujahr'),
    fixed('01-06', 'Heilige Drei Könige'),
    { date: addDays(easter, 1), name: 'Ostermontag' },
    fixed('05-01', 'Staatsfeiertag'),
    { date: addDays(easter, 39), name: 'Christi Himmelfahrt' },
    { date: addDays(easter, 50), name: 'Pfingstmontag' },
    { date: addDays(easter, 60), name: 'Fronleichnam' },
    fixed('08-15', 'Mariä Himmelfahrt'),
    fixed('10-26', 'Nationalfeiertag'),
    fixed('11-01', 'Allerheiligen'),
    fixed('12-08', 'Mariä Empfängnis'),
    fixed('12-25', 'Christtag'),
    fixed('12-26', 'Stefanitag'),
  ]
}

export function holidayName(isoDate: string): string | null {
  const year = Number(isoDate.slice(0, 4))
  return austrianHolidays(year).find((holiday) => holiday.date === isoDate)?.name ?? null
}

// 24 and 31 December
export function isHalfDay(isoDate: string): boolean {
  const monthDay = isoDate.slice(5)
  return monthDay === '12-24' || monthDay === '12-31'
}
