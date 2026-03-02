<template>
  <div class="calendar-details">
    <!-- Status narrative -->
    <div v-if="statusNarrative" class="calendar-detail-section">
      <div class="calendar-detail-label">{{ t('calendar.labels.statusNarrative') }}</div>
      <div class="calendar-detail-content"><HighlightText :text="statusNarrative ?? ''" :query="searchText" /></div>
    </div>

    <!-- Symbol -->
    <!-- <div v-if="symbol" class="calendar-detail-section">
      <div class="calendar-detail-label">{{ t('calendar.meetings.symbol') }}</div>
      <div class="calendar-detail-content">{{ symbol }}</div>
    </div> -->

    <!-- Description -->
    <div v-if="description" class="calendar-detail-section">
      <div class="calendar-detail-label">{{ t('calendar.labels.description') }}</div>
      <div class="calendar-detail-content"><HighlightText :text="description ?? ''" :query="searchText" /></div>
    </div>

    <!-- Location -->
    <div v-if="location" class="calendar-detail-section">
      <div class="calendar-detail-label">{{ t('calendar.labels.location') }}</div>
      <div class="calendar-detail-content"><HighlightText :text="location ?? ''" :query="searchText" /></div>
    </div>

    <!-- Themes / Thematic Areas -->
    <div v-if="themes.length" class="calendar-detail-section">
      <div class="calendar-detail-label">{{ t('calendar.notifications.themes') }}</div>
      <ExpandablePillList
        class="calendar-pill-row"
        :items="themes"
        :query="searchText"
        pill-class="calendar-pill calendar-pill--muted"
      />
    </div>

    <!-- Governing bodies -->
    <div v-if="governingBodies.length" class="calendar-detail-section">
      <div class="calendar-detail-label">{{ governingBodies.length > 1 ? t('calendar.labels.governingBodies') : t('calendar.labels.governingBody') }}</div>
      <div class="calendar-detail-content"><HighlightText :text="governingBodies.join(', ')" :query="searchText" /></div>
    </div>

    <!-- Subsidiary bodies -->
    <div v-if="subsidiaryBodies.length" class="calendar-detail-section">
      <div class="calendar-detail-label">{{ subsidiaryBodies.length > 1 ? t('calendar.labels.subsidiaryBodies') : t('calendar.labels.subsidiaryBody') }}</div>
      <div class="calendar-detail-content"><HighlightText :text="subsidiaryBodies.join(', ')" :query="searchText" /></div>
    </div>

    <!-- GBF Sections -->
    <div v-if="gbfSections.length" class="calendar-detail-section">
      <div class="calendar-detail-label">{{ t('calendar.labels.gbfSections') }}</div>
      <ExpandablePillList
        class="calendar-pill-row"
        :items="gbfSections"
        :query="searchText"
      />
    </div>

    <!-- Global Targets -->
    <div v-if="globalTargets.length" class="calendar-detail-section">
      <div class="calendar-detail-label">{{ t('calendar.filters.labels.globalTargets') }}</div>
      <ExpandablePillList
        class="calendar-pill-row calendar-pill-row--gbf-targets"
        :items="globalTargets"
        pill-class="calendar-pill calendar-pill--gbf-target"
      >
        <template #default="{ item }">
          <a
            v-if="gbfTargetUrl(item)"
            :href="gbfTargetUrl(item)"
            target="_blank"
            rel="noopener"
            :aria-label="gbfTargetLabel(item)"
          >
            <img
              :src="gbfTargetImageUrl(item)"
              :alt="gbfTargetLabel(item)"
              :title="gbfTargetLabel(item)"
              class="gbf-target-img"
              width="20"
              height="20"
              loading="lazy"
            />
          </a>
          <span v-else>{{ item }}</span>
        </template>
      </ExpandablePillList>
    </div>

    <!-- Decisions -->
    <div v-if="decisionEntries.length" class="calendar-detail-section">
      <div class="calendar-detail-label">{{ t('calendar.labels.decision') }}</div>
      <div class="calendar-detail-content">
        <template
          v-for="(entry, index) in decisionEntries"
          :key="`${entry.href ?? entry.label}-${index}`"
        >
          <DecisionLink :href="entry.href" :label="entry.label" :query="searchText" />
          <span v-if="index < decisionEntries.length - 1">, </span>
        </template>
      </div>
    </div>

    <!-- Subjects -->
    <div v-if="subjectLabels.length" class="calendar-detail-section">
      <div class="calendar-detail-label">{{ t('calendar.labels.subjects') }}</div>
      <ExpandablePillList
        class="calendar-pill-row"
        :items="subjectLabels"
        :query="searchText"
      />
    </div>

    <!-- Meeting Links -->
    <div v-if="urlLinks.length" class="calendar-detail-section calendar-detail-section--actions">
      <div class="calendar-meeting-links">
        <a
          v-for="link in urlLinks"
          :key="link.url"
          :href="link.url"
          target="_blank"
          rel="noopener"
          class="btn btn-outline-primary w-100"
        >
          {{ link.label }}
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from '#imports';
import ExpandablePillList from '../../expandable-pill-list.vue';
import DecisionLink from '../../decision-link.vue';
import HighlightText from '../../highlight-text.vue';
import type { DecisionEntry } from 'shared/utils/decision-links';

