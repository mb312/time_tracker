import { isoWeekday } from '@/lib/dates'
import { holidayName, isHalfDay } from '@/lib/holidays'
import type { WorkProfile } from '@/types/profile'

type TargetSettings = Pick<WorkProfile, 'weekly_hours' | 'work_days' | 'half_days_dec_24_31'>

// 38.5 h over 5 workdays → 7.7 h
export function dailyTargetHours(profile: Pick<WorkProfile, 'weekly_hours' | 'work_days'>): number {
  if (profile.work_days.length === 0) return 0
  return profile.weekly_hours / profile.work_days.length
}

// 0 on days off and public holidays, half on 24/31 Dec
export function targetHoursForDay(isoDate: string, profile: TargetSettings): number {
  if (!profile.work_days.includes(isoWeekday(isoDate))) return 0
  if (holidayName(isoDate)) return 0

  const dailyTarget = dailyTargetHours(profile)
  if (profile.half_days_dec_24_31 && isHalfDay(isoDate)) return dailyTarget / 2
  return dailyTarget
}
