<template>
  <div ref="root" class="expandable-pill-list">
    <span
      v-for="(item, index) in displayedItems"
      :key="`${item}-${index}`"
      :class="pillClasses"
    >
      <slot :item="item" :index="index"><HighlightText :text="item" :query="query" /></slot>
    </span>
    <button
      v-if="showToggle"
      type="button"
      class="expandable-pill-list__toggle"
      :class="pillClasses"
      @click.stop="expand"
    >
      ...
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue';
import HighlightText from './highlight-text.vue';

const props = defineProps<{
  items: string[];
  maxVisible?: number;
  pillClass?: string | string[] | Record<string, boolean>;
  /** Optional search query – forwarded to HighlightText for highlighting. */
  query?: string;
}>();

const root = ref<HTMLElement>();
const isExpanded = ref(false);

const resolvedMaxVisible = computed(() => props.maxVisible ?? 3);
const pillClasses = computed(() => props.pillClass ?? 'calendar-pill');
const hasOverflow = computed(() => props.items.length > resolvedMaxVisible.value);

const displayedItems = computed(() => {
  if (!hasOverflow.value) {
    return props.items;
  }
  return isExpanded.value ? props.items : props.items.slice(0, resolvedMaxVisible.value);
});

const showToggle = computed(() => hasOverflow.value && !isExpanded.value);

const collapse = () => {
  if (isExpanded.value) {
    isExpanded.value = false;
  }
};

const expand = () => {
  if (hasOverflow.value) {
    isExpanded.value = true;
  }
};

const handleClickOutside = (event: MouseEvent) => {
  if (!isExpanded.value) {
    return;
  }
  const element = root.value;

  if (!element) {
    return;
  }
  if (element.contains(event.target as Node)) {
    return;
  }
  collapse();
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});

watch(
  () => props.items,
  () => {
    collapse();
  },
  { deep: true },
);

watch(() => props.items.length, () => {
  if (props.items.length <= resolvedMaxVisible.value) {
    collapse();
  }
});

watch(resolvedMaxVisible, () => {
  if (props.items.length <= resolvedMaxVisible.value) {
    collapse();
  }
});
</script>

<style scoped>
.expandable-pill-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.expandable-pill-list__toggle {
  border: none;
  cursor: pointer;
  font: inherit;
}
</style>
