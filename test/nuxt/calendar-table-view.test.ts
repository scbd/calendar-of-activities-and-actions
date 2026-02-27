import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { flushPromises } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import type { CalendarDoc, FilterState } from 'shared/types/calendar';
import CalendarFilters from '../../app/components/calendar/calendar-filters.vue';
import en from '../../i18n/locales/en.json';
import fr from '../../i18n/locales/fr.json';

// ---------------------------------------------------------------------------
// Mock: useCalendarData composable (replaces old static-data mocks)
// ---------------------------------------------------------------------------
vi.mock('../../app/composables/use-calendar-data', async () => {
  const { ref, computed } = await import('vue');
  const { DateTime } = await import('luxon');

  const ALL_DOCS = [
    {
      id: 'test-1',
      schema: 'meeting',
      identifier: 'test-1',
      titleEn: 'Test Meeting 1',
      type: 'Meeting',
      startDate: '2025-01-01T00:00:00Z',
      endDate: '2025-01-02T00:00:00Z',
      copDecision: '15/3',
      status: 'Confirmed',
      url: ['https://www.cbd.int/meetings/test-1'],
      city: 'Montreal',
      hostCountry: 'CA',
    },
    {
      id: 'test-2',
      schema: 'meeting',
      identifier: 'test-2',
      titleEn: 'Test Meeting 2',
      type: 'Meeting',
      startDate: '2025-02-01T00:00:00Z',
      endDate: '2025-02-02T00:00:00Z',
      copDecision: 'NP-1',
      status: 'Confirmed',
      url: ['https://www.cbd.int/meetings/test-2'],
      city: 'Geneva',
      hostCountry: 'CH',
    },
    {
      id: 'activity-1',
      schema: 'calendarActivity',
      identifier: 'activity-1',
      titleEn: 'Sample Activity',
      type: 'Activity',
      startDate: '2027-01-05T00:00:00Z',
      endDate: '2027-01-06T00:00:00Z',
      status: 'Confirmed',
      actionRequired: true,
      actionRequiredByParties: true,
    },
    {
      id: 'activity-2',
      schema: 'calendarActivity',
      identifier: 'activity-2',
      titleEn: 'Second Activity',
      type: 'Nominations',
      startDate: '2025-02-05T00:00:00Z',
      endDate: '2025-02-06T00:00:00Z',
      status: 'Completed',
    },
    {
      id: 'notification-1',
      schema: 'notification',
      identifier: 'notification-1',
      titleEn: 'Test Notification',
      type: 'Notification',
      symbol: '2025-001',
      startDate: '2025-01-15T00:00:00Z',
      date: '2025-01-15T00:00:00Z',
      url: ['https://www.cbd.int/notifications/2025-001'],
    },
  ] as unknown as CalendarDoc[];

  return {
    useCalendarData: () => {
      const docs = ref<CalendarDoc[]>([...ALL_DOCS]);
      const currentFilters = ref<FilterState>({
        types: [],
        subjects: [],
        statuses: [],
        subsidiaryBodies: [],
        governingBodies: [],
        copDecisions: [],
        activityTypes: [],
        globalTargets: [],
        gbfSections: [],
        countries: [],
        startDate: '',
        endDate: '',
        actionRequired: false,
        searchText: '',
        sort: ['startDate:asc'],
      });

      const setFilters = (filters: FilterState) => {
        currentFilters.value = { ...filters };
        let result = [...ALL_DOCS];

        if (filters.types?.length) {
          result = result.filter((d) => filters.types.includes(d.schema));
        }

        if (filters.startDate) {
          const cutoff = DateTime.fromISO(filters.startDate);

          result = result.filter((d) => {
            const dt = DateTime.fromISO(String(d.startDate ?? ''));

            return dt.isValid && dt >= cutoff;
          });
        }

        docs.value = result;
      };

      const groupedItems = computed(() => {
        const buckets = new Map<string, { label: string; items: CalendarDoc[] }>();

        for (const d of docs.value) {
          const iso = (d.startDate || d.endDate) as string | undefined;
          const dt = iso ? DateTime.fromISO(String(iso)) : null;
          const key = dt?.isValid ? dt.toFormat('yyyy-LL') : 'unknown';
          const label = dt?.isValid ? dt.toFormat('LLLL yyyy') : 'Unknown date';

          if (!buckets.has(key)) {
            buckets.set(key, { label, items: [] });
          }
          buckets.get(key)!.items.push(d);
        }

        return Array.from(buckets.entries())
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([key, v]) => ({ key, label: v.label, items: v.items }));
      });

      return {
        docs,
        loading: ref(false),
        loadingMore: ref(false),
        initialLoading: ref(false),
        total: computed(() => docs.value.length),
        hasMore: ref(false),
        loadMore: vi.fn(),
        retry: vi.fn(),
        error: ref<string | null>(null),
        isEmpty: computed(() => docs.value.length === 0),
        facets: ref({
          schema: [
            { value: 'meeting', count: 2 },
            { value: 'notification', count: 1 },
            { value: 'calendarActivity', count: 2 },
          ],
        }),
        locale: ref('en'),
        subjectOptions: ref([]),
        subjectLabelMap: computed(() => new Map<string, string>()),
        ensureSubjectLabels: vi.fn(),
        notificationDetailsMap: ref({}),
        notificationErrors: ref({}),
        notificationLoadingMap: ref({}),
        notificationDisplayEntries: () => [],
        currentFilters,
        setFilters,
        resetFilters: vi.fn(() => {
          docs.value = [...ALL_DOCS];
        }),
        groupedItems,
      };
    },
  };
});

