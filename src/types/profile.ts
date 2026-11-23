export type VacationYear = 'calendar' | 'anniversary'
export type FirstYearRounding = 'up' | 'half' | 'exact'

// Mirrors the work_profile table (without user_id / updated_at)
export interface WorkProfile {
  username: string | null // for logging in instead of the email
  employment_start: string
  weekly_hours: number
  work_days: number[] // ISO weekdays, 1 = Monday … 7 = Sunday
  vacation_days_per_year: number
  vacation_year: VacationYear
  first_year_rounding: FirstYearRounding
  half_days_dec_24_31: boolean
  tracking_start: string
  hours_before_app: number
  balance_before_app: number
  vacation_used_before_app: number
}
