import type { WorkProfile } from '@/types/profile'

// Shared test data: the real contract (start 1 May 2026, 38.5 h, 25 days)
export const testProfile: WorkProfile = {
  username: null,
  employment_start: '2026-05-01',
  weekly_hours: 38.5,
  work_days: [1, 2, 3, 4, 5],
  vacation_days_per_year: 25,
  vacation_year: 'calendar',
  first_year_rounding: 'up',
  half_days_dec_24_31: true,
  tracking_start: '2026-11-01',
  hours_before_app: 0,
  balance_before_app: 0,
  vacation_used_before_app: 0,
}
