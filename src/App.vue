<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import TabBar from '@/components/TabBar.vue'
import ToastMessage from '@/components/ToastMessage.vue'

const route = useRoute()
const showTabBar = computed(() => route.name !== 'login')
</script>

<template>
  <main class="page" :class="{ 'page--with-tabs': showTabBar }">
    <RouterView />
  </main>
  <TabBar v-if="showTabBar" />
  <ToastMessage />
</template>
