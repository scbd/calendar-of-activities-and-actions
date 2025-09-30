<template>
  <div class="row">
    <!-- Status narrative at the top, full width -->
    <div v-if="statusNarrative" class="col-12">
      <p><strong>{{ t('calendar.labels.statusNarrative') }}:</strong> {{ statusNarrative }}</p>
    </div>

    <!-- Left column: symbol, description -->
    <div class="col-md-6">
      <p v-if="symbol"><strong>{{ t('calendar.labels.symbol') }}:</strong> {{ symbol }}</p>
      <p v-if="description"><strong>{{ t('calendar.labels.description') }}:</strong> {{ description }}</p>
    </div>

    <!-- Right column: subsidiary bodies, decisions, responsible -->
    <div class="col-md-6">
      <p v-if="subsidiaryBodies.length"><strong>{{ t('calendar.labels.associatedBody') }}:</strong> {{ subsidiaryBodies.join(', ') }}</p>
      <p v-if="decisionEntries.length">
        <strong>{{ t('calendar.labels.decision') }}:</strong>
        <span class="ms-1">
          <template
            v-for="(entry, index) in decisionEntries"
            :key="`${entry.href ?? entry.label}-${index}`"
          >
            <DecisionLink :href="entry.href" :label="entry.label" />
            <span v-if="index < decisionEntries.length - 1">, </span>
          </template>
        </span>
      </p>
      <div v-if="showResponsible" class="card">
        <div class="card-header">
          <strong>{{ t('calendar.labels.responsible') }}</strong>
        </div>
        <ul class="list-group list-group-flush">
          <li v-if="responsibleUnit" class="list-group-item">
            <span class="fw-bold">{{ t('calendar.labels.unit') }}: </span>{{ responsibleUnit }}
          </li>
          <li v-if="responsibleOfficer" class="list-group-item">
            <span class="fw-bold">{{ t('calendar.labels.officer') }}: </span>{{ responsibleOfficer }}
          </li>
        </ul>
      </div>
    </div>

    <!-- Subjects at the bottom, full width -->
    <div v-if="subjectLabels.length" class="col-12 mt-3">
      <div class="calendar-subjects">
        <span class="calendar-pill-label">{{ t('calendar.labels.subjects') }}</span>
        <ExpandablePillList
          class="calendar-pill-row"
          :items="subjectLabels"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from '#imports';
import ExpandablePillList from './expandable-pill-list.vue';
import DecisionLink from './decision-link.vue';
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
.calendar-subjects {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.calendar-pill-label {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #6c757d;
}

.calendar-subjects :deep(.calendar-pill-row) {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.calendar-subjects :deep(.calendar-pill) {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  background-color: #f1f3f5;
  color: #1f1f1f;
  font-size: 0.875rem;
}
</style>
