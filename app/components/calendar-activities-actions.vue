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
import { onMounted, ref, computed, watchEffect } from 'vue';
import { DateTime } from 'luxon';
import { collectAllFieldNames, buildSelectBody, getTitleFieldForLocale, type MeetingDoc, type LocaleCode, type SolrResponse } from '../../shared/services/solr';
import { useQueryIndex } from '../../composables/useQueryIndex';

type AnyDoc = MeetingDoc & { [key: string]: unknown };

console.log('CalendarActivitiesActions component mounted');

const loading = ref<boolean>(false);
const docs = ref<AnyDoc[]>([]);
const allFieldNames = ref<string[]>([]);
// Locale will be dynamic later; default to 'en' for now
const locale = ref<LocaleCode>('en');

const load = () => {
  console.log('Testing API endpoint...');
  
  // Simple test fetch first
  fetch('https://api.cbd.int/api/v2013/index/select', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      df: 'text_EN_txt',
      fq: ['_state_s:public', 'schema_s:(meeting)'],
      q: '*:*',
      sort: 'startDate_dt desc',
      wt: 'json',
      start: 0,
      rows: 5
    })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    return response.json();
  })
  .then(testData => {
    console.log('Test API response:', testData);
    console.log('Test returned', testData.response?.docs?.length || 0, 'documents');
    
    // For initial build, query all meetings (no date filter) to test if API works
    console.log('Querying for all meetings');
    
    // Build the query body directly
    const body = buildSelectBody({ 
      locale: locale.value, 
      schema: 'meeting',
      rows: 20 // Limit to 20 for testing
    });
    
    console.log('Query body:', body);
    
    // Use useQueryIndex - it will handle the request reactively
    const { data, error } = useQueryIndex(body);
    
    // Watch for data changes
    watchEffect(() => {
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
        loading.value = false;
      } else if (error.value) {
        console.error('Solr query failed:', error.value);
        loading.value = false;
      }
    });
  })
  .catch(e => {
    console.error('Error loading meetings:', e);
    loading.value = false;
  });
};

const reload = () => load();

onMounted(load);

interface GroupedItem {
  key: string;
  label: string;
  items: AnyDoc[];
}

const grouped = computed<GroupedItem[]>(() => {
  console.log('Computing grouped data, docs.length:', docs.value.length);
  // Group by month name + year derived from start or end date
  const buckets = new Map<string, { label: string; items: AnyDoc[] }>();
  for (const d of docs.value) {
    const { startDate_dt, endDate_dt } = d as MeetingDoc;
    console.log('Processing doc:', { startDate_dt, endDate_dt });
    const iso = startDate_dt || endDate_dt;
    const dt = iso ? DateTime.fromISO(String(iso)) : null;
    console.log('Parsed date:', dt?.toISO(), 'isValid:', dt?.isValid);
    const key = dt ? dt.toFormat('yyyy-LL') : 'unknown';
    const label = dt ? dt.toFormat('LLLL yyyy') : 'Unknown';
    console.log('Key:', key, 'Label:', label);
    if (!buckets.has(key)) buckets.set(key, { label, items: [] });
    buckets.get(key)!.items.push(d);
  }
  console.log('Buckets:', Array.from(buckets.entries()));
  // Sort by key ascending (year-month)
  const result = Array.from(buckets.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, v]) => ({ key, label: v.label, items: v.items }));
  console.log('Grouped result:', result);
  return result;
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
<style lang="scss" scoped>
// Custom SCSS styles to replace Bootstrap components

// Variables
$primary-color: #007bff;
$secondary-color: #6c757d;
$success-color: #28a745;
$warning-color: #ffc107;
$info-color: #17a2b8;
$light-color: #f8f9fa;
$dark-color: #343a40;
$border-color: #dee2e6;

// Spacing utilities
.py-3 { padding-top: 1rem; padding-bottom: 1rem; }
.mb-3 { margin-bottom: 1rem; }
.mb-4 { margin-bottom: 1.5rem; }
.mt-2 { margin-top: 0.5rem; }
.mt-4 { margin-top: 1.5rem; }
.m-0 { margin: 0; }

// Flex utilities
.d-flex { display: flex; }
.justify-content-between { justify-content: space-between; }
.justify-content-end { justify-content: flex-end; }
.align-items-center { align-items: center; }
.gap-2 { gap: 0.5rem; }

