<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { signIn } = useAuth()

const email = ref('')
const password = ref('')
const errorMessage = ref('')
const isLoading = ref(false)

async function submit() {
  errorMessage.value = ''
  isLoading.value = true
  try {
    await signIn(email.value, password.value)
    await router.replace({ name: 'day' })
  } catch {
    errorMessage.value = 'Login failed. Please check email and password.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <form class="login" @submit.prevent="submit">
    <h1>Time Tracker</h1>

    <label class="field">
      <span>Email</span>
      <input v-model="email" type="email" autocomplete="email" required />
    </label>

    <label class="field">
      <span>Password</span>
      <input v-model="password" type="password" autocomplete="current-password" required />
    </label>

    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

    <button class="button button--primary" type="submit" :disabled="isLoading">
      {{ isLoading ? 'Logging in…' : 'Log in' }}
    </button>
  </form>
</template>

<style scoped>
.login {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 360px;
  margin: 15vh auto 0;
}

h1 {
  text-align: center;
}
</style>
