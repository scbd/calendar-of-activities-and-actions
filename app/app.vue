<template>
  <NuxtLayout>
    <header class="container">
      <nav class="nav">
        <NuxtLink class="nav-link" to="/">Home</NuxtLink>
        <NuxtLink class="nav-link" to="/review-designs">Review Designs</NuxtLink>
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