import { computed, onMounted, ref, watch, toValue, type Ref } from 'vue';
import { useI18n } from '#imports';
import type { FilterOption, ParsedFacets } from 'shared/types/calendar';
import type { ThesaurusTerm } from 'shared/types/thesaurus';
import { thesaurusDomains } from 'shared/constants/thesaurus';
import { RECORD_TYPES } from 'shared/constants/record-types';
import { getDomainTerms } from 'shared/services/thesaurus';
import { parseDecisionLabel } from 'shared/utils/decision-links';
import { STATUS_EQUIVALENCES, COMPLETED_FACET_ALIASES } from 'shared/utils/status';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseThesaurusFiltersOptions {
  /** Current locale — used to pick localized labels from thesaurus terms. */
  locale: Ref<string> | string;
  /** Parsed SOLR facet counts — drives which options are visible and their counts. */
  facets: Ref<ParsedFacets>;
}

// ---------------------------------------------------------------------------
// Module-level thesaurus term cache (session lifetime)
// ---------------------------------------------------------------------------

/**
 * Terms are identical regardless of locale because the API returns every
 * locale inside `ThesaurusTerm.title`. We cache by domain identifier only.
 */
const termCache = new Map<string, ThesaurusTerm[]>();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extract a localized title string from a ThesaurusTerm. */
function getLocalizedLabel(term: ThesaurusTerm, locale: string): string {
  const titleObj = term.title || {};
  const localeKey = locale.toLowerCase();
  const firstKey = Object.keys(titleObj)[0];

  return (
    titleObj[localeKey]
    || titleObj['en']
    || (firstKey ? titleObj[firstKey] : undefined)
    || term.name
    || term.identifier
  );
}

/**
 * Merge thesaurus terms with SOLR facet counts.
 *
 * Always returns all thesaurus terms so every filter group is visible in
 * the consolidated mega-filter dropdown, regardless of facet timing.
 * Terms with matching facet counts include the count; terms without a
 * match are still shown (without a count badge).
 */
