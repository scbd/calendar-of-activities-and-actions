<template>
  <div ref="accordionRef" class="accordion-item mb-4 shadow" :class="{ 'accordion-item--faded': fadeOthers && !isOpen, 'accordion-item--cpb-highlight': isCpbDoc, 'accordion-item--np-highlight': isNpDoc }">
    <h2 :id="headingId" class="accordion-header">
      <button
        class="accordion-button p-0"
        :class="{ collapsed: !isOpen }"
        type="button"
        :aria-expanded="isOpen ? 'true' : 'false'"
        :aria-controls="collapseId"
        @click="$emit('toggle')"
      >
        <!-- Top banner showing type (Meeting, Workshop, Nominations, etc.) -->
        <div class="calendar-row__type-banner p-2" :style="typeStyle">
          <span class="calendar-row__type-date">{{ dateRange }}</span>
          <span class="calendar-row__type-text">{{ typeLabel }}</span>
          <span class="calendar-row__caret-spacer" />
        </div>

        <div class="calendar-accordion__summary p-4">
          <div class="calendar-accordion__title mb-3">{{ title }}</div>
          
          <div v-if="notificationSymbol" class="calendar-accordion__symbol mb-3">NTF-{{ notificationSymbol }}</div>
          <div v-if="isActivityDoc && documentSymbol" class="calendar-accordion__symbol mb-3">{{ documentSymbol }}</div>
          <div v-if="isMeetingDoc && meetingSymbol" class="calendar-accordion__symbol mb-3">{{ meetingSymbol }}</div>
          <div v-if="meetingLocation" class="calendar-accordion__location mb-3" :class="{ 'calendar-accordion__location--online': isOnlineMeeting }">{{ meetingLocation }}</div>
          <div
            v-if="statusLabel || showActionBadge || primaryLink"
            class="calendar-accordion__meta-block mt-2"
          >
            <div
              v-if="primaryLink || statusLabel || showActionBadge"
              class="calendar-accordion__footer"
              :class="{ 'calendar-accordion__footer--has-link': primaryLink }"
            >
              <a
                v-if="primaryLink"
                :href="primaryLink"
                target="_blank"
                rel="noopener"
                class="calendar-accordion__cta calendar-accordion__cta--link"
                :aria-label="isNotification ? t('calendar.notifications.viewNotificationAria', { title }) : t('calendar.actions.viewDocumentsAria', { title })"
                data-testid="calendar-accordion-view-documents"
              >
                {{ isNotification ? t('calendar.notifications.viewNotification') : t('calendar.actions.viewDocuments') }} →
              </a>
              <div v-if="statusLabel || showActionBadge" class="calendar-accordion__status-badges" data-testid="calendar-accordion-status-block" >
                <span v-if="showActionBadge" class="badge bg-danger calendar-accordion__status-badge" > {{ t('calendar.labels.actionRequiredByParties') }} </span>

                <span v-if="statusLabel" class="badge calendar-accordion__status-badge" :class="`bg-${statusColorValue}`" > {{ statusLabel }} </span>
              </div>
            </div>
          </div>
        </div>
      </button>
    </h2>
    <div
      :id="collapseId"
      class="accordion-collapse collapse"
      :class="{ show: isOpen }"
      :aria-labelledby="headingId"
    >
      <div class="accordion-body">
        <!-- Notification-specific details -->
        <CalendarAccordianDetailsNotification
          v-if="isNotification"
          :symbol="documentSymbol"
          :description="description"
          :themes="themes"
          :subject-labels="subjectLabels"
          :subsidiary-bodies="subsidiaryBodies"
          :governing-bodies="governingBodies"
          :gbf-sections="gbfSections"
          :global-targets="globalTargets"
          :decision-entries="decisionEntriesValue"
          :recipients="notificationRecipients"
          :attachments="notificationAttachments"
          :notification-link="notificationDirectLink"
          :action-required="isActionRequired"
          :action-deadline="notificationActionDeadline"
          :responsible-unit="responsibleUnit"
          :responsible-officer="responsibleOfficer"
          :show-responsible="showResponsible"
          :related-meetings="relatedMeetings"
          :related-activities="relatedActivities"
          :unresolved-meeting-refs="unresolvedMeetingRefs"
          :unresolved-activity-refs="unresolvedActivityRefs"
        />

        <!-- Activity-specific details -->
        <CalendarAccordianDetailsActivity
          v-else-if="isActivityDoc"
          :status-narrative="statusNarrative"
          :symbol="documentSymbol"
          :description="description"
          :subject-labels="subjectLabels"
          :subsidiary-bodies="subsidiaryBodies"
          :governing-bodies="governingBodies"
          :gbf-sections="gbfSections"
          :global-targets="globalTargets"
          :decision-entries="decisionEntriesValue"
          :responsible-unit="responsibleUnit"
          :responsible-officer="responsibleOfficer"
          :show-responsible="showResponsible"
        />

        <!-- Meeting-specific details -->
        <CalendarAccordianDetailsMeeting
          v-else-if="isMeetingDoc"
          :status-narrative="statusNarrative"
          :symbol="documentSymbol"
          :description="description"
          :location="meetingLocation"
          :themes="themes"
          :subject-labels="subjectLabels"
          :subsidiary-bodies="subsidiaryBodies"
          :governing-bodies="governingBodies"
          :gbf-sections="gbfSections"
          :global-targets="globalTargets"
          :decision-entries="decisionEntriesValue"
          :meeting-urls="meetingUrlsList"
          :responsible-unit="responsibleUnit"
          :responsible-officer="responsibleOfficer"
          :show-responsible="showResponsible"
        />

        <!-- Generic details (fallback) -->
        <!-- <CalendarAccordianDetails
          v-else
          :status-narrative="statusNarrative"
          :symbol="documentSymbol"
          :description="description"
          :subject-labels="subjectLabels"
          :subsidiary-bodies="subsidiaryBodies"
          :governing-bodies="governingBodies"
          :gbf-sections="gbfSections"
          :global-targets="globalTargets"
          :decision-entries="decisionEntriesValue"
          :responsible-unit="responsibleUnit"
          :responsible-officer="responsibleOfficer"
          :show-responsible="showResponsible"
        /> -->

        <!-- Related sections (non-notification docs only; notifications render these inside their details component) -->
        <template v-if="!isNotification">
          <RelatedActivities
            :activities="relatedActivities"
            :unresolved-refs="unresolvedActivityRefs"
          />
          <RelatedMeetings
            :meetings="relatedMeetings"
            :unresolved-refs="unresolvedMeetingRefs"
          />
        </template>

        <RelatedNotifications
          :notifications="allNotificationEntries"
          :all-docs="allDocs"
        />
      </div>
    </div>

    <!-- CPB/Biosafety footer -->
    <div v-if="isCpbDoc || isNpDoc" class="accordion-item__cpb-footer">
      <span v-if="isCpbDoc" class="accordion-item__cpb-label">{{ t('calendar.labels.cpbRelated') }}</span>
      <span v-if="isNpDoc" class="accordion-item__np-label">{{ t('calendar.labels.npRelated') }}</span>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useI18n } from '#imports';
