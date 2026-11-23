import { describe, expect, it } from 'vitest'
import { addDays } from '@/lib/dates'
import { testProfile } from '@/lib/testProfile'
import { calculateVacationBalance, type VacationUsage } from '@/lib/vacation'

function fullDays(fromDate: string, count: number): VacationUsage[] {
  return Array.from({ length: count }, (_, index) => ({ date: addDays(fromDate, index), days: 1 }))
}

// 12 days taken in 2026
const used2026 = [
  ...fullDays('2026-11-09', 5),
  ...fullDays('2026-08-03', 5),
  ...fullDays('2026-07-09', 2),
]

describe('vacation balance', () => {
  it('gives a pro-rata first year, rounded up', () => {
    const balance = calculateVacationBalance(testProfile, [], '2026-11-23')
    expect(balance.entitled).toBe(17)
    expect(balance.left).toBe(17)
  })

  it('supports half-day and exact rounding', () => {
    const half = { ...testProfile, first_year_rounding: 'half' as const }
    const exact = { ...testProfile, first_year_rounding: 'exact' as const }
    expect(calculateVacationBalance(half, [], '2026-11-23').entitled).toBe(16.5)
    expect(calculateVacationBalance(exact, [], '2026-11-23').entitled).toBe(16.67)
  })

  it('counts taken and planned days', () => {
    const usages = [...used2026, ...fullDays('2026-12-21', 3)]
    const balance = calculateVacationBalance(testProfile, usages, '2026-11-23')
    expect(balance).toMatchObject({ taken: 12, planned: 3, left: 2 })
  })

  it('carries days over and uses the oldest first', () => {
    const usages = [...used2026, ...fullDays('2026-12-21', 3), ...fullDays('2027-02-15', 5)]
    const balance = calculateVacationBalance(testProfile, usages, '2027-01-10')
    expect(balance).toMatchObject({ entitled: 25, carriedOver: 2, planned: 5, left: 22 })
  })

  it('warns before days expire and drops them after 2 years', () => {
    const october2028 = calculateVacationBalance(testProfile, used2026, '2028-10-15')
    expect(october2028.expiring).toEqual({ days: 5, date: '2028-12-31' })
    expect(october2028.left).toBe(55)

    const january2029 = calculateVacationBalance(testProfile, used2026, '2029-01-05')
    expect(january2029.left).toBe(75)
    expect(january2029.expiring).toBeNull()
  })

  it('goes negative when more days are taken than available', () => {
    const balance = calculateVacationBalance(testProfile, fullDays('2026-06-01', 20), '2026-11-23')
    expect(balance.left).toBe(-3)
  })
})
