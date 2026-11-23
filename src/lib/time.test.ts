import { describe, expect, it } from 'vitest'
import {
  durationMinutes,
  endsNextDay,
  formatHours,
  formatHoursMinutes,
  formatSignedHours,
} from '@/lib/time'

describe('time', () => {
  it('formats hours', () => {
    expect(formatHours(7.7)).toBe('7.70 h')
    expect(formatHoursMinutes(7.7)).toBe('7:42')
    expect(formatHoursMinutes(-1.45)).toBe('-1:27')
    expect(formatSignedHours(1.5)).toBe('+1.50 h')
    expect(formatSignedHours(-1.45)).toBe('−1.45 h')
    expect(formatSignedHours(-0.001)).toBe('0.00 h')
  })

  it('calculates durations, also across midnight', () => {
    expect(durationMinutes('18:15', '20:25')).toBe(130)
    expect(durationMinutes('18:15', '00:35')).toBe(380)
    expect(endsNextDay('18:15', '00:35')).toBe(true)
    expect(endsNextDay('08:00', '16:30')).toBe(false)
  })
})
