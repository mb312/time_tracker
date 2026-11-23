import { describe, expect, it } from 'vitest'
import { addDays, formatShortRange, isoWeekNumber, isoWeekday, startOfWeek } from '@/lib/dates'

describe('dates', () => {
  it('adds days across month, year and daylight saving changes', () => {
    expect(addDays('2026-03-28', 1)).toBe('2026-03-29')
    expect(addDays('2026-10-24', 1)).toBe('2026-10-25')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
  })

  it('finds weekday and week start', () => {
    expect(isoWeekday('2026-11-23')).toBe(1)
    expect(isoWeekday('2026-11-29')).toBe(7)
    expect(startOfWeek('2026-11-29')).toBe('2026-11-23')
  })

  it('uses ISO week numbers, including week 53', () => {
    expect(isoWeekNumber('2026-11-23')).toBe(48)
    expect(isoWeekNumber('2027-01-01')).toBe(53)
    expect(isoWeekNumber('2027-01-04')).toBe(1)
  })

  it('formats short ranges', () => {
    expect(formatShortRange('2026-11-23', '2026-11-29')).toBe('23–29 Nov')
    expect(formatShortRange('2026-11-30', '2026-12-06')).toBe('30 Nov – 6 Dec')
  })
})
