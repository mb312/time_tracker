<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { signIn } = useAuth()

const username = ref('')
const password = ref('')
const errorMessage = ref('')
const isLoading = ref(false)

async function submit() {
  errorMessage.value = ''
  isLoading.value = true
  try {
    await signIn(username.value, password.value)
    await router.replace({ name: 'day' })
  } catch {
    errorMessage.value = 'Login failed. Please check username and password.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <form class="login" @submit.prevent="submit">
    <h1>Time Tracker</h1>

    <!-- name + autocomplete let iOS save and fill the login -->
    <label class="field">
      <span>Username</span>
      <input
        v-model="username"
        name="username"
        type="text"
        autocomplete="username"
        autocapitalize="none"
        autocorrect="off"
        spellcheck="false"
        required
      />
    </label>

    <label class="field">
      <span>Password</span>
      <input
        v-model="password"
        name="password"
        type="password"
        autocomplete="current-password"
        required
      />
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
  gap: var(--space-4);
  max-width: 360px;
  margin: 15vh auto 0;
}

h1 {
  text-align: center;
}
</style>
