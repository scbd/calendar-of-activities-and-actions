import { computed, ref } from 'vue';
import { useI18n } from '#imports';
import type { ThesaurusTerm } from 'shared/types/thesaurus';
import { thesaurusDomains } from 'shared/constants/thesaurus';
import { getDomainTerms } from 'shared/services/thesaurus';

// ---------------------------------------------------------------------------
// Module-level cache – shared across all component instances. The thesaurus
// API returns titles for every locale inside each term, so a single fetch
// serves all locales.
// ---------------------------------------------------------------------------

const governingBodyTerms = ref<ThesaurusTerm[]>([]);
const subsidiaryBodyTerms = ref<ThesaurusTerm[]>([]);

let fetchPromise: Promise<void> | null = null;

async function ensureTermsLoaded(): Promise<void> {
  if (governingBodyTerms.value.length > 0 && subsidiaryBodyTerms.value.length > 0) {
    return;
  }

  if (fetchPromise) {
    return fetchPromise;
  }

  fetchPromise = (async () => {
    try {
      const [gov, sub] = await Promise.all([
        getDomainTerms(thesaurusDomains.GOVERNING_BODIES),
        getDomainTerms(thesaurusDomains.SUBSIDIARY_BODIES),
      ]);

      governingBodyTerms.value = gov;
      subsidiaryBodyTerms.value = sub;
    } catch (err) {
      console.error('[useBodyLabels] Failed to load thesaurus terms:', err);
      fetchPromise = null; // allow retry on next call
    }
  })();

  return fetchPromise;
}

/** Extract a localized title from a ThesaurusTerm. */
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

// ---------------------------------------------------------------------------
// Composable
// ---------------------------------------------------------------------------

/**
 * Provides reactive lookup maps that resolve governing-body and
 * subsidiary-body thesaurus identifiers to their localized display labels.
 *
 * Terms are fetched once and shared across all component instances.
 */
export function useBodyLabels() {
  const { locale } = useI18n();

  // Kick off the fetch (no-op if already loaded / in-flight)
  void ensureTermsLoaded();

  /** identifier → localized label for governing bodies */
  const governingBodyLabelMap = computed<Map<string, string>>(() => {
    const map = new Map<string, string>();

    for (const term of governingBodyTerms.value) {
      map.set(term.identifier, getLocalizedLabel(term, locale.value));
    }

    return map;
  });

  /** identifier → localized label for subsidiary bodies */
  const subsidiaryBodyLabelMap = computed<Map<string, string>>(() => {
    const map = new Map<string, string>();

    for (const term of subsidiaryBodyTerms.value) {
      map.set(term.identifier, getLocalizedLabel(term, locale.value));
    }

    return map;
  });

  /**
   * Resolve an array of governing-body identifiers to localized labels.
   * Falls back to the raw identifier when no thesaurus match is found.
   */
  function resolveGoverningBodyLabels(identifiers: string[]): string[] {
    const map = governingBodyLabelMap.value;

    return identifiers.map(id => map.get(id) || id);
  }

  /**
   * Resolve an array of subsidiary-body identifiers to localized labels.
   * Falls back to the raw identifier when no thesaurus match is found.
   */
  function resolveSubsidiaryBodyLabels(identifiers: string[]): string[] {
    const map = subsidiaryBodyLabelMap.value;

    return identifiers.map(id => map.get(id) || id);
  }

  return {
    governingBodyLabelMap,
    subsidiaryBodyLabelMap,
    resolveGoverningBodyLabels,
    resolveSubsidiaryBodyLabels,
    /** Manually trigger a fetch (e.g. from onMounted). Usually not needed. */
    ensureTermsLoaded,
  };
}