// ---------------------------------------------------------------------------
// Mock: thesaurus service (prevents HTTP calls from CalendarFilters)
// ---------------------------------------------------------------------------
vi.mock('../../shared/services/thesaurus', () => ({
  getDomainTerms: vi.fn().mockResolvedValue([]),
  loadDomainOptions: vi.fn().mockResolvedValue([]),
}));

// ---------------------------------------------------------------------------
// Mock: subjects utility (prevents HTTP calls, safe displaySubjectLabels)
// ---------------------------------------------------------------------------
vi.mock('../../shared/utils/subjects', async () => {
  const { ref } = await import('vue');

  return {
    loadSubjectOptions: vi.fn().mockResolvedValue([]),
    buildSubjectLabelMap: () => new Map<string, string>(),
    resolveSubjectLabel: (value: string) => value,
    fallbackSubjectLabel: (identifier: string) => identifier,
    setSubjectLabelMap: vi.fn(),
    displaySubjectLabels: () => [],
    subjectLabelMap: ref<Record<string, string>>({}),
  };
});

// ---------------------------------------------------------------------------
// Component import (after mock declarations — Vitest hoists vi.mock)
// ---------------------------------------------------------------------------
import CalendarTableView from '../../app/components/calendar/calendar-table-view.vue';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function createI18nPlugin(locale: string = 'en') {
  return createI18n({
    legacy: false,
    locale,
    fallbackLocale: 'en',
    messages: { en, fr },
  });
}

async function mountComponent(locale: string = 'en') {
  return mountSuspended(CalendarTableView, {
    global: {
      plugins: [createI18nPlugin(locale)],
    },
  });
}

const DEFAULT_SYSTEM_TIME = new Date('2024-12-31T12:00:00Z');

beforeAll(() => {
  vi.useFakeTimers();
});

beforeEach(() => {
  vi.setSystemTime(DEFAULT_SYSTEM_TIME);
});

