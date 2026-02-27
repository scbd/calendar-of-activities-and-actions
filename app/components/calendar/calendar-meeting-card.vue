<template>
  <div class="calendar-meeting-card" :style="cardBackgroundStyle">
    <div class="calendar-meeting-card__header">
      <div class="calendar-meeting-card__type" :style="typeStyle">
        {{ t('calendar.types.meeting') }}<template v-if="symbolLabel"> &nbsp; {{ symbolLabel }}</template>
      </div>
      <div v-if="formattedCreatedDate" class="calendar-meeting-card__header-center">
        <div class="calendar-meeting-card__meta-line">
          {{ t('calendar.notifications.publishedOnDate', { date: formattedCreatedDate }) }}
        </div>
      </div>
      <span
        v-if="statusLabel || dateRange"
        class="calendar-meeting-card__status-date badge"
        :class="`bg-${statusColorValue}`"
      >
        <span v-if="statusLabel" class="calendar-meeting-card__status-text">{{ statusLabel }}</span>
        <span v-if="statusLabel && dateRange" class="calendar-meeting-card__status-sep">&bull;</span>
        <span v-if="dateRange" class="calendar-meeting-card__date-text">{{ dateRange }}</span>
      </span>
    </div>

    <div class="calendar-meeting-card__content">
      <NuxtLink
        :to="meetingLink"
        class="calendar-meeting-card__title"
      >
        {{ title }}
      </NuxtLink>

      <div v-if="meetingLocation" class="calendar-meeting-card__location-section">
        <span class="calendar-pill-label">{{ t('calendar.labels.location') }}</span>
        <span class="calendar-meeting-card__location-pill">{{ meetingLocation }}</span>
      </div>

      <div v-if="thematicLabels.length" class="calendar-meeting-card__section">
        <span class="calendar-pill-label">{{ t('calendar.notifications.themes') }}</span>
        <ExpandablePillList
          :items="thematicLabels"
          pill-class="calendar-pill calendar-pill--muted"
        />
      </div>

      <div v-if="governingBodyLabels.length" class="calendar-meeting-card__location-section">
        <span class="calendar-pill-label">{{ t('calendar.labels.governingBodies') }}</span>
        <span
          v-for="label in governingBodyLabels"
          :key="label"
          class="calendar-meeting-card__location-pill"
        >
          {{ label }}
        </span>
      </div>

      <div v-if="subsidiaryBodyLabels.length" class="calendar-meeting-card__location-section">
        <span class="calendar-pill-label">{{ t('calendar.labels.subsidiaryBodies') }}</span>
        <span
          v-for="label in subsidiaryBodyLabels"
          :key="label"
          class="calendar-meeting-card__location-pill"
        >
          {{ label }}
        </span>
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
import { formatDateRange, formatNotificationDate } from 'shared/utils/date';
import { getDocStringValue, getDocGoverningBodies, getDocSubsidiaryBodies } from 'shared/utils/document-processing';
import { resolveCountryLabel } from 'shared/utils/labels';
import { normalizeStatusKey, normalizeStatusLabel, shouldDisplayCompleted, statusColor } from 'shared/utils/status';
import { getTypeColor } from 'shared/utils/type-colors';
import { resolveSubjectLabel, fallbackSubjectLabel, subjectLabelMap } from 'shared/utils/subjects';
import ExpandablePillList from '../expandable-pill-list.vue';
import { useBodyLabels } from '../../composables/use-body-labels';

const props = defineProps<{
  doc: CalendarDoc;
}>();

const { t, locale } = useI18n();

const { resolveGoverningBodyLabels, resolveSubsidiaryBodyLabels } = useBodyLabels();

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

const formattedCreatedDate = computed(() =>
  formatNotificationDate(props.doc.createdDate) ?? '',
);

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
  const result = parts.join(', ');

  return result.toLowerCase() === 'online' ? 'ONLINE' : result;
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

const governingBodyLabels = computed(() =>
  resolveGoverningBodyLabels(getDocGoverningBodies(props.doc)),
);

const subsidiaryBodyLabels = computed(() =>
  resolveSubsidiaryBodyLabels(getDocSubsidiaryBodies(props.doc)),
);

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

.calendar-meeting-card__header-center {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  text-align: center;
  justify-content: center;
  font-size: 0.875rem;
  color: #6b7280;
}

.calendar-meeting-card__meta-line {
  white-space: nowrap;
}

.calendar-meeting-card__status-date {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #fff;
}

.calendar-meeting-card__status-text {
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}

.calendar-meeting-card__status-sep {
  opacity: 0.7;
}

.calendar-meeting-card__date-text {
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

.calendar-meeting-card__location-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  background-color: #eef2f6;
  color: #4b5563;
  font-size: 0.875rem;
  font-style: italic;
}

.calendar-meeting-card__location-section {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
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
