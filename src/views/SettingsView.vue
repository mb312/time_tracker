<script setup lang="ts">
import { useRouter } from 'vue-router'
import WorkProfileForm from '@/components/WorkProfileForm.vue'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { session, signOut } = useAuth()

async function logOut() {
  await signOut()
  await router.replace({ name: 'login' })
}
</script>

<template>
  <h1>Settings</h1>

  <WorkProfileForm />

  <section class="card account">
    <h2>Account</h2>
    <p class="muted">Logged in as {{ session?.user.email }}</p>
    <button class="button" type="button" @click="logOut">Log out</button>
  </section>
</template>

<style scoped>
.account {
  margin-top: 24px;
}
</style>
