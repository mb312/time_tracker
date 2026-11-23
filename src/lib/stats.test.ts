import { describe, expect, it } from 'vitest'
import { addDays } from '@/lib/dates'
import { formatTimeEmployed, summarizePeriod } from '@/lib/stats'
import { testProfile } from '@/lib/testProfile'
import type { DailyTotal } from '@/types/entry'

function days(fromDate: string, count: number, minutes: number, kind: 'work' | 'vacation') {
  return Array.from({ length: count }, (_, index) => ({
    work_date: addDays(fromDate, index),
    work_min: kind === 'work' ? minutes : 0,
    vacation_min: kind === 'vacation' ? minutes : 0,
  }))
}

// November 2026 up to Monday 23 Nov: one vacation week, the rest worked
const november: DailyTotal[] = [
  ...days('2026-11-02', 5, 462, 'work'),
  ...days('2026-11-09', 5, 462, 'vacation'),
  ...days('2026-11-16', 5, 480, 'work'),
  ...days('2026-11-23', 1, 465, 'work'),
]

describe('period summary', () => {
  it('calculates a running month', () => {
    const summary = summarizePeriod('2026-11-01', '2026-11-30', november, testProfile, '2026-11-23')
    expect(summary.targetHours).toBeCloseTo(161.7) // 21 workdays × 7.7 h
    expect(summary.workedHours).toBeCloseTo(86.25)
    expect(summary.vacationHours).toBeCloseTo(38.5)
    expect(summary.balanceToDate).toBeCloseTo(1.55) // 124.75 h done − 16 × 7.7 h
    expect(summary.stillToWork).toBeCloseTo(36.95)
    expect(summary.workdaysLeft).toBe(5)
  })

  it('has no "still to work" for a finished period', () => {
    const summary = summarizePeriod('2026-11-01', '2026-11-30', november, testProfile, '2026-12-05')
    expect(summary.stillToWork).toBeNull()
  })

  it('counts public holidays on workdays and gives them no target', () => {
    const summary = summarizePeriod('2026-12-07', '2026-12-13', [], testProfile, '2026-11-23')
    expect(summary.holidayWorkdays).toBe(1) // 8 Dec
    expect(summary.targetHours).toBeCloseTo(4 * 7.7)
  })

  it('adds the starting values for periods from the employment start', () => {
    const profile = { ...testProfile, hours_before_app: 900, balance_before_app: 10 }
    const summary = summarizePeriod('2026-05-01', '2026-11-23', november, profile, '2026-11-23')
    expect(summary.workedHours).toBeCloseTo(986.25)
    expect(summary.balanceToDate).toBeCloseTo(11.55)
    expect(summary.targetHours).toBeCloseTo(123.2 + 890)
  })

  it('leaves the starting values out of single months before the app', () => {
    const profile = { ...testProfile, hours_before_app: 900, balance_before_app: 10 }
    const may = summarizePeriod('2026-05-01', '2026-05-31', [], profile, '2026-11-23')
    expect(may.workedHours).toBe(0)
    expect(may.balanceToDate).toBe(0)
  })
})

describe('time employed', () => {
  it('counts full months and remaining days', () => {
    expect(formatTimeEmployed('2026-05-01', '2026-11-23')).toBe('6 months 22 days')
    expect(formatTimeEmployed('2026-05-15', '2026-11-03')).toBe('5 months 19 days')
    expect(formatTimeEmployed('2026-05-01', '2027-05-01')).toBe('1 year')
    expect(formatTimeEmployed('2026-05-01', '2026-05-01')).toBe('0 days')
  })
})