import { getTitleFieldForLocale, normalizeSolrDocument } from 'shared/services/solr';
import type { LocaleCode } from 'shared/services/solr';
import type { CalendarDoc } from 'shared/types/calendar';
import CalendarAccordianDetailsActivity from './details-activity.vue';
import CalendarAccordianDetailsMeeting from './details-meeting.vue';
import CalendarAccordianDetailsNotification from './details-notification.vue';
import RelatedActivities from './related-activities.vue';
import RelatedMeetings from './related-meetings.vue';
import RelatedNotifications from './related-notifications.vue';
import { fetchRelatedDocsBySchema, LEGACY_MEETING_ID_MAP } from 'shared/services/solr-index';
import { formatDateRange } from 'shared/utils/date';
import { DateTime } from 'luxon';
import {
  getDocBooleanValue,
  getDocFiles,
  getDocGbfSections,
  getDocGlobalTargets,
  getDocGoverningBodies,
  getDocRaw,
  getDocRecipients,
  getDocStringValue,
  getDocSubjects,
  getDocSubsidiaryBodies,
  getDocThemes,
} from 'shared/utils/document-processing';
import {
  normalizeDecisionLabel,
  responsibleOfficerLabel,
  responsibleUnitLabel,
  resolveCountryLabel,
} from 'shared/utils/labels';
import { normalizeStatusKey, normalizeStatusLabel, shouldDisplayCompleted, statusColor } from 'shared/utils/status';
import { getTypeColor, normalizeTypeKey } from 'shared/utils/type-colors';
import {
  buildNotificationLink,
  notificationDisplayEntries,
  parseNotificationAttachments,
  resolveNotificationUrl,
  getRelatedActivitiesForMeeting,
  getRelatedNotificationsForMeeting,
} from 'shared/utils/notifications';
import { extractDecisionEntries, type DecisionEntry } from 'shared/utils/decision-links';
import { displaySubjectLabels, resolveSubjectLabel, fallbackSubjectLabel, subjectLabelMap } from 'shared/utils/subjects';
import { useBodyLabels } from '~/composables/use-body-labels';

