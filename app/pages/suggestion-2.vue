<template>
  <div class="visually-hidden" aria-live="polite">Redirecting…</div>
  <!-- Page removed: redirecting to Suggestion 1 -->
  <!-- DEV-770: Suggestion 2 route deprecated -->
</template>

<script setup lang="ts">
import { navigateTo } from '#imports';

definePageMeta({
  middleware: [
    () => navigateTo('/suggestion-1')
  ],
});
</script>

<style scoped>
.visually-hidden { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
</style>
