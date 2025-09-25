<template>
  <div class="container py-5">
    <h1 class="display-5 mb-3">{{ t('home.title') }}</h1>
    <p class="lead">{{ t('home.lead') }}</p>
    <p>{{ t('home.description') }}</p>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n();
</script>
