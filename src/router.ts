import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import LoginView from '@/views/LoginView.vue'
import DayView from '@/views/DayView.vue'
import WeekView from '@/views/WeekView.vue'
import MonthView from '@/views/MonthView.vue'
import SettingsView from '@/views/SettingsView.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: { name: 'day' } },
    { path: '/login', name: 'login', component: LoginView },
    { path: '/day/:date?', name: 'day', component: DayView },
    { path: '/week/:date?', name: 'week', component: WeekView },
    { path: '/month/:month?', name: 'month', component: MonthView },
    { path: '/settings', name: 'settings', component: SettingsView },
    { path: '/:pathMatch(.*)*', redirect: { name: 'day' } },
  ],
})

// Everything except the login screen needs a session
router.beforeEach(async (to) => {
  const { session, loadSession } = useAuth()
  await loadSession()

  const isLoggedIn = session.value !== null
  if (!isLoggedIn && to.name !== 'login') return { name: 'login' }
  if (isLoggedIn && to.name === 'login') return { name: 'day' }
})
