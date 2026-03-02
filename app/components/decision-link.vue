<template>
  <NuxtLink
    v-if="resolvedHref && isInternal"
    :to="resolvedHref"
    class="decision-link"
  >
    <slot><HighlightText :text="displayLabel" :query="query" /></slot>
  </NuxtLink>
  <a
    v-else-if="resolvedHref"
    :href="resolvedHref"
    class="decision-link"
    :target="isExternal ? '_blank' : undefined"
    :rel="isExternal ? 'noopener noreferrer' : undefined"
  >
    <slot><HighlightText :text="displayLabel" :query="query" /></slot>
  </a>
  <span v-else class="decision-link">
    <slot><HighlightText :text="displayLabel" :query="query" /></slot>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { resolveDecisionHrefWithFallback } from 'shared/utils/decision-links';
import { isExternalUrl, isInternalUrl } from 'shared/utils/url';
import HighlightText from './highlight-text.vue';

const props = defineProps<{ href?: string; label?: string; query?: string }>();

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