// Text utilities
.fw-semibold { font-weight: 600; }
.text-muted { color: $secondary-color; }
.small { font-size: 0.875rem; }

// Border utilities
.border-bottom { border-bottom: 1px solid $border-color; }

// Layout utilities
.container {
  width: 100%;
  padding-right: 15px;
  padding-left: 15px;
  margin-right: auto;
  margin-left: auto;
  max-width: 1200px;
}

.row {
  display: flex;
  flex-wrap: wrap;
  margin-right: -15px;
  margin-left: -15px;
}

.col-12 {
  flex: 0 0 100%;
  max-width: 100%;
  padding-right: 15px;
  padding-left: 15px;
}

.col-md-4 {
  flex: 0 0 33.333333%;
  max-width: 33.333333%;
  padding-right: 15px;
  padding-left: 15px;
}

.col-md-8 {
  flex: 0 0 66.666667%;
  max-width: 66.666667%;
  padding-right: 15px;
  padding-left: 15px;
}

// Card components
.filters-card,
.debug-card {
  border: 1px solid $border-color;
  border-radius: 0.375rem;
  background-color: $light-color;
}

.filters-card-body,
.debug-card-body {
  padding: 1rem;
}

.debug-card-header {
  padding: 0.75rem 1rem;
  background-color: rgba(0, 0, 0, 0.03);
  border-bottom: 1px solid $border-color;
  border-top-left-radius: calc(0.375rem - 1px);
  border-top-right-radius: calc(0.375rem - 1px);
  font-weight: 500;
}

// Button components
.btn {
  display: inline-block;
  font-weight: 400;
  line-height: 1.5;
  color: #212529;
  text-align: center;
  text-decoration: none;
  vertical-align: middle;
  cursor: pointer;
  user-select: none;
  background-color: transparent;
  border: 1px solid transparent;
  padding: 0.375rem 0.75rem;
  font-size: 1rem;
  border-radius: 0.375rem;
  transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out, border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;

  &:hover {
    text-decoration: none;
  }

  &:focus {
    outline: 0;
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
  }
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
  border-radius: 0.25rem;
}

.btn-outline-primary {
  color: $primary-color;
  border-color: $primary-color;

  &:hover {
    color: #fff;
    background-color: $primary-color;
    border-color: $primary-color;
  }
}

.btn-outline-secondary {
  color: $secondary-color;
  border-color: $secondary-color;

  &:hover {
    color: #fff;
    background-color: $secondary-color;
    border-color: $secondary-color;
  }
}

// Alert components
.alert {
  position: relative;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  border: 1px solid transparent;
  border-radius: 0.375rem;
}

.alert-info {
  color: #0c5460;
  background-color: #d1ecf1;
  border-color: #bee5eb;
}

.alert-warning {
  color: #856404;
  background-color: #fff3cd;
  border-color: #ffeaa7;
}

// Custom styles
.dgSep {
  padding: 0.5rem 0;
  border-top: 1px solid #e5e5e5;
  border-bottom: 1px solid #e5e5e5;
  margin: 1rem 0;
}

.links a {
  text-decoration: none;
  color: $primary-color;

  &:hover {
    text-decoration: underline;
  }
}

code {
  font-size: 0.85rem;
  color: #e83e8c;
  word-wrap: break-word;
}

ul {
  padding-left: 1.5rem;
}

li {
  margin-bottom: 0.25rem;
}

// Responsive design
@media (max-width: 768px) {
  .col-md-4,
  .col-md-8 {
    flex: 0 0 100%;
    max-width: 100%;
  }

  .d-flex {
    flex-direction: column;
    align-items: stretch;
  }

  .justify-content-between {
    justify-content: center;
  }

  .gap-2 {
    gap: 0.5rem;
  }
}

// CBD website inspired styles for headings and rows
h2 {
  font-family: -apple-system, "system-ui", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  font-size: 32px;
  font-weight: 500;
  line-height: 38.4px;
  margin-bottom: 8px;
  margin-top: 0px;
  color: #003d82;
}

h3 {
  font-family: -apple-system, "system-ui", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  font-size: 28px;
  font-weight: 500;
  line-height: 33.6px;
  margin-bottom: 8px;
  margin-top: 0px;
  color: #003d82;
  padding: 0.5rem 0;
  border-top: 1px solid #e5e5e5;
  border-bottom: 1px solid #e5e5e5;
  background-color: #f8f9fa;
}

