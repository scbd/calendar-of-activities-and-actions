<template>
  <NuxtLayout>
    <header class="container">
      <nav class="nav">
        <NuxtLink class="nav-link" to="/">Home</NuxtLink>
        <NuxtLink class="nav-link" to="/suggestion-1">Suggestion 1</NuxtLink>
        <NuxtLink class="nav-link" to="/suggestion-2">Suggestion 2</NuxtLink>
      </nav>
    </header>
    <NuxtRouteAnnouncer />
    <NuxtPage />
  </NuxtLayout>

</template>

<script setup lang="ts">
// Root app wrapper; route content is rendered via <NuxtPage />
</script>

<style>
/* Global app-level styles (if any) */
</style>
