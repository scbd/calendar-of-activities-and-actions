<template>
  <div>
    <h1>App Loaded</h1>
    <NuxtRouteAnnouncer />
    <CalendarActivitiesActions />
  </div>
</template>

<script setup lang="ts">
import CalendarActivitiesActions from './components/calendar-activities-actions.vue';
</script>

<style>
/* Custom styles can go here if needed */
</style>