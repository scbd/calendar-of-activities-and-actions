<template>
  <NuxtLink
    v-if="resolvedHref && isInternal"
    :to="resolvedHref"
    class="decision-link"
  >
    <slot>{{ displayLabel }}</slot>
  </NuxtLink>
  <a
    v-else-if="resolvedHref"
    :href="resolvedHref"
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
import { resolveDecisionHrefWithFallback } from 'shared/utils/decision-links';
import { isExternalUrl, isInternalUrl } from 'shared/utils/url';

const props = defineProps<{ href?: string; label?: string }>();

const resolvedHref = computed(() => resolveDecisionHrefWithFallback(props.href ?? null, props.label ?? null));

const isInternal = computed(() => Boolean(resolvedHref.value && isInternalUrl(resolvedHref.value)));
const isExternal = computed(() => Boolean(resolvedHref.value && isExternalUrl(resolvedHref.value)));

const displayLabel = computed(() => props.label ?? resolvedHref.value ?? '');
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
