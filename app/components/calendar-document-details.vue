<template>
  <div class="row">
    <div class="col-md-6">
      <p v-if="statusLabel">
        <strong>{{ t('calendar.labels.status') }}: </strong>
        <span
          v-if="statusLabel"
          class="badge calendar-accordion__status-badge"
          :class="`bg-${statusColor}`"
        >
          {{ statusLabel }}
        </span>
        <br>
        <span v-if="statusNarrative">{{ statusNarrative }}</span>
      </p>

      <p v-if="isActionRequired">
        <strong>{{ t('calendar.labels.actionRequiredByParties') }}:</strong>
        {{ t('calendar.common.yes') }}
      </p>

      <p v-if="description"><strong>{{ t('calendar.labels.description') }}:</strong> {{ description }}</p>
    </div>
    <div class="col-md-6">
      <div v-if="subjectLabels.length" class="mb-3 calendar-subjects">
        <span class="calendar-pill-label">{{ t('calendar.labels.subjects') }}</span>
        <div class="calendar-pill-row">
          <span
            v-for="subject in subjectLabels"
            :key="subject"
            class="calendar-pill"
          >
            {{ subject }}
          </span>
        </div>
      </div>
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
  </div>
</template>

<script setup lang="ts">
import { useI18n } from '#imports';
import DecisionLink from './decision-link.vue';
import type { DecisionEntry } from 'shared/utils/decision-links';

const props = defineProps<{
  statusLabel?: string;
  statusColor: string;
  statusNarrative?: string | null;
  isActionRequired: boolean;
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
