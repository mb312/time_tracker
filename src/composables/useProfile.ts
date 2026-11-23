import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { todayIso } from '@/lib/dates'
import type { WorkProfile } from '@/types/profile'

// Used until the profile is saved for the first time
export const DEFAULT_PROFILE: WorkProfile = {
  employment_start: '2026-05-01',
  weekly_hours: 38.5,
  work_days: [1, 2, 3, 4, 5],
  vacation_days_per_year: 25,
  vacation_year: 'calendar',
  first_year_rounding: 'up',
  half_days_dec_24_31: true,
  tracking_start: todayIso(),
  hours_before_app: 0,
  balance_before_app: 0,
  vacation_used_before_app: 0,
}

const profile = ref<WorkProfile | null>(null)

async function loadProfile(): Promise<void> {
  const { data, error } = await supabase.from('work_profile').select('*').maybeSingle()
  if (error) throw error
  profile.value = data as WorkProfile | null
}

async function saveProfile(values: WorkProfile): Promise<void> {
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) throw new Error('Not logged in')

  const { data, error } = await supabase
    .from('work_profile')
    .upsert({ ...values, user_id: userData.user.id })
    .select('*')
    .single()
  if (error) throw error
  profile.value = data as WorkProfile
}

export function useProfile() {
  return { profile, loadProfile, saveProfile }
}