const meetingLinksCache = new WeakMap<CalendarDoc, string[]>();
const decisionEntriesCache = new WeakMap<CalendarDoc, DecisionEntry[]>();

const props = defineProps<{
  doc: CalendarDoc;
  allDocs?: CalendarDoc[];
  isOpen: boolean;
  headingId: string;
  collapseId: string;
  fadeOthers?: boolean;
}>();

const _emit = defineEmits<{
  (e: 'toggle'): void;
}>();

const accordionRef = ref<HTMLElement>();

const handleClickOutside = (event: Event) => {
  if (accordionRef.value && !accordionRef.value.contains(event.target as Node) && props.isOpen) {
    _emit('toggle');
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

const { t, te, locale } = useI18n();
const { resolveGoverningBodyLabels, resolveSubsidiaryBodyLabels } = useBodyLabels();

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
  const schema = (props.doc.schema ?? '').toLowerCase();

  // Meetings and notifications: use the i18n label as-is (no "Activity" suffix)
  if (schema === 'meeting' || schema === 'notification') {
    const raw = getDocStringValue(props.doc, 'type') || getDocStringValue(props.doc, 'schema');
    const translationKey = `calendar.types.${normalizeTypeKey(raw)}`;

    if (te(translationKey)) {
      return t(translationKey) as string;
    }

    return raw ?? '';
  }

  // Calendar activities: derive label from CAL-ACTIVITY-TYPE-* identifier + "Activity" suffix
  const typeValue = getDocStringValue(props.doc, 'type') ?? '';
  const activitySuffix = t('calendar.types.activity') as string;

  // Special-case overrides for specific activity type identifiers
  const activityLabelOverrides: Record<string, string> = {
    'SUBMISSION-OF-INFORMATION': 'Submission',
    'NOMINATION-REGISTRATION': 'Nomination / Registration',
  };

  const stripped = typeValue.replace(/^CAL-ACTIVITY-TYPE-/i, '');

  if (stripped && stripped !== typeValue) {
    const upperStripped = stripped.toUpperCase();

    // Check for explicit override first
    if (activityLabelOverrides[upperStripped]) {
      return `${activityLabelOverrides[upperStripped]} ${activitySuffix}`;
    }

    // Default: convert hyphens to spaces for display
    // e.g. "MEETING" → "Meeting Activity", "PEER-REVIEW" → "Peer Review Activity"
    const humanLabel = stripped
      .toLowerCase()
      .split('-')
      .filter(word => word.length > 0)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    return `${humanLabel} ${activitySuffix}`;
  }

  // Fallback: try the i18n translation for the type and append "Activity"
  const raw = typeValue || getDocStringValue(props.doc, 'schema');
  const translationKey = `calendar.types.${normalizeTypeKey(raw)}`;

  if (te(translationKey)) {
    const label = t(translationKey) as string;

    if (label && !label.toLowerCase().endsWith(activitySuffix.toLowerCase())) {
      return `${label} ${activitySuffix}`;
    }

    return label;
  }

  return activitySuffix;
});

const typeStyle = computed(() => {
  const palette = getTypeColor(normalizeTypeKey(getDocStringValue(props.doc, 'type') || getDocStringValue(props.doc, 'schema')));

  return {
    backgroundColor: palette.background,
    color: palette.text,
  };
});

const isNotification = computed(() => {
  return props.doc.schema === 'notification';
});

const statusNarrative = computed(() => {
  // Notifications don't have statusNarrative — it's handled via description
  if (isNotification.value) {
    return '';
  }

  return getDocStringValue(props.doc, 'statusNarrative');
});

const isActionRequired = computed(() => {
  // All record types now have actionRequiredByPartiesCOA_b
  if (isNotification.value) {
    return Boolean(getDocStringValue(props.doc, 'actionDate'));
  }

  return getDocBooleanValue(props.doc, 'actionRequired', 'actionRequiredByParties', 'actionRequiredByPartiesCOA') === true;
});

