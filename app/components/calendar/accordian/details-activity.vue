<template>
  <div class="row ">
    <!-- Status narrative -->
    <div v-if="statusNarrative" class="calendar-detail-section col">
      <div class="calendar-detail-label">{{ t('calendar.labels.statusNarrative') }}</div>
      <div class="calendar-detail-content">{{ statusNarrative }}</div>
    </div>

    <!-- Description -->
    <div v-if="description" class="calendar-detail-section col">
      <div class="calendar-detail-label">{{ t('calendar.labels.description') }}</div>
      <div class="calendar-detail-content">{{ description }}</div>
    </div>

    <!-- Governing bodies -->
    <div v-if="governingBodies.length" class="calendar-detail-section col-md-6 col-sm-12">
      <div class="calendar-detail-label">{{ governingBodies.length > 1 ? t('calendar.labels.governingBodies') : t('calendar.labels.governingBody') }}</div>
      <ExpandablePillList
        class="calendar-pill-row"
        :items="governingBodies"
      />
    </div>

    <!-- Subsidiary bodies -->
    <div v-if="subsidiaryBodies.length" class="calendar-detail-section col-md-6 col-sm-12">
      <div class="calendar-detail-label">{{ subsidiaryBodies.length > 1 ? t('calendar.labels.subsidiaryBodies') : t('calendar.labels.subsidiaryBody') }}</div>
      <ExpandablePillList
        class="calendar-pill-row"
        :items="subsidiaryBodies"
      />
    </div>

    <!-- GBF Sections -->
    <div v-if="gbfSections.length" class="calendar-detail-section col-md-6 col-sm-12">
      <div class="calendar-detail-label">{{ gbfSections.length > 1 ? t('calendar.labels.gbfSections') : t('calendar.labels.gbfSection') }}</div>
      <ExpandablePillList
        class="calendar-pill-row"
        :items="gbfSections"
      />
    </div>

    <!-- Global Targets -->
    <div v-if="globalTargets.length" class="calendar-detail-section col-md-6 col-sm-12">
      <div class="calendar-detail-label">{{ globalTargets.length > 1 ? t('calendar.labels.globalTargets') : t('calendar.labels.globalTarget') }}</div>
      <ExpandablePillList
        class="calendar-pill-row calendar-pill-row--gbf-targets"
        :items="globalTargets"
        :max-visible="10"
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
    <div v-if="decisionEntries.length" class="calendar-detail-section col-md-6 col-sm-12">
      <div class="calendar-detail-label">{{ decisionEntries.length > 1 ? t('calendar.labels.decisions') : t('calendar.labels.decision') }}</div>
      <ExpandablePillList
        class="calendar-pill-row"
        :items="decisionLabels"
      >
        <template #default="{ item, index }">
          <DecisionLink :href="decisionEntries[index].href" :label="item" />
        </template>
      </ExpandablePillList>
    </div>

    <!-- Subjects -->
    <div v-if="subjectLabels.length" class="calendar-detail-section col-md-6 col-sm-12">
      <div class="calendar-detail-label">{{ subjectLabels.length > 1 ? t('calendar.labels.subjects') : t('calendar.labels.subject') }}</div>
      <ExpandablePillList
        class="calendar-pill-row"
        :items="subjectLabels"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from '#imports';
import ExpandablePillList from '../../expandable-pill-list.vue';
import DecisionLink from '../../decision-link.vue';
import type { DecisionEntry } from 'shared/utils/decision-links';

const _props = defineProps<{
  statusNarrative?: string | null;
  symbol?: string;
  description?: string;
  subjectLabels: string[];
  subsidiaryBodies: string[];
  governingBodies: string[];
  gbfSections: string[];
  globalTargets: string[];
  decisionEntries: DecisionEntry[];
  responsibleUnit?: string;
  responsibleOfficer?: string;
  showResponsible: boolean;
}>();

const { t } = useI18n();

const decisionLabels = computed(() => _props.decisionEntries.map((e) => e.label));

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
  margin-bottom: .5rem;
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
