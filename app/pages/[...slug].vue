<template>
  <div>
    <NuxtRouteAnnouncer />
    <div class="pilot-banner">
      {{ t('scbd.pilotRelease') }}
    </div>
    <section class="calendar-container">
      <div class="container-fluid py-3">
        <!-- Page Title and Decision Quote -->
        <h1 class="mb-3">Calendar of Activities and Actions</h1>

        <hr class="mb-4">

        <CalendarIndex />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from '#imports';
import CalendarIndex from '../components/calendar/index.vue';

const { t } = useI18n();
</script>

<style scoped>
.pilot-banner {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1050;
  background-color: #9b59b6;
  color: #fff;
  text-align: center;
  font-weight: 700;
  font-size: 0.875rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 0.35rem 0;
}

.calendar-container {
  padding-top: 2rem;
  margin-top: var(--pilot-banner-height, 1.95rem);
}
</style>
