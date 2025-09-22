<template>
  <section class="activities-explorer">
    <div class="container py-3">
      <h2>Activities & Actions Explorer</h2>

      <div class="card mb-3">
        <div class="card-body">
          <!-- <CalendarFilters
            :available-types="availableTypes"
            :available-subjects="availableSubjects"
            :available-statuses="availableStatuses"
            :available-subsidiary-bodies="availableSubsidiaryBodies"
            :available-cop-decisions="availableCopDecisions"
            @update:filters="handleFiltersUpdate"
          /> -->
        </div>
      </div>

      <div v-if="loading" class="alert">Loading meetings…</div>
      <div v-else>
        <div v-if="filteredGrouped.length === 0" class="alert alert-warning">No results</div>

        <div v-for="group in filteredGrouped" :key="group.key" class="mb-4">
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
                  <div class="meeting-title">{{ title(item) }}</div>
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
import { onMounted, ref, computed, watchEffect } from 'vue';
import { DateTime } from 'luxon';
import { collectAllFieldNames, buildSelectBody, getTitleFieldForLocale, type MeetingDoc, type LocaleCode, type SolrResponse } from 'shared/services/solr';
import { useQueryIndex } from '../../composables/useQueryIndex';
// import CalendarFilters from './calendar-filters.vue';

type AnyDoc = MeetingDoc & { [key: string]: unknown };

console.log('CalendarActivitiesActions component mounted');

const loading = ref<boolean>(false);
const docs = ref<AnyDoc[]>([]);
const allFieldNames = ref<string[]>([]);
// Locale will be dynamic later; default to 'en' for now
const locale = ref<LocaleCode>('en');

// Filter state
// interface FilterState {
//   types: string[];
//   subjects: string[];
//   statuses: string[];
//   subsidiaryBodies: string[];
//   copDecisions: string[];
//   startDate: string;
//   endDate: string;
//   actionRequired: boolean;
// }

// const currentFilters = ref<FilterState>({
//   types: [],
//   subjects: [],
//   statuses: [],
//   subsidiaryBodies: [],
//   copDecisions: [],
//   startDate: '',
//   endDate: '',
//   actionRequired: false,
// });

// Build query body reactively
const queryBody = computed(() => buildSelectBody({ 
  locale: locale.value, 
  schema: 'meeting',
  rows: 20 // Limit to 20 for testing
}));

// Use the composable to call the index
const { data, error, pending } = useQueryIndex(queryBody.value);

// Watch for data changes
watchEffect(() => {
  loading.value = pending.value;
  if (data.value && !error.value) {
    const res = data.value as SolrResponse;
    console.log('API Response received:', res);
    docs.value = res.response.docs as AnyDoc[];
    console.log('Number of docs returned:', docs.value.length);
    if (docs.value.length > 0) {
      console.log('Sample doc fields:', Object.keys(docs.value[0]));
      console.log('First doc:', docs.value[0]);
    }
    allFieldNames.value = collectAllFieldNames(docs.value as Array<Record<string, unknown>>);
  } else if (error.value) {
    console.error('Solr query failed:', error.value);
  }
});

const load = () => {
  // Data loading is handled reactively by the composable
  console.log('Loading triggered');
};

onMounted(load);

interface GroupedItem {
  key: string;
  label: string;
  items: AnyDoc[];
}

// Update grouped to use filtered docs
const filteredDocs = computed(() => docs.value);

const filteredGrouped = computed<GroupedItem[]>(() => {
  console.log('Computing filtered grouped data, filteredDocs.length:', filteredDocs.value.length);
  // Group by month name + year derived from start or end date
  const buckets = new Map<string, { label: string; items: AnyDoc[] }>();
  for (const d of filteredDocs.value) {
    const { startDate_dt, endDate_dt } = d as MeetingDoc;
    console.log('Processing filtered doc:', { startDate_dt, endDate_dt });
    const iso = startDate_dt || endDate_dt;
    const dt = iso ? DateTime.fromISO(String(iso)) : null;
    console.log('Parsed date:', dt?.toISO(), 'isValid:', dt?.isValid);
    const key = dt ? dt.toFormat('yyyy-LL') : 'unknown';
    const label = dt ? dt.toFormat('LLLL yyyy') : 'Unknown';
    console.log('Key:', key, 'Label:', label);
    if (!buckets.has(key)) buckets.set(key, { label, items: [] });
    buckets.get(key)!.items.push(d);
  }
  console.log('Filtered buckets:', Array.from(buckets.entries()));
  // Sort by key ascending (year-month)
  const result = Array.from(buckets.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, v]) => ({ key, label: v.label, items: v.items }));
  console.log('Filtered grouped result:', result);
  return result;
});

// Filter update handler
// const handleFiltersUpdate = (filters: FilterState) => {
//   currentFilters.value = filters;
// };

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
<style lang="scss">
// Import Bootstrap and shared styles globally for this component context
@use '../assets/styles/main.scss' as *;
</style>
<style scoped>
/* Custom component styles that extend Bootstrap */

/* CBD-inspired color variables from official CSS */
:root {
  --primary-color: #0079C0; /* CBD primary blue */
  --secondary-color: #A8CF45; /* CBD secondary green */
  --border-color: #dee2e6; /* Light gray borders */
  --light-bg: #f8f9fa; /* Light background */
  --white: #fff;
  --body-color: #1D1D1D; /* Body text color */
  --link-color: #0079C0; /* Link color */
  --font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
}

/* Custom styles that aren't in Bootstrap */
.dgSep {
  padding: 0.5rem 0;
  border-top: 1px solid #e5e5e5;
  border-bottom: 1px solid #e5e5e5;
  margin: 1rem 0;
}

.links a {
  background-color: #0c9d4d;
  display: inline-block;
  padding: 5px 7px;
  border-radius: 3px;
  color: white;
  margin-left: 3px;
  margin-right: 3px;
  text-decoration: none;
}

.links a:hover {
  text-decoration: underline;
}

code {
  font-size: 0.85rem;
  color: #e83e8c;
  word-wrap: break-word;
}

/* Meeting title styling to match CBD website */
.meeting-title {
  font-family: -apple-system, "system-ui", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  font-size: 16px;
  font-weight: 400;
  letter-spacing: 0.4px;
  box-sizing: border-box;
  display: block;
  color: #1D1D1D; /* Body text color matching CBD site */
  line-height: 1.5;
  margin-bottom: 0.5rem;
  height: 75px;
  overflow: hidden;
}

/* CBD website inspired styles for headings and rows */
h2 {
  letter-spacing: 0.025em;
  color: #009b48;
  margin-bottom: .5rem;
  font-family: inherit;
  font-weight: 500;
  line-height: 1.2;
  box-sizing: border-box;
}

h3 {
  font-family: -apple-system, "system-ui", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  font-size: 28px;
  font-weight: 500;
  line-height: 33.6px;
  margin-bottom: 8px;
  margin-top: 0px;
  color: #009b48;
  padding: 0.5rem 0;
}

.border-bottom {
  border-bottom: 1px solid #dee2e6;
  padding: 0.5rem 0;
  &:nth-child(even) {
    background-color: #f9f9f9;
  }
}

/* Responsive design */
@media (max-width: 768px) {
  .col-md-4, .col-md-8 {
    flex: 0 0 100%;
    max-width: 100%;
  }
}
</style>