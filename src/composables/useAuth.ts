import { ref } from 'vue'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

const session = ref<Session | null>(null)
let loadingSession: Promise<void> | null = null

// Loads the stored session once and keeps it in sync afterwards
function loadSession(): Promise<void> {
  loadingSession ??= supabase.auth.getSession().then(({ data }) => {
    session.value = data.session
    supabase.auth.onAuthStateChange((_event, newSession) => {
      session.value = newSession
    })
  })
  return loadingSession
}

async function signIn(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
}

async function signOut(): Promise<void> {
  await supabase.auth.signOut()
}

export function useAuth() {
  return { session, loadSession, signIn, signOut }
}