/** True when the notification action deadline is in the past. */
const isActionDeadlinePast = computed(() => {
  if (!isNotification.value) {
    return false;
  }

  const deadline = getDocStringValue(props.doc, 'actionDate') ?? getDocStringValue(props.doc, 'deadline');

  if (!deadline) {
    return false;
  }

  const dt = DateTime.fromISO(String(deadline));

  return dt.isValid && dt.toUTC().endOf('day') < DateTime.utc();
});

/** True when the document's effective status is "completed". */
const isStatusCompleted = computed(() => {
  const rawStatus = getDocStringValue(props.doc, 'status');
  const statusKey = getDocStringValue(props.doc, 'statusKey');
  const normalizedKey = normalizeStatusKey(statusKey ?? rawStatus);

  return normalizedKey === 'COMPLETED' || shouldDisplayCompleted(props.doc, normalizedKey, rawStatus ?? undefined);
});

/** Show the action badge in the summary only when the deadline is still active and status is not completed. */
const showActionBadge = computed(() => isActionRequired.value && !isActionDeadlinePast.value && !isStatusCompleted.value);

const isCpbDoc = computed(() => {
  const subjects = getDocSubjects(props.doc);
  const governingBodies = getDocGoverningBodies(props.doc);
  const targets = getDocGlobalTargets(props.doc);
  const unit = getDocStringValue(props.doc, 'responsibleUnit') ?? '';

  return (
    subjects.includes('CBD-SUBJECT-CPB') ||
    governingBodies.includes('CBD-SUBJECT-CPB') ||
    targets.includes('GBF-TARGET-17') ||
    subjects.includes('CBD-SUBJECT-SYNBIO') || 
    unit.includes('CBD-UNIT-BIOSAFETY')
  );
});

const isNpDoc = computed(() => {
  const subjects = getDocSubjects(props.doc);
  const governingBodies = getDocGoverningBodies(props.doc);
  const targets = getDocGlobalTargets(props.doc);
  const unit = getDocStringValue(props.doc, 'responsibleUnit') ?? '';

  return (
    subjects.includes('CBD-SUBJECT-NPABS') ||
        subjects.includes('CBD-SUBJECT-DSI') ||
    governingBodies.includes('CBD-SUBJECT-NPABS') ||
    targets.includes('GBF-TARGET-13') ||
    unit.includes('CBD-UNIT-ABS')
  );
});

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

const isActivityDoc = computed(() => {
  // Activities are documents that are neither meetings nor notifications
  return !isMeetingDoc.value && !isNotification.value;
});

const meetingLocation = computed(() => {
  if (!isMeetingDoc.value) {
    return '';
  }
  const city = getDocStringValue(props.doc, 'eventCity', 'city', 'cityEn');
  const rawCountry = getDocStringValue(props.doc, 'eventCountry', 'hostCountry', 'hostGovernment', 'country', 'countryCode');
  const providedCountry = getDocStringValue(props.doc, 'hostCountryEn', 'hostGovernmentEn', 'countryEn', 'countryName');
  const hostGovernment = rawCountry
    ? resolveCountryLabel(rawCountry, providedCountry)
    : (providedCountry ?? '');
  const parts = [city, hostGovernment].filter((part): part is string => Boolean(part && part.trim()));
  const result = parts.join(', ');

  return result.toLowerCase() === 'online' ? 'ONLINE' : result;
});

const isOnlineMeeting = computed(() => {
  return meetingLocation.value === 'ONLINE';
});

const notificationSymbol = computed(() => {
  if (!isNotification.value) {
    return '';
  }
  const symbol = getDocStringValue(props.doc, 'symbol');
  
  return symbol ?? '';
});

const meetingSymbol = computed(() => {
  if (!isMeetingDoc.value) {
    return '';
  }
  const code = getDocStringValue(props.doc, 'meetingCode');

  if (code) {
    return code;
  }
  const symbol = getDocStringValue(props.doc, 'symbol');

  return symbol ?? '';
});

const documentSymbol = computed(() => {
  // For meetings, return meeting code
  if (isMeetingDoc.value) {
    return meetingSymbol.value;
  }
  
  // For notifications, return notification symbol
  if (isNotification.value) {
    return notificationSymbol.value;
  }
  
  // For activities, return identifier
  return getDocStringValue(props.doc, 'identifier') ?? '';
});

