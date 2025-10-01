import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { flushPromises } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import CalendarTableView from '../../app/components/calendar/calendar-table-view.vue';
import CalendarFilters from '../../app/components/calendar/calendar-filters.vue';
import en from '../../i18n/locales/en.json';
import fr from '../../i18n/locales/fr.json';

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

// Mock the useQueryIndex composable to prevent actual API calls
vi.mock('../../app/composables/use-query-index', () => ({
  useQueryIndex: () => ({
    data: { value: null },
    error: { value: null },
    pending: { value: false },
  }),
}));

vi.mock('../../shared/utils/subjects', () => ({
  loadSubjectOptions: vi.fn().mockResolvedValue([]),
  buildSubjectLabelMap: () => new Map<string, string>(),
  resolveSubjectLabel: (value: string) => value,
  setSubjectLabelMap: vi.fn(),
  displaySubjectLabels: (values: string[]) => values,
}));

vi.mock('../../shared/services/thesaurus', () => ({
  loadDomainOptions: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../shared/data/notifications.js', () => ({
  default: [
    {
      id: 'notification-1',
      identifier: 'notification-1',
      symbol: '2025-001',
      titleEn: 'Test Notification',
      date: '2025-01-15T00:00:00Z',
      actionDate: '2025-01-20T00:00:00Z',
      sender: 'Executive Secretary',
      recipients: ['CBD national focal points'],
      themes: ['CBD-SUBJECT-TEST'],
      urls: ['https://www.cbd.int/notifications/2025-001'],
      files: [],
      source: 'index:notification',
    },
  ],
}));

vi.mock('../../shared/data/25-26-activities.js', () => ({
  default: [
    {
      title: 'Sample Activity',
      description: '',
      type: 'Activity',
      actionRequiredByParties: 'Y',
      subject: 'Sample Subject',
      status: 'Confirmed',
      statusNarrative: '',
      startDate: '1-Jan-2025',
      endDate: '2-Jan-2025',
      associatedBody: 'SBSTTA',
      agendaItem: '',
      copDecision: '15/3',
      copParagraphNo: '',
      copParagraphType: '',
      responsibleUnit: 'UNIT',
      responsibleOfficer: 'Officer',
      fundingSource: '',
      fundingAllocated: '',
      actors: '',
      actorsComments: '',
      gbfTargets: '',
      relatedDocuments: '',
      outcome: '',
    },
    {
      title: 'Second Activity',
      description: '',
      type: 'Nominations',
      actionRequiredByParties: 'N',
      subject: 'Another Subject',
      status: 'Completed',
      statusNarrative: '',
      startDate: '5-Feb-2025',
      endDate: '6-Feb-2025',
      associatedBody: 'SBSTTA',
      agendaItem: '',
      copDecision: '15/4',
      copParagraphNo: '',
      copParagraphType: '',
      responsibleUnit: 'UNIT',
      responsibleOfficer: 'Officer',
      fundingSource: '',
      fundingAllocated: '',
      actors: '',
      actorsComments: '',
      gbfTargets: '',
      relatedDocuments: '',
      outcome: '',
    },
  ],
}));

vi.mock('../../shared/data/meetings.js', () => ({
  meetings: [
    {
      _id: 'test-1',
      id: 'test-1',
      titleEn: 'Test Meeting 1',
      type: 'Meeting',
      subjectEn: 'Subject',
      startDate: '2025-01-01T00:00:00Z',
      endDate: '2025-01-02T00:00:00Z',
      copDecision: '15/3',
      status: 'Confirmed',
      links: ['https://www.cbd.int/meetings/test-1'],
      city: 'Montreal',
      hostCountry: 'CA',
    },
    {
      _id: 'test-2',
      id: 'test-2',
      titleEn: 'Test Meeting 2',
      type: 'Meeting',
      subjectEn: 'Subject',
      startDate: '2025-02-01T00:00:00Z',
      endDate: '2025-02-02T00:00:00Z',
      copDecision: 'NP-1',
      status: 'Confirmed',
      links: ['https://www.cbd.int/meetings/test-2'],
      city: 'Geneva',
      hostCountry: 'CH',
    },
  ],
}));

const DEFAULT_SYSTEM_TIME = new Date('2024-12-31T12:00:00Z');
const fetchMock = vi.fn();

beforeAll(() => {
  vi.useFakeTimers();
  vi.stubGlobal('fetch', fetchMock);
});

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({
    ok: true,
    json: async () => ({ response: { docs: [] } }),
  });
  vi.setSystemTime(DEFAULT_SYSTEM_TIME);
});

afterAll(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

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
      copDecisions: [],
      activityTypes: [],
      globalTargets: [],
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