.border-bottom {
  border-bottom: 1px solid #dee2e6;
  padding: 0.5rem 0;
  &:nth-child(even) {
    background-color: #f9f9f9;
  }
}

// Custom SCSS styles to replace Bootstrap components

// CBD-inspired color variables from official CSS
$primary-color: #0079C0; // CBD primary blue
$secondary-color: #A8CF45; // CBD secondary green
$border-color: #dee2e6; // Light gray borders
$light-bg: #f8f9fa; // Light background
$white: #fff;
$body-color: #1D1D1D; // Body text color
$link-color: #0079C0; // Link color

// Font family matching CBD site
$font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";

// Spacing utilities
.py-3 { padding-top: 1rem; padding-bottom: 1rem; }
.mb-3 { margin-bottom: 1rem; }
.mb-4 { margin-bottom: 1.5rem; }
.mt-2 { margin-top: 0.5rem; }
.mt-4 { margin-top: 1.5rem; }
.m-0 { margin: 0; }

// Flex utilities
.d-flex { display: flex; }
.justify-content-between { justify-content: space-between; }
.justify-content-end { justify-content: flex-end; }
.align-items-center { align-items: center; }
.gap-2 { gap: 0.5rem; }

// Text utilities
.fw-semibold { font-weight: 600; }
.text-muted { color: $secondary-color; }
.small { font-size: 0.875rem; }

// Card utilities
.card {
  background-color: $white;
  border: 1px solid $border-color;
  border-radius: 0.375rem;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}

.card-body {
  padding: 1rem;
}

.card-header {
  background-color: $light-bg;
  border-bottom: 1px solid $border-color;
  padding: 0.75rem 1rem;
  font-weight: 600;
}

// Button utilities
.btn {
  display: inline-block;
  font-weight: 400;
  line-height: 1.5;
  color: $body-color;
  text-align: center;
  text-decoration: none;
  vertical-align: middle;
  cursor: pointer;
  user-select: none;
  background-color: transparent;
  border: 1px solid transparent;
  padding: 0.375rem 0.75rem;
  font-size: 1rem;
  border-radius: 0.25rem;
  transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out, border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
  border-radius: 0.2rem;
}

.btn-outline-primary {
  color: $primary-color;
  border-color: $primary-color;
}

.btn-outline-primary:hover {
  color: $white;
  background-color: $primary-color;
  border-color: $primary-color;
}

.btn-outline-secondary {
  color: #6c757d;
  border-color: #6c757d;
}

.btn-outline-secondary:hover {
  color: $white;
  background-color: #6c757d;
  border-color: #6c757d;
}

// Alert utilities
.alert {
  position: relative;
  padding: 1rem 1rem;
  margin-bottom: 1rem;
  border: 1px solid transparent;
  border-radius: 0.25rem;
}

.alert-info {
  color: #055160;
  background-color: #cff4fc;
  border-color: #b6effb;
}

.alert-warning {
  color: #664d03;
  background-color: #fff3cd;
  border-color: #ffecb5;
}

// Container and layout
.container {
  width: 100%;
  padding-right: 15px;
  padding-left: 15px;
  margin-right: auto;
  margin-left: auto;
  max-width: 1140px;
}

// Grid system
.row {
  display: flex;
  flex-wrap: wrap;
  margin-right: -15px;
  margin-left: -15px;
}

.col-12 {
  flex: 0 0 100%;
  max-width: 100%;
}

.col-md-4 {
  flex: 0 0 33.333333%;
  max-width: 33.333333%;
}

.col-md-8 {
  flex: 0 0 66.666667%;
  max-width: 66.666667%;
}

// Border utilities
.border-bottom {
  border-bottom: 1px solid $border-color !important;
}

// Padding utilities
.py-2 {
  padding-top: 0.5rem !important;
  padding-bottom: 0.5rem !important;
}

// Custom component styles
.dgSep {
  padding: 0.5rem 0;
  border-top: 1px solid #e5e5e5;
  border-bottom: 1px solid #e5e5e5;
  margin: 1rem 0;
}

.links a {
  text-decoration: none;
  color: $link-color;
}

.links a:hover {
  text-decoration: underline;
}

code {
  font-size: 0.85rem;
  color: #e83e8c;
  word-wrap: break-word;
}

// Responsive design
@media (max-width: 768px) {
  .col-md-4, .col-md-8 {
    flex: 0 0 100%;
    max-width: 100%;
  }
}
</style>