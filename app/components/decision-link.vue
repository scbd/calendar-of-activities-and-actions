<template>
  <NuxtLink
    v-if="href && isInternal"
    :to="href"
    class="decision-link"
  >
    <slot>{{ displayLabel }}</slot>
  </NuxtLink>
  <a
    v-else-if="href"
    :href="href"
    class="decision-link"
    :target="isExternal ? '_blank' : undefined"
    :rel="isExternal ? 'noopener noreferrer' : undefined"
  >
    <slot>{{ displayLabel }}</slot>
  </a>
  <span v-else class="decision-link">
    <slot>{{ displayLabel }}</slot>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { isExternalUrl, isInternalUrl, normalizeUrl } from 'shared/utils/url';

const props = defineProps<{ href?: string; label?: string }>();

const sanitizedHref = computed(() => normalizeUrl(props.href ?? null));

const href = computed(() => sanitizedHref.value);

const isInternal = computed(() => Boolean(href.value && isInternalUrl(href.value)));
const isExternal = computed(() => Boolean(href.value && isExternalUrl(href.value)));

const displayLabel = computed(() => props.label ?? href.value ?? '');
</script>

<style scoped>
.decision-link {
  color: inherit;
  text-decoration: underline;
}

.decision-link:hover,
.decision-link:focus {
  text-decoration: none;
}
</style>
