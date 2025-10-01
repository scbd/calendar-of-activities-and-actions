<template>
  <div class="calendar-details">
    <!-- Status narrative -->
    <div v-if="statusNarrative" class="calendar-detail-section">
      <span class="calendar-detail-label">{{ t('calendar.labels.statusNarrative') }}</span>
      <div class="calendar-detail-content">{{ statusNarrative }}</div>
    </div>

    <!-- Symbol -->
    <div v-if="symbol" class="calendar-detail-section">
      <span class="calendar-detail-label">{{ t('calendar.labels.symbol') }}</span>
      <div class="calendar-detail-content">{{ symbol }}</div>
    </div>

    <!-- Description -->
    <div v-if="description" class="calendar-detail-section">
      <span class="calendar-detail-label">{{ t('calendar.labels.description') }}</span>
      <div class="calendar-detail-content">{{ description }}</div>
    </div>

    <!-- Subsidiary bodies -->
    <div v-if="subsidiaryBodies.length" class="calendar-detail-section">
      <span class="calendar-detail-label">{{ t('calendar.labels.associatedBody') }}</span>
      <div class="calendar-detail-content">{{ subsidiaryBodies.join(', ') }}</div>
    </div>

    <!-- Decisions -->
    <div v-if="decisionEntries.length" class="calendar-detail-section">
      <span class="calendar-detail-label">{{ t('calendar.labels.decision') }}</span>
      <div class="calendar-detail-content">
        <template
          v-for="(entry, index) in decisionEntries"
          :key="`${entry.href ?? entry.label}-${index}`"
        >
          <DecisionLink :href="entry.href" :label="entry.label" />
          <span v-if="index < decisionEntries.length - 1">, </span>
        </template>
      </div>
    </div>

    <!-- Responsible Unit -->
    <div v-if="false && showResponsible && responsibleUnit" class="calendar-detail-section">
      <span class="calendar-detail-label">{{ t('calendar.labels.responsibleUnit') }}</span>
      <div class="calendar-detail-content">{{ responsibleUnit }}</div>
    </div>

    <!-- Responsible Officer -->
    <div v-if="false && showResponsible && responsibleOfficer" class="calendar-detail-section">
      <span class="calendar-detail-label">{{ t('calendar.labels.responsibleOfficer') }}</span>
      <div class="calendar-detail-content">{{ responsibleOfficer }}</div>
    </div>

    <!-- Subjects -->
    <div v-if="subjectLabels.length" class="calendar-detail-section">
      <span class="calendar-detail-label">{{ t('calendar.labels.subjects') }}</span>
      <ExpandablePillList
        class="calendar-pill-row"
        :items="subjectLabels"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from '#imports';
import ExpandablePillList from '../expandable-pill-list.vue';
import DecisionLink from '../decision-link.vue';
import type { DecisionEntry } from 'shared/utils/decision-links';

const _props = defineProps<{
  statusNarrative?: string | null;
  symbol?: string;
  description?: string;
  subjectLabels: string[];
  subsidiaryBodies: string[];
  decisionEntries: DecisionEntry[];
  responsibleUnit?: string;
  responsibleOfficer?: string;
  showResponsible: boolean;
}>();

const { t } = useI18n();
</script>

<style scoped>
.calendar-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
  width: 100%;
}

/* Full width sections */
.calendar-detail-section:has(.calendar-pill-row),
.calendar-detail-section:nth-child(1) {
  grid-column: 1 / -1;
}

.calendar-detail-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 0; /* Prevents grid blowout */
}

.calendar-detail-label {
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
}

.calendar-pill-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
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

/* Responsive adjustments */
@media (max-width: 768px) {
  .calendar-details {
    grid-template-columns: 1fr;
  }
  
  .calendar-detail-section:has(.calendar-pill-row),
  .calendar-detail-section:nth-child(1),
  .calendar-detail-section:nth-child(3) {
    grid-column: 1;
  }
}
</style>
