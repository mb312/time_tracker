import { addDays, isoWeekday } from '@/lib/dates'
import { holidayName } from '@/lib/holidays'
import { targetHoursForDay } from '@/lib/targets'
import type { DailyTotal } from '@/types/entry'
import type { WorkProfile } from '@/types/profile'

export interface PeriodSummary {
  targetHours: number // whole period
  workedHours: number // work entries (+ hours before the app, see below)
  vacationHours: number
  balanceToDate: number // worked + vacation − target, up to today
  stillToWork: number | null // only for periods that are still running
  workdaysLeft: number // after today
  holidayWorkdays: number // public holidays on regular workdays
}

// Days before tracking_start don't count, except in periods covering the whole time before
// the app (employment start up to tracking start): those include the Excel starting values.
export function summarizePeriod(
  fromDate: string,
  toDate: string,
  totals: DailyTotal[],
  profile: WorkProfile,
  today: string,
): PeriodSummary {
  const totalsByDate = new Map(totals.map((total) => [total.work_date, total]))
  const includesStartingValues =
    fromDate <= profile.employment_start && toDate >= profile.tracking_start

  let targetHours = 0
  let targetToDate = 0
  let workedMinutes = 0
  let vacationMinutes = 0
  let doneToDateMinutes = 0
  let workdaysLeft = 0
  let holidayWorkdays = 0

  for (let date = fromDate; date <= toDate; date = addDays(date, 1)) {
    if (holidayName(date) && profile.work_days.includes(isoWeekday(date))) holidayWorkdays++

    const total = totalsByDate.get(date)
    const dayMinutes = (total?.work_min ?? 0) + (total?.vacation_min ?? 0)
    workedMinutes += total?.work_min ?? 0
    vacationMinutes += total?.vacation_min ?? 0
    if (date <= today) doneToDateMinutes += dayMinutes

    if (date < profile.tracking_start) continue
    const target = targetHoursForDay(date, profile)
    targetHours += target
    if (date <= today) targetToDate += target
    else if (target > 0) workdaysLeft++
  }

  let workedHours = workedMinutes / 60
  let balanceToDate = doneToDateMinutes / 60 - targetToDate

  if (includesStartingValues) {
    workedHours += profile.hours_before_app
    balanceToDate += profile.balance_before_app
    // Target before the app = hours worked then minus the overtime built up then
    targetHours += profile.hours_before_app - profile.balance_before_app
  }

  const isRunning = toDate > today
  const stillToWork = isRunning ? targetHours - workedHours - vacationMinutes / 60 : null

  return {
    targetHours,
    workedHours,
    vacationHours: vacationMinutes / 60,
    balanceToDate,
    stillToWork,
    workdaysLeft,
    holidayWorkdays,
  }
}

// '6 months 22 days' between two dates
export function formatTimeEmployed(startDate: string, today: string): string {
  const [startYear = 0, startMonth = 1, startDay = 1] = startDate.split('-').map(Number)
  const [year = 0, month = 1, day = 1] = today.split('-').map(Number)

  let months = (year - startYear) * 12 + (month - startMonth)
  let days = day - startDay
  if (days < 0) {
    months--
    days += new Date(year, month - 1, 0).getDate() // days in the previous month
  }

  const parts = []
  const years = Math.floor(months / 12)
  months %= 12
  if (years > 0) parts.push(`${years} ${years === 1 ? 'year' : 'years'}`)
  if (months > 0) parts.push(`${months} ${months === 1 ? 'month' : 'months'}`)
  if (days > 0 || parts.length === 0) parts.push(`${days} ${days === 1 ? 'day' : 'days'}`)
  return parts.join(' ')
}
