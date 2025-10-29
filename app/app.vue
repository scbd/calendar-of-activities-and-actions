<template>
  <NuxtLayout class="h-100">
    <div class="w-100 h-100">
    <NuxtRouteAnnouncer />
    <NuxtPage />
    </div>
  </NuxtLayout>

</template>

<script setup lang="ts">
const { t } = useI18n();
</script>

<style>
.debug {
  border: 1px solid red;
}

/* Ensure full height for app components */
#__nuxt {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.h-100 {
  height: 100%;
}

/* Global app-level styles (if any) */
</style>
