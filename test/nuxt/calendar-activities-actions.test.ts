import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { flushPromises } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import type { CalendarDoc, FilterState } from 'shared/types/calendar';
import CalendarFilters from '../../app/components/calendar/calendar-filters.vue';
import DecisionLink from '../../app/components/decision-link.vue';
import { resolveDecisionHrefWithFallback } from '../../shared/utils/decision-links';
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
      titleEn: 'Decision Without Prefix',
      type: 'Meeting',
      startDate: '2025-01-01T00:00:00Z',
      endDate: '2025-01-02T00:00:00Z',
      copDecision: '15/3',
      status: 'Confirmed',
      url: ['https://www.cbd.int/meetings/test-1'],
    },
    {
      id: 'test-2',
      schema: 'meeting',
      identifier: 'test-2',
      titleEn: 'Decision With NP',
      type: 'Meeting',
      startDate: '2025-02-01T00:00:00Z',
      endDate: '2025-02-02T00:00:00Z',
      copDecision: 'NP-1',
      status: 'Confirmed',
      url: ['https://www.cbd.int/meetings/test-2'],
    },
    {
      id: 'activity-1',
      schema: 'calendarActivity',
      identifier: 'activity-1',
      titleEn: 'Sample Activity',
      type: 'Activity',
      startDate: '2025-01-05T00:00:00Z',
      endDate: '2025-01-06T00:00:00Z',
      status: 'Confirmed',
      actionRequiredByParties: true,
    },
    {
      id: 'activity-2',
      schema: 'calendarActivity',
      identifier: 'activity-2',
      titleEn: 'Second Item',
      type: 'Nominations',
      startDate: '2025-02-05T00:00:00Z',
      endDate: '2025-02-06T00:00:00Z',
      status: 'Completed',
    },
    {
      id: 'notification-1',
      schema: 'notification',
      identifier: 'notification-1',
      titleEn: 'Test Notification Item',
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
vi.mock('../../shared/utils/subjects', () => ({
  loadSubjectOptions: vi.fn().mockResolvedValue([]),
  buildSubjectLabelMap: () => new Map<string, string>(),
  resolveSubjectLabel: (value: string) => value,
  setSubjectLabelMap: vi.fn(),
  displaySubjectLabels: () => [],
}));

// ---------------------------------------------------------------------------
// Component import (after mock declarations — Vitest hoists vi.mock)
// ---------------------------------------------------------------------------
import CalendarActivitiesActions from '../../app/components/calendar/calendar-activities-actions.vue';

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
  return mountSuspended(CalendarActivitiesActions, {
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
describe('CalendarActivitiesActions Component', () => {
  it('should mount successfully', async () => {
    const component = await mountComponent();

    expect(component.exists()).toBe(true);
  });

  it('should display the correct title', async () => {
    const component = await mountComponent();
    const title = component.find('h3');

    expect(title.exists()).toBe(true);
    expect(title.text().length).toBeGreaterThan(0);
  });

  it('renders a type strip with a centered label', async () => {
    const component = await mountComponent();

    await flushPromises();

    const typeStrips = component.findAll('.calendar-row__type-text');

    expect(typeStrips.length).toBeGreaterThan(0);
    expect(typeStrips[0]?.text().trim().length).toBeGreaterThan(0);
  });

  it('renders a meeting documents link in the accordion summary when meeting URLs are provided', async () => {
    const component = await mountComponent();

    await flushPromises();

    const documentLinks = component.findAll('[data-testid="calendar-accordion-view-documents"]');

    expect(documentLinks.length).toBeGreaterThan(0);
    const firstLink = documentLinks[0];

    expect(firstLink?.text()).toContain('View documents');
    expect(firstLink?.attributes('href')).toBe('https://www.cbd.int/meetings/test-1');
    expect(firstLink?.attributes('target')).toBe('_blank');
  });

  it('places the documents link on the left with status badges grouped on the right', async () => {
    const component = await mountComponent();

    await flushPromises();

    const footers = component.findAll('.calendar-accordion__footer');
    const footerWithLink = footers.find(footer =>
      footer.find('[data-testid="calendar-accordion-view-documents"]').exists(),
    );

    expect(footerWithLink).toBeTruthy();

    const documentsLink = footerWithLink!.find('[data-testid="calendar-accordion-view-documents"]');
    const statusBlock = footerWithLink!.find('[data-testid="calendar-accordion-status-block"]');

    expect(statusBlock.exists()).toBe(true);

    const footerChildren = Array.from(footerWithLink!.element.children);

    expect(footerChildren[0]).toBe(documentsLink.element);
    expect(footerChildren[footerChildren.length - 1]).toBe(statusBlock.element);
    expect(statusBlock.text()).toContain('Confirmed');
  });

  it('prefixes COP for decisions without reserved tokens in English', async () => {
    const component = await mountComponent('en');

    await flushPromises();

    const links = component.findAllComponents(DecisionLink);
    const expectedCopHref = resolveDecisionHrefWithFallback(null, 'COP 15/3');
    const expectedNpHref = resolveDecisionHrefWithFallback(null, 'NP-1');
    const copLink = links.find(link => link.props('href') === expectedCopHref);
    const npLink = links.find(link => link.props('href') === expectedNpHref);

    expect(copLink).toBeTruthy();
    expect(npLink).toBeTruthy();
    expect(copLink?.text()).toContain('15/3');
    expect(npLink?.text()).toContain('NP-1');
  });

  it('uses localized COP prefix when locale is French', async () => {
    const component = await mountComponent('fr');

    await flushPromises();

    const links = component.findAllComponents(DecisionLink);
    const expectedCopHref = resolveDecisionHrefWithFallback(null, 'COP 15/3');
    const copLink = links.find(link => link.props('href') === expectedCopHref);

    expect(copLink).toBeTruthy();
    expect(copLink?.text()).toContain('15/3');
  });

  it('shows non-meeting types by default (no implicit meeting filter applied)', async () => {
    const component = await mountComponent('en');

    await flushPromises();

    const typeLabels = component.findAll('.calendar-row__type-text').map(el => el.text().trim().toLowerCase());

    // i18n returns "Activities" and "Nominations" — use includes for partial match
    expect(typeLabels.some(l => l.includes('activit'))).toBe(true);
    expect(typeLabels.some(l => l.includes('nomination'))).toBe(true);
  });

  it('renders meeting entries grouped by month when meeting data is available', async () => {
    const component = await mountComponent('en');

    await flushPromises();

    const groupHeadings = component.findAll('.dg-sep h3').map(el => el.text().trim()).filter(Boolean);
    const accordionTitles = component.findAll('.calendar-accordion__title').map(el => el.text().trim());

    expect(groupHeadings).toEqual(expect.arrayContaining(['January 2025', 'February 2025']));
    expect(accordionTitles).toEqual(expect.arrayContaining(['Decision Without Prefix', 'Decision With NP']));
  });

  it('pre-selects today as start date by default', async () => {
    const component = await mountComponent('en');

    await flushPromises();

    const dateInputs = component.findAll('input[type="date"]');
    const startDateInput = dateInputs.at(0);

    // The component computes defaultStartDate = DateTime.now() which is 2024-12-31
    expect(startDateInput?.element.value).toBe('2024-12-31');
  });

  it('excludes entries scheduled before the selected start date', async () => {
    const component = await mountComponent('en');

    await flushPromises();

    const dateInputs = component.findAll('input[type="date"]');
    const startDateInput = dateInputs.at(0);

    expect(startDateInput).toBeTruthy();

    await startDateInput!.setValue('2025-01-10');
    await flushPromises();

    const accordionTitles = component.findAll('.calendar-accordion__title').map(el => el.text().trim());

    expect(accordionTitles).not.toContain('Decision Without Prefix');
    expect(accordionTitles).toEqual(expect.arrayContaining(['Decision With NP', 'Second Item']));
  });

  it('renders notifications alongside meetings and activities', async () => {
    const component = await mountComponent('en');

    await flushPromises();

    const titles = component.findAll('.calendar-accordion__title').map(el => el.text().trim());
    const typeLabels = component.findAll('.calendar-row__type-text').map(el => el.text().trim().toLowerCase());

    expect(titles).toContain('Test Notification Item');
    expect(typeLabels.some(l => l.includes('notification'))).toBe(true);
  });

  it('displays the notification published date in the type banner', async () => {
    const component = await mountComponent('en');

    await flushPromises();

    const items = component.findAll('.accordion-item');
    const notificationItem = items.find(item =>
      item.find('.calendar-accordion__title').text().trim() === 'Test Notification Item',
    );

    expect(notificationItem).toBeTruthy();

    const bannerDate = notificationItem!.find('.calendar-row__type-date').text().trim();

    expect(bannerDate).toContain('15');
    expect(bannerDate).toContain('2025');
  });

  it('hides the empty responsible unit line for notifications', async () => {
    const component = await mountComponent('en');

    await flushPromises();

    const items = component.findAll('.accordion-item');
    const notificationItem = items.find(item =>
      item.find('.calendar-accordion__title').text().trim() === 'Test Notification Item',
    );

    expect(notificationItem).toBeTruthy();

    const toggle = notificationItem!.find('.accordion-button');

    await toggle.trigger('click');
    await flushPromises();

    const bodyText = notificationItem!.find('.accordion-body').text();

    expect(bodyText).not.toContain('Unit:');
    expect(bodyText).not.toContain('Responsible Officer:');
  });

  it('filters notifications when the notification schema is selected', async () => {
    const component = await mountComponent('en');

    await flushPromises();

    const filtersComponent = component.findComponent(CalendarFilters);

    filtersComponent.vm.$emit('update:filters', {
      types: ['notification'],
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

    const titles = component.findAll('.calendar-accordion__title').map(el => el.text().trim());

    expect(titles).toEqual(['Test Notification Item']);
  });
});