const statusLabel = computed(() => {
  const rawStatus = getDocStringValue(props.doc, 'status');
  const statusKey = getDocStringValue(props.doc, 'statusKey');
  
  // Always normalize the status key to ensure consistent format
  const normalizedStatusKey = normalizeStatusKey(statusKey ?? rawStatus);

  if (normalizedStatusKey === 'NOT_SET') {
    return '';
  }

  if (shouldDisplayCompleted(props.doc, normalizedStatusKey, rawStatus)) {
    return t('calendar.status.completed') as string;
  }

  return normalizeStatusLabel(normalizedStatusKey, rawStatus ?? undefined);
});

const statusColorValue = computed(() => statusColor(props.doc));

const subsidiaryBodyIds = computed(() => getDocSubsidiaryBodies(props.doc));
const governingBodyIds = computed(() => getDocGoverningBodies(props.doc));
const subsidiaryBodies = computed(() => resolveSubsidiaryBodyLabels(subsidiaryBodyIds.value));
const governingBodies = computed(() => resolveGoverningBodyLabels(governingBodyIds.value));
const gbfSections = computed(() => getDocGbfSections(props.doc));
const globalTargets = computed(() => getDocGlobalTargets(props.doc));
const themes = computed(() => {
  const identifiers = getDocThemes(props.doc);
  const labels = subjectLabelMap.value;
  
  const seen = new Set<string>();

  return identifiers
    .map(id => resolveSubjectLabel(id, labels) || fallbackSubjectLabel(id))
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

const description = computed(() => {
  // For notifications, use fulltext_s as description (first 3 sentences)
  if (isNotification.value) {
    const fulltext = getDocStringValue(props.doc, 'fulltext_s');

    if (!fulltext) {
      return getDocStringValue(props.doc, 'description', 'descriptionTxt', 'descriptionText') ?? '';
    }

    const sentences = fulltext.match(/[^.!?]+[.!?]+/g) || [];
    const firstThree = sentences.slice(0, 3).join(' ').trim();

    return firstThree || '';
  }

  return getDocStringValue(props.doc, 'description', 'descriptionTxt', 'descriptionText');
});

const responsibleUnit = computed(() => responsibleUnitLabel(props.doc));
const responsibleOfficer = computed(() => responsibleOfficerLabel(props.doc));
const showResponsible = computed(() => Boolean(responsibleUnit.value || responsibleOfficer.value));

const decisionEntriesValue = computed(() => {
  const cached = decisionEntriesCache.get(props.doc);

  if (cached) {
    return cached;
  }

  const rawEntries = extractDecisionEntries(props.doc as Record<string, unknown>);
  const normalized = rawEntries
    .map(entry => {
      const normalizedLabel = normalizeDecisionLabel(entry.label) ?? entry.label;
      const finalLabel = normalizedLabel?.trim() ?? '';

      if (!finalLabel) {
        return null;
      }
      return {
        ...entry,
        label: finalLabel,
      } satisfies DecisionEntry;
    })
    .filter((entry): entry is DecisionEntry => entry !== null);

  if (normalized.length === 0) {
    const fallback = normalizeDecisionLabel(getDocStringValue(props.doc, 'copDecision'));

    if (fallback) {
      normalized.push({ label: fallback });
    }
  }

  decisionEntriesCache.set(props.doc, normalized);
  return normalized;
});

const subjectLabels = computed(() => displaySubjectLabels(props.doc));

const notificationRecipients = computed(() => {
  if (!isNotification.value) {
    return [];
  }

  return getDocRecipients(props.doc);
});

const notificationAttachments = computed(() => {
  if (!isNotification.value) {
    return [];
  }

  return parseNotificationAttachments(getDocFiles(props.doc));
});

const notificationActionDeadline = computed(() => {
  if (!isNotification.value) {
    return null;
  }

  // Prefer actionDate field, fall back to deadline (submission deadline)
  return getDocStringValue(props.doc, 'actionDate') ?? getDocStringValue(props.doc, 'deadline') ?? null;
});

const notificationDirectLink = computed(() => {
  if (!isNotification.value) {
    return '';
  }

  const symbol = getDocStringValue(props.doc, 'symbol') ?? '';

  return symbol ? buildNotificationLink(symbol) : '';
});

const notificationEntries = computed(() => notificationDisplayEntries(props.doc));

// ---------------------------------------------------------------------------
// Fetched related docs (separate SOLR calls per schema)
// ---------------------------------------------------------------------------
const fetchedRelatedActivities = ref<CalendarDoc[]>([]);
const fetchedRelatedMeetings = ref<CalendarDoc[]>([]);
const fetchedActivityRefs = ref(false);
const fetchedMeetingRefs = ref(false);

/**
 * When the accordion opens, fetch related activities and meetings via
 * dedicated SOLR calls (one per schema type). This applies to both
 * notifications and calendarActivity documents so the related docs
 * don't depend on whether the target is already in the paged allDocs.
 */
watch(
  () => props.isOpen,
  async (open) => {
    if (!open) {
      return;
    }

    // Skip schemas that never carry cross-reference arrays
    if (!isNotification.value && !isActivityDoc.value && !isMeetingDoc.value) {
      return;
    }

    const activityRefs = props.doc.activities;
    const meetingRefs = props.doc.meetings;

    // Fetch related activities (one call for calendarActivity schema)
    if (
      !fetchedActivityRefs.value &&
      Array.isArray(activityRefs) &&
      activityRefs.length > 0
    ) {
      fetchedActivityRefs.value = true;

      try {
        fetchedRelatedActivities.value = await fetchRelatedDocsBySchema(
          activityRefs,
          'calendarActivity',
        );
      } catch (err) {
        console.error('Failed to fetch related activities', err);
      }
    }

    // Fetch related meetings (one call for meeting schema)
    if (
      !fetchedMeetingRefs.value &&
      Array.isArray(meetingRefs) &&
      meetingRefs.length > 0
    ) {
      fetchedMeetingRefs.value = true;

      try {
        fetchedRelatedMeetings.value = await fetchRelatedDocsBySchema(
          meetingRefs,
          'meeting',
        );
      } catch (err) {
        console.error('Failed to fetch related meetings', err);
      }
    }
  },
  { immediate: true },
);

const relatedActivities = computed(() => {
  // For notifications, activities, and meetings, prefer the separately-fetched documents
  if (isNotification.value || isActivityDoc.value || isMeetingDoc.value) {
    // If SOLR fetch returned results, use those
    if (fetchedRelatedActivities.value.length > 0) {
      return fetchedRelatedActivities.value;
    }

    // Fallback: try resolving from the in-memory paged list
    if (isMeetingDoc.value && props.allDocs) {
      return getRelatedActivitiesForMeeting(props.doc, props.allDocs);
    }

    return fetchedRelatedActivities.value;
  }

  return [];
});

const relatedMeetings = computed(() => {
  // For notifications and activities, use the separately-fetched documents
  if (isNotification.value || isActivityDoc.value) {
    return fetchedRelatedMeetings.value;
  }

  // Meetings don't show other meetings
  return [];
});

/**
 * Activity identifiers from activities_ss that could not be resolved
 * by the dedicated SOLR fetch. Displayed as simple labels so users
 * still see that a relation exists.
 */
const unresolvedActivityRefs = computed<string[]>(() => {
  if (!isNotification.value && !isActivityDoc.value && !isMeetingDoc.value) {
    return [];
  }

  const refs = props.doc.activities;

  if (!refs || !Array.isArray(refs) || refs.length === 0) {
    return [];
  }

  // Until the fetch completes, show nothing (not raw IDs)
  if (!fetchedActivityRefs.value) {
    return [];
  }

  const resolvedIds = new Set(relatedActivities.value.map(d => d.id));
  const resolvedIdentifiers = new Set(relatedActivities.value.map(d => d.identifier));

  return refs.filter(ref => !resolvedIds.has(ref) && !resolvedIdentifiers.has(ref));
});

/**
 * Meeting identifiers from meetings_ss that could not be resolved
 * by the dedicated SOLR fetch. Displayed as simple labels so users
 * still see that a relation exists.
 */
const unresolvedMeetingRefs = computed<string[]>(() => {
  if (!isNotification.value && !isActivityDoc.value && !isMeetingDoc.value) {
    return [];
  }

  const refs = props.doc.meetings;

  if (!refs || !Array.isArray(refs) || refs.length === 0) {
    return [];
  }

  // Until the fetch completes, show nothing (not raw IDs)
  if (!fetchedMeetingRefs.value) {
    return [];
  }

  const resolvedIds = new Set(relatedMeetings.value.map(d => d.id));
  const resolvedIdentifiers = new Set(relatedMeetings.value.map(d => d.identifier));
  const resolvedCodes = new Set(
    relatedMeetings.value
      .map(d => (d as Record<string, unknown>).meetingCode as string | undefined)
      .filter(Boolean)
  );
  const resolvedSymbols = new Set(
    relatedMeetings.value
      .map(d => (d as Record<string, unknown>).symbol as string | undefined)
      .filter(Boolean)
  );

  return refs.filter(ref => {
    // Check if the ref itself matches a resolved doc
    if (resolvedIds.has(ref) || resolvedIdentifiers.has(ref) || resolvedCodes.has(ref) || resolvedSymbols.has(ref)) {
      return false;
    }

    // Check if the ref is a legacy ID that was mapped to a resolved symbol
    const mapped = LEGACY_MEETING_ID_MAP[ref];

    if (mapped && (resolvedIds.has(mapped) || resolvedIdentifiers.has(mapped) || resolvedCodes.has(mapped) || resolvedSymbols.has(mapped))) {
      return false;
    }

    return true;
  });
});

const relatedNotifications = computed(() => {
  if (!props.allDocs) {
    return [];
  }

  // For meetings, show notifications referenced in the meeting's notifications array
  if (isMeetingDoc.value) {
    return getRelatedNotificationsForMeeting(props.doc, props.allDocs);
  }

  // Activities and notifications don't show related notifications (they use notificationEntries instead)
  return [];
});

const allNotificationEntries = computed(() => {
  // Notifications don't show notification entries - they show activities and meetings
  if (isNotification.value) {
    return [];
  }
  
  // Combine direct notification entries and related notification entries for activities and meetings
  const direct = notificationEntries.value;
  const related = relatedNotifications.value.flatMap(notification => notificationDisplayEntries(notification));
  
  // Combine and deduplicate by key
  const combined = [...direct, ...related];
  const seen = new Set<string>();
  
  return combined.filter(entry => {
    if (seen.has(entry.key)) {
      return false;
    }
    seen.add(entry.key);
    return true;
  });
});

/** All URL links extracted from the meeting document (for the details panel). */
const meetingUrlsList = computed<string[]>(() => meetingLinks(props.doc));

const primaryLink = computed(() => {
  const links = meetingUrlsList.value;

  if (links.length === 0) {
    return undefined;
  }
  return links[0];
});

function meetingLinks(doc: CalendarDoc): string[] {
  const cached = meetingLinksCache.get(doc);

  if (cached) {
    return cached;
  }

  const record = doc as Record<string, unknown>;
  const candidateFields = [
    'links',
    'link',
    'meetingLinks',
    'meetingLink',
    'meetingUrl',
    'meetingUrls',
    'url',
    'urls',
    'documents',
  ] as const;

  const collected: string[] = [];

  const collectFromSource = (source: Record<string, unknown>) => {
    candidateFields.forEach(field => {
      const value = source[field];

      if (!value) {
        return;
      }

      if (Array.isArray(value)) {
        value.forEach(entry => {
          if (typeof entry === 'string') {
            const trimmed = entry.trim();

            if (trimmed) {
              collected.push(trimmed);
            }
          }
        });
      } else if (typeof value === 'string') {
        const trimmed = value.trim();

        if (trimmed) {
          collected.push(trimmed);
        }
      }
    });
  };

  collectFromSource(record);

  const raw = getDocRaw(doc);

  if (raw) {
    collectFromSource(normalizeSolrDocument(raw));
  }

  const normalized = Array.from(new Set(
    collected.map(link => resolveNotificationUrl(link)),
  ))
    .filter(link => /^https?:/i.test(link));

  meetingLinksCache.set(doc, normalized);
  return normalized;
}

const headingId = computed(() => props.headingId);
const collapseId = computed(() => props.collapseId);

</script>

<style scoped>
/* Ensure the accordion header stacks the type banner above the summary */
.accordion-button {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  position: relative;
}

.accordion-button::after {
  display: none;
}

/* Add subtle shadow to accordion items for enhanced visual separation */
.accordion-item {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: var(--bs-accordion-border-radius) !important;
}

.accordion-item :deep(.accordion-header),
.accordion-item :deep(.accordion-button) {
  border-top-left-radius: var(--bs-accordion-inner-border-radius) !important;
  border-top-right-radius: var(--bs-accordion-inner-border-radius) !important;
}

/* Fade out other accordion items when one is expanded */
.accordion-item--faded {
  opacity: 0.2;
}

/* .accordion-item--np-highlight {
  border-left: 4px solid #756a8e;
} */

.accordion-item--cpb-highlight {
  z-index: 1;
  position: relative;
}

.accordion-item__cpb-footer {
  display: flex;
  justify-content: flex-start;
  padding: 0;
  border-radius: 0 0 var(--bs-accordion-inner-border-radius) var(--bs-accordion-inner-border-radius);
}

.accordion-item__cpb-label {
  background-color: #fa6938;
  color: #fff;
  font-size: 0.8125rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.2rem 0.625rem;
  border-radius: 0.25rem;
  white-space: nowrap;
  width: fit-content;
}

.accordion-item__np-footer {
  display: flex;
  justify-content: flex-start;
  padding: 0;
  border-radius: 0 0 var(--bs-accordion-inner-border-radius) var(--bs-accordion-inner-border-radius);
}

.accordion-item__np-label {
  background-color: #756a8e;
  color: #fff;
  font-size: 0.8125rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.2rem 0.625rem;
  border-radius: 0.25rem;
  white-space: nowrap;
  width: fit-content;
}

/* Smooth accordion transitions */
.accordion-collapse {
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1) 0.1s;
}

.accordion-collapse:not(.show) {
  opacity: 0;
  transform: translateY(-20px) scale(0.98);
}

.accordion-collapse.show {
  opacity: 1;
  transform: translateY(0) scale(1);
}

/* Top banner that spans full header width with type color */
.calendar-row__type-banner {
  width: 100%;
  display: grid;
  grid-template-columns: 180px 1fr 40px;
  align-items: center;
  position: relative;
  text-transform: uppercase;
  color: #fff;
  border-radius: var(--bs-accordion-inner-border-radius) var(--bs-accordion-inner-border-radius) 0 0;
}

.calendar-row__caret-spacer {
  width: 40px;
  height: var(--bs-accordion-btn-icon-width, 1.25rem);
  position: relative;
}

.calendar-row__caret-spacer::after {
  content: '';
  position: absolute;
  top: 50%;
  right: 0.5rem;
  width: var(--bs-accordion-btn-icon-width, 1.25rem);
  height: var(--bs-accordion-btn-icon-width, 1.25rem);
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%23ffffff'%3e%3cpath fill-rule='evenodd' d='M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z'/%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-size: var(--bs-accordion-btn-icon-width, 1.25rem);
  transform: translateY(-50%);
  transition: transform var(--bs-accordion-btn-icon-transition);
  pointer-events: none;
}

.accordion-button:not(.collapsed) .calendar-row__caret-spacer::after {
  transform: translateY(-50%) rotate(-180deg);
}

.calendar-row__type-text {
  font-weight: 700;
  margin-left: -5rem;
  letter-spacing: 0.05em;
  text-align: center;
}

.calendar-row__type-date {
  font-weight: normal;
  font-size: 0.9em;
  text-transform: none;
  letter-spacing: normal;
  color: inherit;
  text-align: left;
  padding-right: 1rem;
  white-space: nowrap;
}

.calendar-accordion__summary {
  width: 100%;
  text-align: left;
  padding-right: 0;
}

.calendar-accordion__title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.calendar-accordion__meta {
  margin-top: 0.25rem;
}

.calendar-accordion__meta-block {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.calendar-accordion__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.calendar-accordion__footer--has-link {
  justify-content: space-between;
}

.calendar-accordion__status-badges {
  display: flex;
  gap: 0.5rem;
}

.calendar-accordion__cta {
  font-weight: 600;
}

.calendar-accordion__cta--link {
  color: var(--bs-primary);
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: border-color 0.2s ease;
}

.calendar-accordion__cta--link:hover {
  border-bottom-color: var(--bs-primary);
}

.calendar-accordion__location {
  color: #333;
  font-size: 1rem;
  font-weight: 600;
  font-style: italic;
}

.calendar-accordion__location--online {
  text-transform: uppercase;
}

.calendar-accordion__symbol {
  color: #333;
  font-size: 1rem;
  font-weight: 600;
}

.calendar-accordion__status-badge {
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.calendar-notifications__separator {
  margin: 1.5rem 0;
  border: none;
  border-top: 1px solid #dee2e6;
}

.calendar-notifications__header {
  font-size: 1.125rem;
}

@media (max-width: 768px) {
  .calendar-accordion__title { font-size: 1.125rem; }
}
</style>
