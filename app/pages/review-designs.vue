<template>
  <div class="visually-hidden" aria-live="polite">Redirecting…</div>
  <!-- Page removed: redirecting to home -->
  <!-- DEV-770: Review Designs route deprecated -->
  <!-- i18n could be applied in future if needed -->
  <!-- Keeping minimal template for accessibility -->
  
</template>

<script setup lang="ts">
import { navigateTo } from '#imports';

definePageMeta({
  middleware: [
    () => navigateTo('/')
  ],
});
</script>

<style scoped>
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
