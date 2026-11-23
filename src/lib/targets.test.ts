import { describe, expect, it } from 'vitest'
import { austrianHolidays } from '@/lib/holidays'
import { dailyTargetHours, targetHoursForDay } from '@/lib/targets'
import { testProfile } from '@/lib/testProfile'

describe('holidays', () => {
  it('calculates the Easter-based holidays', () => {
    const dates2026 = austrianHolidays(2026).map((holiday) => holiday.date)
    expect(dates2026).toContain('2026-04-06') // Ostermontag
    expect(dates2026).toContain('2026-05-14') // Christi Himmelfahrt
    expect(dates2026).toContain('2026-05-25') // Pfingstmontag
    expect(dates2026).toContain('2026-06-04') // Fronleichnam

    const dates2027 = austrianHolidays(2027).map((holiday) => holiday.date)
    expect(dates2027).toContain('2027-03-29')
    expect(dates2027).toHaveLength(13)
  })
})

describe('targets', () => {
  it('splits the weekly hours over the workdays', () => {
    expect(dailyTargetHours(testProfile)).toBeCloseTo(7.7)
  })

  it('gives 0 on weekends and holidays, half on 24/31 Dec', () => {
    expect(targetHoursForDay('2026-11-23', testProfile)).toBeCloseTo(7.7)
    expect(targetHoursForDay('2026-11-22', testProfile)).toBe(0)
    expect(targetHoursForDay('2026-12-08', testProfile)).toBe(0)
    expect(targetHoursForDay('2026-12-24', testProfile)).toBeCloseTo(3.85)
    expect(targetHoursForDay('2026-12-31', testProfile)).toBeCloseTo(3.85)
  })

  it('treats 24/31 Dec as full days when the setting is off', () => {
    const profile = { ...testProfile, half_days_dec_24_31: false }
    expect(targetHoursForDay('2026-12-24', profile)).toBeCloseTo(7.7)
  })
})