function mergeTermsWithFacets(
  terms: ThesaurusTerm[],
  facetEntries: Array<{ value: string; count: number }> | undefined,
  locale: string,
): FilterOption[] {
  if (!terms || terms.length === 0) {
    return [];
  }

  // When facet data hasn't loaded yet (undefined), return all terms without
  // counts so the filter group is visible while SOLR data loads.
  // An empty array means facets loaded but nothing matched — show nothing.
  if (facetEntries === undefined) {
    return terms
      .map<FilterOption>((term) => ({
        value: term.identifier,
        label: getLocalizedLabel(term, locale),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  // When facet data is available, only show terms that have a count > 0.
  const countMap = new Map(facetEntries.map((f) => [f.value, f.count]));

  return terms
    .filter((term) => (countMap.get(term.identifier) ?? 0) > 0)
    .map<FilterOption>((term) => ({
      value: term.identifier,
      label: getLocalizedLabel(term, locale),
      count: countMap.get(term.identifier)!,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * Merge thesaurus status terms with SOLR facet counts.
 *
 * SOLR documents may store either a short code (e.g. `CONFIRM`) or a full
 * thesaurus identifier (e.g. `NCHM-EVENT-STATUS-CONFIRMED`). Both forms
 * represent the same status. This function:
 *
 * 1. Combines facet counts from equivalent short-code / thesaurus-ID pairs.
 * 2. Uses the **thesaurus identifier** as the canonical `value` so that the
 *    query layer can expand it to both forms via `expandStatusValuesForQuery`.
 * 3. Resolves a localized label from the thesaurus term when available.
 *
 * Returns only options whose combined count is > 0, sorted alphabetically.
 */
function mergeStatusTermsWithFacets(
  terms: ThesaurusTerm[],
  facetEntries: Array<{ value: string; count: number }> | undefined,
  locale: string,
): FilterOption[] {
  if (!terms || terms.length === 0) {
    return [];
  }

  // When facet data hasn't loaded yet (undefined), return all status terms
  // without counts. An empty array means facets loaded but nothing matched.
  if (facetEntries === undefined) {
    return terms
      .map<FilterOption>((term) => ({
        value: term.identifier,
        label: getLocalizedLabel(term, locale),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  if (facetEntries.length === 0) {
    return [];
  }

  // Build lookups
  const termByIdentifier = new Map(terms.map((t) => [t.identifier, t]));

  // Build a count map from raw facet values
  const rawCountMap = new Map(facetEntries.map((f) => [f.value, f.count]));

  // Group equivalent values under the thesaurus ID (canonical key).
  // Accumulate counts from both short-code and thesaurus-ID forms.
  const consolidated = new Map<string, { label: string; count: number }>();

  for (const eq of STATUS_EQUIVALENCES) {
    const shortCount = rawCountMap.get(eq.solrCode) ?? 0;
    const fullCount = rawCountMap.get(eq.thesaurusId) ?? 0;
    const totalCount = shortCount + fullCount;

    // Remove processed entries so we can handle unmatched values later
    rawCountMap.delete(eq.solrCode);
    rawCountMap.delete(eq.thesaurusId);

    if (totalCount > 0) {
      const term = termByIdentifier.get(eq.thesaurusId);
      const label = term ? getLocalizedLabel(term, locale) : eq.thesaurusId;

      consolidated.set(eq.thesaurusId, { label, count: totalCount });
    }
  }

  // Fold NOT_SET / NODATE counts into Completed — these documents always
  // display as "Completed" when their dates are in the past and have no
  // meaningful standalone status. CONFIRM is NOT folded here because it
  // still appears as "Confirmed" for current/future-dated documents.
  const completedKey = 'NCHM-EVENT-STATUS-COMPLETED';

  for (const alias of COMPLETED_FACET_ALIASES) {
    const rawCount = rawCountMap.get(alias) ?? 0;

    if (rawCount > 0) {
      rawCountMap.delete(alias);
      const existing = consolidated.get(completedKey);

      if (existing) {
        existing.count += rawCount;
      } else {
        const term = termByIdentifier.get(completedKey);
        const label = term ? getLocalizedLabel(term, locale) : completedKey;

        consolidated.set(completedKey, { label, count: rawCount });
      }
    }
  }

  // Any remaining facet values that didn't match a known equivalence
  // (e.g. "unpublished") are included as-is.
  for (const [value, count] of rawCountMap) {
    if (count > 0) {
      const term = termByIdentifier.get(value);
      const label = term ? getLocalizedLabel(term, locale) : value;

      consolidated.set(value, { label, count });
    }
  }

  return [...consolidated.entries()]
    .map(([value, { label, count }]) => ({ value, label, count }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * Format a raw SOLR decision identifier (e.g. "COP-15/4") into a
 * human-readable label. Falls back to the raw string when parsing fails.
 */
function formatDecisionOption(raw: string): string {
  const parsed = parseDecisionLabel(raw);

  if (!parsed) {
    return raw;
  }

  const { type, meetingNumber, decisionNumber, paragraphs } = parsed;
  const base = type === 'COP'
    ? `${type} ${meetingNumber}/${decisionNumber}`
    : `${type}-${meetingNumber}/${decisionNumber}`;

  return paragraphs.length > 0 ? `${base} P. ${paragraphs.join(',')}` : base;
}

// ---------------------------------------------------------------------------
// Composable
// ---------------------------------------------------------------------------

export function useThesaurusFilters(options: UseThesaurusFiltersOptions) {
  const { t } = useI18n();
  const localeRef = computed(() => toValue(options.locale));
  const facetsRef = computed(() => toValue(options.facets));

  // --- Raw thesaurus terms per domain ------------------------------------

  const subjectTerms = ref<ThesaurusTerm[]>([]);
  const governingBodyTerms = ref<ThesaurusTerm[]>([]);
  const subsidiaryBodyTerms = ref<ThesaurusTerm[]>([]);
  const activityTypeTerms = ref<ThesaurusTerm[]>([]);
  const globalTargetTerms = ref<ThesaurusTerm[]>([]);
  const gbfSectionTerms = ref<ThesaurusTerm[]>([]);
  const countryTerms = ref<ThesaurusTerm[]>([]);
  const statusTerms = ref<ThesaurusTerm[]>([]);

  const loading = ref(false);

  // --- Fetch helpers ------------------------------------------------------

  /**
   * Fetch a single thesaurus domain. Cached for the session so repeat calls
   * (including locale changes) avoid redundant network requests.
   *
   * The API returns localized titles for ALL locales inside each term, so
   * the same cached result can serve every locale.
   */
  async function fetchDomain(domain: string): Promise<ThesaurusTerm[]> {
    const cached = termCache.get(domain);

    if (cached) {
      return cached;
    }

    try {
      const terms = await getDomainTerms(domain);

      termCache.set(domain, terms);

      return terms;
    } catch (err) {
      console.error(`[useThesaurusFilters] Failed to load domain "${domain}":`, err);

      return [];
    }
  }

  /** Fetch all needed thesaurus domains in parallel. */
  async function loadAllDomains(): Promise<void> {
    loading.value = true;

    try {
      const [
        subjects,
        govBodies,
        subBodies,
        actTypes,
        targets,
        sections,
        countries,
        statuses,
      ] = await Promise.all([
        fetchDomain(thesaurusDomains.CBD_SUBJECTS),
        fetchDomain(thesaurusDomains.GOVERNING_BODIES),
        fetchDomain(thesaurusDomains.SUBSIDIARY_BODIES),
        fetchDomain(thesaurusDomains.ACTIVITY_TYPES),
        fetchDomain(thesaurusDomains.GBF_TARGETS),
        fetchDomain(thesaurusDomains.GBF_SECTIONS),
        fetchDomain(thesaurusDomains.COUNTRIES),
        fetchDomain(thesaurusDomains.EVENT_STATUS),
      ]);

      subjectTerms.value = subjects;
      governingBodyTerms.value = govBodies;
      subsidiaryBodyTerms.value = subBodies;
      activityTypeTerms.value = actTypes;
      globalTargetTerms.value = targets;
      gbfSectionTerms.value = sections;
      countryTerms.value = countries;
      statusTerms.value = statuses;
    } finally {
      loading.value = false;
    }
  }

  // --- Computed filter options (merged with facet counts) -----------------

  /**
   * Record type options — static list from RECORD_TYPES, counts from the
   * `schema` facet. Labels resolved via i18n.
   * Always returns all record types so the filter group is always visible;
   * counts are attached when facet data is available.
   */
  const recordTypeOptions = computed<FilterOption[]>(() => {
    const entries = facetsRef.value.schema;

    // When facet data hasn't loaded yet (undefined), show all types without counts
    if (entries === undefined) {
      return RECORD_TYPES.map<FilterOption>((rt) => ({
        value: rt.value,
        label: t(rt.labelKey, rt.value),
      }));
    }

    const countMap = new Map(entries.map((f) => [f.value, f.count]));

    // When facet data is available, only show types with count > 0
    return RECORD_TYPES
      .filter((rt) => (countMap.get(rt.value) ?? 0) > 0)
      .map<FilterOption>((rt) => ({
        value: rt.value,
        label: t(rt.labelKey, rt.value),
        count: countMap.get(rt.value)!,
      }));
  });

  /** Subject options — CBD-SUBJECTS thesaurus merged with `subjects` facet. */
  const subjectOptions = computed<FilterOption[]>(() =>
    mergeTermsWithFacets(subjectTerms.value, facetsRef.value.subjects, localeRef.value),
  );

  /** Governing body options — GOVERNING-BODIES thesaurus merged with `governingBodiesCOA` facet. */
  const governingBodyOptions = computed<FilterOption[]>(() =>
    mergeTermsWithFacets(governingBodyTerms.value, facetsRef.value.governingBodiesCOA, localeRef.value),
  );

  /** Subsidiary body options — SUBSIDIARY-BODIES thesaurus merged with `subsidiaryBodiesCOA` facet. */
  const subsidiaryBodyOptions = computed<FilterOption[]>(() =>
    mergeTermsWithFacets(subsidiaryBodyTerms.value, facetsRef.value.subsidiaryBodiesCOA, localeRef.value),
  );

  /** Activity type options — CALENDAR-OF-ACTIVITY-TYPES thesaurus merged with `type` facet. */
  const activityTypeOptions = computed<FilterOption[]>(() =>
    mergeTermsWithFacets(activityTypeTerms.value, facetsRef.value.type, localeRef.value),
  );

  /** Global target options — GBF-TARGETS thesaurus merged with `gbfTargets` facet. */
  const globalTargetOptions = computed<FilterOption[]>(() =>
    mergeTermsWithFacets(globalTargetTerms.value, facetsRef.value.gbfTargets, localeRef.value),
  );

  /** GBF section options — GBF-SECTIONS thesaurus merged with `gbfSections` facet. */
  const gbfSectionOptions = computed<FilterOption[]>(() =>
    mergeTermsWithFacets(gbfSectionTerms.value, facetsRef.value.gbfSections, localeRef.value),
  );

  /** Country options — countries thesaurus merged with `eventCountry` facet. */
  const countryOptions = computed<FilterOption[]>(() =>
    mergeTermsWithFacets(countryTerms.value, facetsRef.value.eventCountry, localeRef.value),
  );

  /**
   * Status options — NCHM-EVENT-STATUS thesaurus merged with both `status`
   * (meetings/notifications use short codes) and `activityStatus`
   * (calendarActivity uses thesaurus identifiers) facets.
   */
  const statusOptions = computed<FilterOption[]>(() => {
    const statusFacets = facetsRef.value.status;
    const activityStatusFacets = facetsRef.value.activityStatus;

    // Both undefined means facet data hasn't loaded yet — pass undefined through
    if (statusFacets === undefined && activityStatusFacets === undefined) {
      return mergeStatusTermsWithFacets(statusTerms.value, undefined, localeRef.value);
    }

    const combinedFacets = [...(statusFacets ?? []), ...(activityStatusFacets ?? [])];

    return mergeStatusTermsWithFacets(statusTerms.value, combinedFacets, localeRef.value);
  });

  /**
   * COP Decision options — no thesaurus required. Built entirely from the
   * `decisions` SOLR facet. Labels are formatted from the raw identifier.
   */
  const decisionOptions = computed<FilterOption[]>(() => {
    const entries = facetsRef.value.decisions ?? [];

    if (entries.length === 0) {
      return [];
    }

    return entries
      .filter((f) => f.count > 0)
      .map((f) => ({
        value: f.value,
        label: formatDecisionOption(f.value),
        count: f.count,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  });

  // --- Locale change handling --------------------------------------------
  // ThesaurusTerm.title contains all locales, so the computeds automatically
  // pick the correct label when `localeRef` changes — no re-fetch needed.
  // We still clear the cache and re-load as a safeguard in case the API
  // ever returns locale-specific term subsets.

  watch(localeRef, () => {
    termCache.clear();
    void loadAllDomains();
  });

  // --- Init --------------------------------------------------------------

  onMounted(() => {
    void loadAllDomains();
  });

  // --- Public API --------------------------------------------------------

  return {
    /** Record type options (meeting / notification / calendarActivity). */
    recordTypeOptions,
    /** CBD-SUBJECTS options merged with facet counts. */
    subjectOptions,
    /** GOVERNING-BODIES options merged with facet counts. */
    governingBodyOptions,
    /** SUBSIDIARY-BODIES options merged with facet counts. */
    subsidiaryBodyOptions,
    /** CALENDAR-OF-ACTIVITY-TYPES options merged with facet counts. */
    activityTypeOptions,
    /** GBF-TARGETS options merged with facet counts. */
    globalTargetOptions,
    /** GBF-SECTIONS options merged with facet counts. */
    gbfSectionOptions,
    /** Country options merged with facet counts. */
    countryOptions,
    /** NCHM-EVENT-STATUS options merged with facet counts. */
    statusOptions,
    /** COP Decision options from SOLR facets (no thesaurus). */
    decisionOptions,
    /** Whether thesaurus terms are currently being fetched. */
    loading,
  };
}
