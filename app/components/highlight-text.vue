<template>
  <span v-if="!normalizedQuery" class="highlight-text">{{ text }}</span>
  <span v-else class="highlight-text" v-html="highlightedHtml" />
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  /** The plain text to display. */
  text: string;
  /** The search query to highlight. Empty/undefined means no highlighting. */
  query?: string;
}>();

/** Trimmed, lowercased query — falsy when nothing to highlight. */
const normalizedQuery = computed(() => props.query?.trim() || '');

/**
 * Escapes special HTML characters so injected text is safe for `v-html`.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Escapes special regex characters in the query string.
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Build highlighted HTML by wrapping every occurrence of the query in a
 * `<mark>` tag with a yellow background.
 */
const highlightedHtml = computed(() => {
  const q = normalizedQuery.value;

  if (!q) {
    return escapeHtml(props.text);
  }

  const regex = new RegExp(`(${escapeRegex(q)})`, 'gi');
  const parts = props.text.split(regex);

  return parts
    .map((part) => {
      if (part.toLowerCase() === q.toLowerCase()) {
        return `<mark class="search-highlight">${escapeHtml(part)}</mark>`;
      }
      return escapeHtml(part);
    })
    .join('');
});
</script>

<style scoped>
.highlight-text :deep(.search-highlight),
:deep(.search-highlight) {
  background-color: #fff3cd;
  padding: 0.1em 0.15em;
  border-radius: 2px;
}
</style>