interface UrlLink {
  url: string;
  label: string;
}

const props = defineProps<{
  statusNarrative?: string | null;
  symbol?: string;
  description?: string;
  location?: string;
  themes: string[];
  subjectLabels: string[];
  subsidiaryBodies: string[];
  governingBodies: string[];
  gbfSections: string[];
  globalTargets: string[];
  decisionEntries: DecisionEntry[];
  meetingUrls: string[];
  responsibleUnit?: string;
  responsibleOfficer?: string;
  showResponsible: boolean;
  searchText?: string;
}>();

const { t } = useI18n();

/** Classify meeting URLs into labelled links (View Website vs View Documents). */
const urlLinks = computed<UrlLink[]>(() => {
  return props.meetingUrls
    .filter(u => typeof u === 'string' && u.trim())
    .map(url => {
      const trimmed = url.trim();

      if (trimmed.startsWith('https://www.cbd.int/conferences')) {
        return { url: trimmed, label: t('calendar.meetings.viewWebsite') as string };
      }

      if (trimmed.startsWith('https://www.cbd.int/meetings/')) {
        return { url: trimmed, label: t('calendar.meetings.viewDocuments') as string };
      }

      return { url: trimmed, label: t('calendar.meetings.viewDocuments') as string };
    });
});

/**
 * Convert a GBF target identifier (e.g. "GBF-TARGET-01") to the CBD image URL.
 * Returns an empty string when the identifier doesn't match the expected pattern.
 */
function gbfTargetImageUrl(identifier: string): string {
  const match = identifier.match(/GBF-TARGET-(\d+)/i);

  if (!match) {
    return '';
  }

  const num = parseInt(match[1], 10);
  const padded = String(num).padStart(2, '0');

  return `https://www.cbd.int/app/images/gbf-targets/gbf-${padded}-64.png`;
}

/**
 * Derive an accessible label from a GBF target identifier.
 * E.g. "GBF-TARGET-01" → "GBF Target 1".
 */
function gbfTargetLabel(identifier: string): string {
  const match = identifier.match(/GBF-TARGET-(\d+)/i);

  if (!match) {
    return identifier;
  }

  return `GBF Target ${parseInt(match[1], 10)}`;
}

/**
 * Build the external CBD link for a GBF target.
 * E.g. "GBF-TARGET-01" → "https://www.cbd.int/gbf/targets/1".
 */
function gbfTargetUrl(identifier: string): string {
  const match = identifier.match(/GBF-TARGET-(\d+)/i);

  if (!match) {
    return '';
  }

  return `https://www.cbd.int/gbf/targets/${parseInt(match[1], 10)}`;
}
</script>

<style scoped>
.calendar-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
  width: 100%;
}

.calendar-detail-section {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0; /* Prevents grid blowout */
}

.calendar-detail-label {
  flex-shrink: 0;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #6c757d;
  white-space: nowrap;
}



.calendar-detail-content {
  font-size: 0.875rem;
  color: #1f1f1f;
  line-height: 1.5;
  word-wrap: break-word;
  overflow-wrap: break-word;
  padding-left: 0.75rem;
}

.calendar-pill-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding-left: 0.75rem;
}

.calendar-detail-section :deep(.calendar-pill) {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  background-color: #f1f3f5;
  color: #1f1f1f;
  font-size: 0.875rem;
}

.calendar-detail-section :deep(.calendar-pill--muted) {
  background-color: #eef2f6;
  color: #4b5563;
}

.calendar-pill-row--gbf-targets {
  align-items: center;
}

.calendar-pill--gbf-target {
  padding: 0.125rem;
  background-color: transparent;
}

.gbf-target-img {
  display: block;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  object-fit: contain;
}

.calendar-meeting-links {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.calendar-meeting-cta {
  color: #0f7abd;
  font-weight: 500;
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: border-bottom-color 0.2s ease;
}

.calendar-meeting-cta:hover {
  border-bottom-color: #0f7abd;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .calendar-details {
    grid-template-columns: 1fr;
  }

  .calendar-detail-section {
    grid-column: 1;
  }
}
</style>
