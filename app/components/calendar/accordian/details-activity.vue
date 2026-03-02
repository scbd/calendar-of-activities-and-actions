<template>
  <div class="row ">
    <!-- Status narrative -->
    <div v-if="statusNarrative" class="calendar-detail-section col">
      <div class="calendar-detail-label">{{ t('calendar.labels.statusNarrative') }}</div>
      <div class="calendar-detail-content"><HighlightText :text="statusNarrative ?? ''" :query="searchText" /></div>
    </div>

    <!-- Description -->
    <div v-if="description" class="calendar-detail-section col">
      <div class="calendar-detail-label">{{ t('calendar.labels.description') }}</div>
      <div class="calendar-detail-content"><HighlightText :text="description ?? ''" :query="searchText" /></div>
    </div>

    <!-- Governing bodies -->
    <div v-if="governingBodies.length" class="calendar-detail-section col-md-6 col-sm-12">
      <div class="calendar-detail-label">{{ governingBodies.length > 1 ? t('calendar.labels.governingBodies') : t('calendar.labels.governingBody') }}</div>
      <ExpandablePillList
        class="calendar-pill-row"
        :items="governingBodies"
        :query="searchText"
      />
    </div>

    <!-- Subsidiary bodies -->
    <div v-if="subsidiaryBodies.length" class="calendar-detail-section col-md-6 col-sm-12">
      <div class="calendar-detail-label">{{ subsidiaryBodies.length > 1 ? t('calendar.labels.subsidiaryBodies') : t('calendar.labels.subsidiaryBody') }}</div>
      <ExpandablePillList
        class="calendar-pill-row"
        :items="subsidiaryBodies"
        :query="searchText"
      />
    </div>

    <!-- GBF Sections -->
    <div v-if="gbfSections.length" class="calendar-detail-section col-md-6 col-sm-12">
      <div class="calendar-detail-label">{{ gbfSections.length > 1 ? t('calendar.labels.gbfSections') : t('calendar.labels.gbfSection') }}</div>
      <ExpandablePillList
        class="calendar-pill-row"
        :items="gbfSections"
        :query="searchText"
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
        :query="searchText"
      >
        <template #default="{ item, index }">
          <DecisionLink :href="decisionEntries[index].href" :label="item" :query="searchText" />
        </template>
      </ExpandablePillList>
    </div>
    <!-- Subjects -->
    <div v-if="subjectLabels.length" class="calendar-detail-section col-md-6 col-sm-12">
      <div class="calendar-detail-label">{{ subjectLabels.length > 1 ? t('calendar.labels.subjects') : t('calendar.labels.subject') }}</div>
      <ExpandablePillList
        class="calendar-pill-row"
        :items="subjectLabels"
        :query="searchText"
      />
    </div>

    <!-- Agenda Items -->
    <div v-if="agendaItems.length" class="calendar-detail-section col-md-6 col-sm-12">
      <div class="calendar-detail-label">{{ agendaItems.length > 1 ? t('calendar.labels.agendaItems') : t('calendar.labels.agendaItem') }}</div>
      <div class="table-responsive mt-1">
        <table class="table table-striped table-sm align-middle mb-0 agenda-items-table">
          <thead>
            <tr>
              <th scope="col">{{ t('calendar.labels.meetingCode') }}</th>
              <th scope="col">{{ t('calendar.labels.agendaItemNumber') }}</th>
              <th scope="col">{{ t('calendar.labels.title') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(ai, idx) in agendaItems" :key="idx">
              <td><a :href="`https://www.cbd.int/meetings/${ai.meetingCode}`" target="_blank" rel="noopener">{{ ai.meetingCode }}</a></td>
              <td>{{ ai.item }}</td>
              <td>{{ ai.shortTitle || ai.title }}</td>
            </tr>
          </tbody>
        </table>
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
import type { AgendaItem } from 'shared/types/calendar';

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
  agendaItems: AgendaItem[];
  responsibleUnit?: string;
  responsibleOfficer?: string;
  showResponsible: boolean;
  searchText?: string;
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

/* Agenda items table */
.agenda-items-table thead th {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #6c757d;
  white-space: nowrap;
  background-color: transparent;
  border-top: 1px solid #dee2e6;
  border-bottom: 1px solid #dee2e6;
}

.agenda-items-table tbody td {
  font-size: 0.875rem;
  color: #1f1f1f;
}

.agenda-items-table tbody td a {
  font-size: 0.875rem;
  color: #1f1f1f;
  text-decoration: underline;
}
</style>
