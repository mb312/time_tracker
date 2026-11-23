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

// Accepts a username (looked up in the database) or an email address
async function signIn(login: string, password: string): Promise<void> {
  let email = login.trim()
  if (!email.includes('@')) {
    const { data, error } = await supabase.rpc('login_email', { login_name: email })
    if (error || !data) throw new Error('Unknown username')
    email = data as string
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
}

async function signOut(): Promise<void> {
  await supabase.auth.signOut()
}

export function useAuth() {
  return { session, loadSession, signIn, signOut }
}
