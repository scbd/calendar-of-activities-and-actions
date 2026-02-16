<template>
  <div class="calendar-meeting-card" :style="cardBackgroundStyle">
    <div class="calendar-meeting-card__header">
      <div class="calendar-meeting-card__type" :style="typeStyle">
        {{ t('calendar.types.meeting') }}
      </div>
      <div class="calendar-meeting-card__date">
        {{ dateRange }}
      </div>
    </div>

    <div class="calendar-meeting-card__content">
      <NuxtLink
        :to="meetingLink"
        target="_blank"
        class="calendar-meeting-card__title"
      >
        {{ title }}
      </NuxtLink>

      <div v-if="symbolLabel" class="calendar-meeting-card__symbol">
        {{ symbolLabel }}
      </div>

      <div v-if="meetingLocation" class="calendar-meeting-card__location">
        {{ meetingLocation }}
      </div>

      <div
        v-if="statusLabel"
        class="calendar-meeting-card__badges"
      >
        <span
          class="badge"
          :class="`bg-${statusColorValue}`"
        >
          {{ statusLabel }}
        </span>
      </div>

      <div v-if="thematicLabels.length" class="calendar-meeting-card__section">
        <span class="calendar-pill-label">{{ t('calendar.notifications.themes') }}</span>
        <ExpandablePillList
          :items="thematicLabels"
          pill-class="calendar-pill calendar-pill--muted"
        />
      </div>

      <div class="calendar-meeting-card__actions">
        <a
          v-for="link in urlLinks"
          :key="link.url"
          :href="link.url"
          target="_blank"
          rel="noopener"
          class="calendar-meeting-card__cta"
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
import type { CalendarDoc, MeetingDoc } from 'shared/types/calendar';
import { getTitleFieldForLocale } from 'shared/services/solr';
import type { LocaleCode } from 'shared/services/solr';
import { formatDateRange } from 'shared/utils/date';
import { getDocStringValue } from 'shared/utils/document-processing';
import { resolveCountryLabel } from 'shared/utils/labels';
import { normalizeStatusKey, normalizeStatusLabel, shouldDisplayCompleted, statusColor } from 'shared/utils/status';
import { getTypeColor } from 'shared/utils/type-colors';
import { resolveSubjectLabel, fallbackSubjectLabel, subjectLabelMap } from 'shared/utils/subjects';
import ExpandablePillList from '../expandable-pill-list.vue';

const props = defineProps<{
  doc: CalendarDoc;
}>();

const { t, locale } = useI18n();

const meeting = computed(() => props.doc as MeetingDoc);

const titleField = computed(() => getTitleFieldForLocale(locale.value as LocaleCode));

const title = computed(() => {
  const value = getDocStringValue(props.doc, titleField.value, 'title', 'titleEn');

  if (value) {
    return value;
  }

  return t('calendar.labels.untitled') as string;
});

const symbolLabel = computed(() =>
  getDocStringValue(props.doc, 'symbol') ?? '',
);

const dateRange = computed(() => formatDateRange(props.doc));

const typeStyle = computed(() => {
  const palette = getTypeColor('meeting');

  return {
    backgroundColor: palette.background,
    color: palette.text,
  };
});

const cardBackgroundStyle = computed(() => {
  const palette = getTypeColor('meeting');

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

const meetingLocation = computed(() => {
  const city = getDocStringValue(props.doc, 'city', 'cityEn', 'eventCity');
  const rawCountry = getDocStringValue(props.doc, 'eventCountry', 'hostCountry', 'hostGovernment', 'country', 'countryCode');
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

  const normalizedStatusKey = normalizeStatusKey(statusKey ?? rawStatus);

  if (shouldDisplayCompleted(props.doc, normalizedStatusKey, rawStatus)) {
    return t('calendar.status.completed') as string;
  }

  if (normalizedStatusKey === 'NOT_SET' || normalizedStatusKey === 'PUBLISHED' || normalizedStatusKey === 'NODATE') {
    return '';
  }

  return normalizeStatusLabel(normalizedStatusKey, rawStatus ?? undefined);
});

const statusColorValue = computed(() => statusColor(props.doc));

const thematicLabels = computed(() => {
  const themes = meeting.value.themes ?? [];

  if (!themes.length) {
    return [] as string[];
  }

  const labels = subjectLabelMap.value;
  const seen = new Set<string>();

  return themes
    .map(theme => resolveSubjectLabel(theme, labels) || fallbackSubjectLabel(theme))
    .filter(label => {
      if (!label || !label.trim()) {
        return false;
      }

      const normalized = label.trim();

      if (seen.has(normalized)) {
        return false;
      }

      seen.add(normalized);
      return true;
    });
});

interface UrlLink {
  url: string;
  label: string;
}

const urlLinks = computed<UrlLink[]>(() => {
  const urls = meeting.value.url ?? [];

  return urls
    .filter(u => typeof u === 'string' && u.trim())
    .map(url => {
      const trimmed = url.trim();

      if (trimmed.startsWith('https://www.cbd.int/conferences')) {
        return { url: trimmed, label: t('calendar.meetings.viewWebsite') as string };
      }

      if (trimmed.startsWith('https://www.cbd.int/meetings/')) {
        return { url: trimmed, label: t('calendar.meetings.viewDocuments') as string };
      }

      // Fallback: treat any other URL as a documents link
      return { url: trimmed, label: t('calendar.meetings.viewDocuments') as string };
    });
});

const meetingLink = computed(() => {
  const startDate = props.doc.startDate;
  const docId = props.doc.id || '';
  const query: Record<string, string> = {
    autoExpand: docId,
  };

  if (startDate) {
    query.startDate = startDate;
  }

  return {
    path: '/',
    query,
  };
});
</script>

<style scoped>
.calendar-meeting-card {
  padding: 1rem;
  border-bottom: 1px solid #f1f3f5;
  border-radius: 0.375rem;
}

.calendar-meeting-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.calendar-meeting-card__type {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-weight: 600;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.calendar-meeting-card__date {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.calendar-meeting-card__content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.calendar-meeting-card__title {
  font-size: 1rem;
  font-weight: 600;
  color: #0f172a;
  text-decoration: none;
}

.calendar-meeting-card__title:hover {
  color: #0f7abd;
  text-decoration: underline;
}

.calendar-meeting-card__symbol {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.calendar-meeting-card__location {
  color: #6c757d;
  font-size: 0.875rem;
  font-style: italic;
}

.calendar-meeting-card__badges {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.calendar-meeting-card__badges .badge {
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.calendar-meeting-card__section {
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

.calendar-meeting-card :deep(.calendar-pill) {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  background-color: #f1f3f5;
  color: #1f1f1f;
  font-size: 0.875rem;
}

.calendar-meeting-card :deep(.calendar-pill--muted) {
  background-color: #eef2f6;
  color: #4b5563;
}

.calendar-meeting-card__actions {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
}

.calendar-meeting-card__cta {
  color: #0f7abd;
  font-weight: 500;
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: border-bottom-color 0.2s ease;
}

.calendar-meeting-card__cta:hover {
  border-bottom-color: #0f7abd;
}
</style>
