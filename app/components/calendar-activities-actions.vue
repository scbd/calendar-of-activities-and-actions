<template>
  <section class="activities-explorer">
    <div class="container py-3">
      <h2>Activities & Actions Explorer</h2>

      <div class="card mb-3">
        <div class="card-body d-flex justify-content-between align-items-center">
          <p class="m-0">Filters go here</p>
          <button type="button" class="btn btn-sm btn-outline-primary" @click="reload">Reload</button>
        </div>
      </div>

      <div v-if="loading" class="alert alert-info">Loading meetings…</div>
      <div v-else>
        <div v-if="grouped.length === 0" class="alert alert-warning">No results</div>

  <div v-for="group in grouped" :key="group.key" class="mb-4">
          <div class="dgSep"><h3 class="m-0">{{ group.label }}</h3></div>

          <div v-for="item in group.items" :key="item._id" class="border-bottom py-2">
            <div class="row">
              <div class="col-12 col-md-4">
                <div>
                  <strong>{{ formatDateRange(item) }}</strong><br>
                  <span v-if="venue(item)">{{ venue(item) }}</span><br>
                  <i><b>{{ status(item) }}</b></i>
                </div>
              </div>
              <div class="col-12 col-md-8">
                <div>
                  <div class="fw-semibold">{{ title(item) }}</div>
                  <div v-if="docLink(item)" class="links"><a :href="docLink(item)">Documents »</a></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="d-flex justify-content-end gap-2 mt-2">
          <button type="button" class="btn btn-sm btn-outline-secondary" disabled>Prev</button>
          <span>Page 1 / 1</span>
          <button type="button" class="btn btn-sm btn-outline-secondary" disabled>Next</button>
        </div>

        <div class="card mt-4">
          <div class="card-header">Debug: Collected field names ({{ allFieldNames.length }})</div>
          <div class="card-body">
            <div class="small text-muted">Locale: {{ locale.toUpperCase() }}</div>
            <ul class="mb-0">
              <li v-for="f in allFieldNames" :key="f"><code>{{ f }}</code></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { DateTime } from 'luxon';
import { collectAllFieldNames, fetchMeetingsUpdatedSince, getTitleFieldForLocale, type MeetingDoc, type LocaleCode } from '../../shared/services/solr';

type AnyDoc = MeetingDoc & { [key: string]: unknown };

const loading = ref<boolean>(false);
const docs = ref<AnyDoc[]>([]);
const allFieldNames = ref<string[]>([]);
// Locale will be dynamic later; default to 'en' for now
const locale = ref<LocaleCode>('en');

const load = async () => {
  loading.value = true;
  try {
    // For initial build, query recent updates in the last 2 years for performance; can be broadened.
    const twoYearsAgo = DateTime.now().minus({ years: 2 }).toUTC().toISO();
    const res = await fetchMeetingsUpdatedSince(locale.value, twoYearsAgo ?? undefined);
    docs.value = res.response.docs as AnyDoc[];
    allFieldNames.value = collectAllFieldNames(docs.value as Array<Record<string, unknown>>);
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const reload = () => load();

onMounted(load);

interface GroupedItem {
  key: string;
  label: string;
  items: AnyDoc[];
}

const grouped = computed<GroupedItem[]>(() => {
  // Group by month name + year derived from start or end date
  const buckets = new Map<string, { label: string; items: AnyDoc[] }>();
  for (const d of docs.value) {
    const { startDate_dt, endDate_dt } = d as MeetingDoc;
    const iso = startDate_dt || endDate_dt;
    const dt = iso ? DateTime.fromISO(String(iso)) : null;
    const key = dt ? dt.toFormat('yyyy-LL') : 'unknown';
    const label = dt ? dt.toFormat('LLLL yyyy') : 'Unknown';
    if (!buckets.has(key)) buckets.set(key, { label, items: [] });
    buckets.get(key)!.items.push(d);
  }
  // Sort by key ascending (year-month)
  return Array.from(buckets.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, v]) => ({ key, label: v.label, items: v.items }));
});

function title(d: AnyDoc): string {
  const tField = getTitleFieldForLocale(locale.value);
  return String(d[tField] ?? d['title_EN_t'] ?? d['title_t'] ?? d['title'] ?? 'Untitled');
}

function venue(d: AnyDoc): string | null {
  const city = (d['city_EN_s'] || d['city_s']) as string | undefined;
  // country fields can be localized; fallback to English
  const country = (d['country_EN_s'] || d['country_s']) as string | undefined;
  if (city && country) return `${city}, ${country}`;
  if (city) return city;
  if (country) return country;
  return null;
}

function status(d: AnyDoc): string {
  return String(d['status_s'] ?? d['status'] ?? '');
}

function docLink(d: AnyDoc): string | null {
  // Prefer meetingCode/identifier to construct path if links array not present
  const links = d['links_ss'] as string[] | undefined;
  if (Array.isArray(links) && links.length > 0) return links[0];
  const code = (d['meetingCode_s'] || d['identifier_s']) as string | undefined;
  return code ? `/meetings/${code}` : null;
}

function formatDateRange(d: AnyDoc): string {
  const start = safeDate(d['startDate_dt']);
  const end = safeDate(d['endDate_dt']);
  if (start && end) {
    if (start.hasSame(end, 'day')) return start.toFormat('d LLLL yyyy');
    if (start.month === end.month && start.year === end.year) {
      return `${start.toFormat('d')}–${end.toFormat('d LLLL yyyy')}`;
    }
    if (start.year === end.year) {
      return `${start.toFormat('d LLLL')}–${end.toFormat('d LLLL yyyy')}`;
    }
    return `${start.toFormat('d LLLL yyyy')}–${end.toFormat('d LLLL yyyy')}`;
  }
  if (start) return start.toFormat('d LLLL yyyy');
  if (end) return end.toFormat('d LLLL yyyy');
  return '';
}

function safeDate(v: unknown): DateTime | null {
  if (!v) return null;
  const dt = DateTime.fromISO(String(v));
  return dt.isValid ? dt : null;
}
</script>

<style scoped>
/* Minimal styles to mirror reference structure */
.dgSep { padding: .5rem 0; border-top: 1px solid #e5e5e5; border-bottom: 1px solid #e5e5e5; margin: 1rem 0; }
.links a { text-decoration: none; }
code { font-size: 0.85rem; }
</style>