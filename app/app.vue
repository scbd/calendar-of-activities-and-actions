<template>
  <div>
    <h1>App Loaded</h1>
    <NuxtRouteAnnouncer />
    <CalendarActivitiesActions />
  </div>
</template>

<script setup lang="ts">
import CalendarActivitiesActions from './components/calendar-activities-actions.vue';

console.log('App.vue loaded');
</script>