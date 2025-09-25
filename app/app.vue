<template>
  <NuxtLayout>
    <header class="container">
      <nav class="nav">
        <NuxtLink class="nav-link" to="/">{{ t('nav.home') }}</NuxtLink>
        <NuxtLink class="nav-link" to="/suggestion-1">{{ t('nav.suggestion1') }}</NuxtLink>
        <NuxtLink class="nav-link" to="/suggestion-2">{{ t('nav.suggestion2') }}</NuxtLink>
      </nav>
    </header>
    <NuxtRouteAnnouncer />
    <NuxtPage />
  </NuxtLayout>

</template>

<script setup lang="ts">
const { t } = useI18n();
</script>

<style>
/* Global app-level styles (if any) */
</style>