afterAll(() => {
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('CalendarTableView Component', () => {
  it('should mount successfully', async () => {
    const component = await mountComponent();

    expect(component.exists()).toBe(true);
  });

  it('should display a table with headers', async () => {
    const component = await mountComponent();

    await flushPromises();

    const table = component.find('table');

    expect(table.exists()).toBe(true);

    const headers = component.findAll('thead th');

    expect(headers.length).toBeGreaterThan(4);
  });

  it('should display sortable column headers', async () => {
    const component = await mountComponent();

    await flushPromises();

    const sortHeaders = component.findAll('.sort-header');

    expect(sortHeaders.length).toBeGreaterThan(0);

    const dateHeader = sortHeaders.find(h => h.text().includes('Date'));

    expect(dateHeader).toBeTruthy();
  });

  it('should render data rows for meetings and activities', async () => {
    const component = await mountComponent();

    await flushPromises();

    const dataRows = component.findAll('tbody .main-row');

    expect(dataRows.length).toBeGreaterThan(0);
  });

  it('should display type badges with proper styling', async () => {
    const component = await mountComponent();

    await flushPromises();

    const typeBadges = component.findAll('.type-badge');

    expect(typeBadges.length).toBeGreaterThan(0);

    const firstBadge = typeBadges[0];

    expect(firstBadge?.attributes('style')).toBeDefined();
  });

  it('should toggle row expansion when clicked', async () => {
    const component = await mountComponent();

    await flushPromises();

    const firstRow = component.find('tbody .main-row');

    expect(firstRow.exists()).toBe(true);

    const initialExpanded = firstRow.classes('row-expanded');

    await firstRow.trigger('click');
    await flushPromises();

    const afterClick = component.find('tbody .main-row').classes('row-expanded');

    expect(afterClick).not.toBe(initialExpanded);
  });

  it('should show details row when expanded', async () => {
    const component = await mountComponent();

    await flushPromises();

    let detailsRows = component.findAll('.details-row');

    // Initially no details should be visible
    expect(detailsRows.length).toBe(0);

    // Click first row to expand
    const firstRow = component.find('tbody .main-row');

    await firstRow.trigger('click');
    await flushPromises();

    detailsRows = component.findAll('.details-row');

    // Now should have at least one details row
    expect(detailsRows.length).toBeGreaterThan(0);
  });

  it('should display meeting location in table', async () => {
    const component = await mountComponent();

    await flushPromises();

    const locations = component.findAll('.location-text');

    expect(locations.length).toBeGreaterThan(0);

    const firstLocation = locations[0];

    expect(firstLocation?.text()).toBeTruthy();
  });

  it('should display status badges', async () => {
    const component = await mountComponent();

    await flushPromises();

    const badges = component.findAll('.badge');

    expect(badges.length).toBeGreaterThan(0);
  });

  it('should display action required badge for items that require action', async () => {
    const component = await mountComponent();

    await flushPromises();

    const actionBadges = component.findAll('.badge.bg-danger');

    expect(actionBadges.length).toBeGreaterThan(0);

    const firstActionBadge = actionBadges[0];

    expect(firstActionBadge?.text()).toContain('Action required');
  });

  it('should sort by date when date header is clicked', async () => {
    const component = await mountComponent();

    await flushPromises();

    const sortHeaders = component.findAll('.sort-header');
    const dateHeader = sortHeaders.find(h => h.text().includes('Date'));

    expect(dateHeader).toBeTruthy();

    // Click to sort ascending
    await dateHeader!.trigger('click');
    await flushPromises();

    const sortArrow = dateHeader!.find('.sort-arrow');

    expect(sortArrow.text()).toBeTruthy();

    // Click again to sort descending
    await dateHeader!.trigger('click');
    await flushPromises();

    const newSortArrow = dateHeader!.find('.sort-arrow');

    expect(newSortArrow.text()).toBeTruthy();
  });

  it('should include calendar filters component', async () => {
    const component = await mountComponent();

    await flushPromises();

    const filters = component.findComponent(CalendarFilters);

    expect(filters.exists()).toBe(true);
  });

  it('should display nested table for related activities when row is expanded', async () => {
    const component = await mountComponent();

    await flushPromises();

    // Expand the first row
    const firstRow = component.find('tbody .main-row');

    await firstRow.trigger('click');
    await flushPromises();

    // The nested table structure should be in the details
    const detailsContainer = component.find('.details-container');

    expect(detailsContainer.exists()).toBe(true);
  });

  it('should display expand/collapse icon in first column', async () => {
    const component = await mountComponent();

    await flushPromises();

    const expandIcons = component.findAll('.expand-icon');

    expect(expandIcons.length).toBeGreaterThan(0);

    const firstIcon = expandIcons[0];

    expect(['▶', '▼']).toContain(firstIcon?.text());
  });

  it('should render notifications in the table', async () => {
    const component = await mountComponent();

    await flushPromises();

    const rows = component.findAll('tbody .main-row');
    const titles = rows.map(row => row.find('.title-text').text());

    expect(titles).toContain('Test Notification');
  });

  it('should display notification symbol when available', async () => {
    const component = await mountComponent();

    await flushPromises();

    const symbols = component.findAll('.symbol-text');

    expect(symbols.length).toBeGreaterThan(0);
  });

  it('should apply different sort orders for different columns', async () => {
    const component = await mountComponent();

    await flushPromises();

    const sortHeaders = component.findAll('.sort-header');

    // Find type header
    const typeHeader = sortHeaders.find(h => h.text().includes('Type'));

    expect(typeHeader).toBeTruthy();

    await typeHeader!.trigger('click');
    await flushPromises();

    // Verify the sort arrow is active
    const sortArrow = typeHeader!.find('.sort-arrow.active');

    expect(sortArrow.exists()).toBe(true);
  });

  it('should handle empty results gracefully', async () => {
    const component = await mountComponent();

    await flushPromises();

    // Emit filters that would result in no matches
    const filtersComponent = component.findComponent(CalendarFilters);

    filtersComponent.vm.$emit('update:filters', {
      types: ['NonExistentType'],
      subjects: [],
      statuses: [],
      subsidiaryBodies: [],
      governingBodies: [],
      copDecisions: [],
      activityTypes: [],
      globalTargets: [],
      gbfSections: [],
      countries: [],
      startDate: '',
      endDate: '',
      actionRequired: false,
      searchText: '',
      sort: ['startDate:asc'],
    });

    await flushPromises();

    const noResults = component.find('.alert-warning');

    expect(noResults.exists()).toBe(true);
  });
});
