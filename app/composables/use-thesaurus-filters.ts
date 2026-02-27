import { computed, onMounted, ref, watch, toValue, type Ref } from 'vue';
import { useI18n } from '#imports';
import type { FilterOption, ParsedFacets } from 'shared/types/calendar';
import type { ThesaurusTerm } from 'shared/types/thesaurus';
import { thesaurusDomains } from 'shared/constants/thesaurus';
import { RECORD_TYPES } from 'shared/constants/record-types';
import { getDomainTerms } from 'shared/services/thesaurus';
import { parseDecisionLabel } from 'shared/utils/decision-links';

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

  /**
   * Thematic area options — CBD-SUBJECTS thesaurus merged with `thematicArea` facet.
   * Excludes terms that belong to governing bodies and subsidiary bodies
   * (children of CBD-SUBJECT-LEGAL-STRUCT) since those have their own filters.
   */
  const filteredSubjectTerms = computed<ThesaurusTerm[]>(() => {
    const terms = subjectTerms.value;

    if (!terms || terms.length === 0) {
      return [];
    }

    // Find CBD-SUBJECT-LEGAL-STRUCT and collect its children identifiers
    const legalStructTerm = terms.find((t) => t.identifier === 'CBD-SUBJECT-LEGAL-STRUCT');
    const excludedIds = new Set<string>();

    // Exclude the legal structure parent itself
    excludedIds.add('CBD-SUBJECT-LEGAL-STRUCT');

    // Exclude all its narrower terms (governing/subsidiary body subjects)
    if (legalStructTerm?.narrowerTerms) {
      for (const id of legalStructTerm.narrowerTerms) {
        excludedIds.add(id);
      }
    }

    return terms.filter((t) => !excludedIds.has(t.identifier));
  });

  const subjectOptions = computed<FilterOption[]>(() =>
    mergeTermsWithFacets(filteredSubjectTerms.value, facetsRef.value.thematicArea, localeRef.value),
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
   * Status options — NCHM-EVENT-STATUS thesaurus merged with the unified
   * `statusCOA` facet. All record types (meeting, notification,
   * calendarActivity) now store their canonical status in `statusCOA_s`
   * using thesaurus identifiers (e.g. NCHM-EVENT-STATUS-CONFIRMED).
   */
  const statusOptions = computed<FilterOption[]>(() =>
    mergeTermsWithFacets(statusTerms.value, facetsRef.value.statusCOA, localeRef.value),
  );

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
