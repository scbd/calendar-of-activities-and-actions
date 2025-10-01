<template>
  <div class="calendar-activity-card" :style="cardBackgroundStyle">
    <div class="calendar-activity-card__header">
      <div class="calendar-activity-card__type" :style="typeStyle">
        {{ typeLabel }}
      </div>
      <div class="calendar-activity-card__date">
        {{ dateRange }}
      </div>
    </div>

    <div class="calendar-activity-card__content">
      <NuxtLink
        :to="activityLink"
        target="_blank"
        class="calendar-activity-card__title"
      >
        {{ title }}
      </NuxtLink>

      <div v-if="meetingLocation" class="calendar-activity-card__location">
        {{ meetingLocation }}
      </div>

      <div
        v-if="statusLabel || isActionRequired"
        class="calendar-activity-card__badges"
      >
        <span
          v-if="isActionRequired"
          class="badge bg-danger"
        >
          {{ t('calendar.labels.actionRequiredByParties') }}
        </span>
        <span
          v-if="statusLabel"
          class="badge"
          :class="`bg-${statusColorValue}`"
        >
          {{ statusLabel }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from '#imports';
import type { CalendarDoc } from 'shared/types/calendar';
import { getTitleFieldForLocale } from 'shared/services/solr';
import type { LocaleCode } from 'shared/services/solr';
import { formatDateRange } from 'shared/utils/date';
import {
  getDocBooleanValue,
  getDocStringValue,
} from 'shared/utils/document-processing';
import { resolveCountryLabel } from 'shared/utils/labels';
import { normalizeStatusKey, normalizeStatusLabel, shouldDisplayCompleted, statusColor } from 'shared/utils/status';
import { getTypeColor, normalizeTypeKey } from 'shared/utils/type-colors';

const props = defineProps<{
  doc: CalendarDoc;
}>();

const { t, te, locale } = useI18n();

const titleField = computed(() => getTitleFieldForLocale(locale.value as LocaleCode));

const title = computed(() => {
  const value = getDocStringValue(props.doc, titleField.value, 'title', 'titleEn');

  if (value) {
    return value;
  }

  return t('calendar.labels.untitled') as string;
});

const dateRange = computed(() => formatDateRange(props.doc));

const typeLabel = computed(() => {
  const raw = getDocStringValue(props.doc, 'type');
  const translationKey = `calendar.types.${normalizeTypeKey(raw)}`;

  if (te(translationKey)) {
    return t(translationKey) as string;
  }

  if (te('calendar.types.default')) {
    return t('calendar.types.default') as string;
  }

  if (!raw && te('calendar.types.activity')) {
    return t('calendar.types.activity') as string;
  }

  return raw ?? '';
});

const typeStyle = computed(() => {
  const palette = getTypeColor(normalizeTypeKey(getDocStringValue(props.doc, 'type')));

  return {
    backgroundColor: palette.background,
    color: palette.text,
  };
});

const cardBackgroundStyle = computed(() => {
  const palette = getTypeColor(normalizeTypeKey(getDocStringValue(props.doc, 'type')));

  // Convert hex to rgba with heavy alpha (0.15 = 15% opacity)
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  return {
    backgroundColor: hexToRgba(palette.background, 0.15),
  };
});

const isActionRequired = computed(() => getDocBooleanValue(props.doc, 'actionRequired') === true);

const schemaValue = computed(() => {
  const direct = props.doc.schema ? String(props.doc.schema) : undefined;
  const fallback = getDocStringValue(props.doc, 'schema');

  return (direct ?? fallback ?? '').toLowerCase();
});

const isMeetingDoc = computed(() => {
  if (schemaValue.value === 'meeting') {
    return true;
  }

  const typeValue = getDocStringValue(props.doc, 'type');

  return Boolean(typeValue && typeValue.toLowerCase() === 'meeting');
});

const meetingLocation = computed(() => {
  if (!isMeetingDoc.value) {
    return '';
  }

  const city = getDocStringValue(props.doc, 'city', 'cityEn');
  const rawCountry = getDocStringValue(props.doc, 'hostCountry', 'hostGovernment', 'country', 'countryCode');
  const providedCountry = getDocStringValue(props.doc, 'hostCountryEn', 'hostGovernmentEn', 'countryEn', 'countryName');
  const hostGovernment = rawCountry
    ? resolveCountryLabel(rawCountry, providedCountry)
    : (providedCountry ?? '');
  const parts = [city, hostGovernment].filter((part): part is string => Boolean(part && part.trim()));

  return parts.join(', ');
});

const statusLabel = computed(() => {
  const rawStatus = getDocStringValue(props.doc, 'status');
  const statusKey = getDocStringValue(props.doc, 'statusKey');
  const normalizedStatusKey = statusKey?.toUpperCase() ?? normalizeStatusKey(rawStatus);

  if (normalizedStatusKey === 'NOT_SET') {
    return '';
  }

  if (shouldDisplayCompleted(props.doc, statusKey, rawStatus)) {
    return t('calendar.status.completed') as string;
  }

  return normalizeStatusLabel(statusKey ?? null, rawStatus ?? undefined);
});

const statusColorValue = computed(() => statusColor(props.doc));

const activityLink = computed(() => {
  const startDate = props.doc.startDate;
  const docId = props.doc.id || '';
  const query: Record<string, string> = {
    autoExpand: docId,
  };
  
  if (startDate) {
    query.startDate = startDate;
  }
  
  const link = {
    path: '/',
    query,
  };
  
  console.log('[ActivityCard] Generated link for:', props.doc.title || props.doc.titleEn, 'ID:', docId, 'Link:', link);
  
  return link;
});
</script>

<style scoped>
.calendar-activity-card {
  padding: 1rem;
  border-bottom: 1px solid #f1f3f5;
  border-radius: 0.375rem;
}

.calendar-activity-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.calendar-activity-card__type {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-weight: 600;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.calendar-activity-card__date {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.calendar-activity-card__content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.calendar-activity-card__title {
  font-size: 1rem;
  font-weight: 600;
  color: #0f172a;
  text-decoration: none;
}

.calendar-activity-card__title:hover {
  color: #0f7abd;
  text-decoration: underline;
}

.calendar-activity-card__location {
  color: #6c757d;
  font-size: 0.875rem;
  font-style: italic;
}

.calendar-activity-card__badges {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.calendar-activity-card__badges .badge {
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
</style>
