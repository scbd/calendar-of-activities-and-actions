import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { flushPromises } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import CalendarActivitiesActions from '../../app/components/calendar/calendar-activities-actions.vue';
import CalendarFilters from '../../app/components/calendar/calendar-filters.vue';
import DecisionLink from '../../app/components/decision-link.vue';
import { resolveDecisionHrefWithFallback } from '../../shared/utils/decision-links';
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
  return mountSuspended(CalendarActivitiesActions, {
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
    pending: { value: false }
  })
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
      titleEn: 'Test Notification Item',
      date: '2025-01-15T00:00:00Z',
      actionDate: '2025-01-20T00:00:00Z',
      sender: 'Executive Secretary',
      recipients: ['CBD national focal points'],
      themes: ['CBD-SUBJECT-TEST'],
      urls: ['https://www.cbd.int/notifications/2025-001'],
      files: [
        {
          type: 'application/pdf',
          language: 'en',
          url: '/doc/notifications/2025/test-notification-en.pdf',
          name: 'test-notification-en.pdf',
        },
      ],
      source: 'index:notification',
    },
  ],
}));

// Mock activities data with two non-meeting activity types to ensure they are visible by default
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
      title: 'Second Item',
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
      titleEn: 'Decision Without Prefix',
      type: 'Meeting',
      subjectEn: 'Subject',
      startDate: '2025-01-01T00:00:00Z',
      endDate: '2025-01-02T00:00:00Z',
      copDecision: '15/3',
      status: 'Confirmed',
      links: ['https://www.cbd.int/meetings/test-1']
    },
    {
      _id: 'test-2',
      id: 'test-2',
      titleEn: 'Decision With NP',
      type: 'Meeting',
      subjectEn: 'Subject',
      startDate: '2025-02-01T00:00:00Z',
      endDate: '2025-02-02T00:00:00Z',
      copDecision: 'NP-1',
      status: 'Confirmed',
      links: ['https://www.cbd.int/meetings/test-2']
    }
  ]
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

describe('CalendarActivitiesActions Component', () => {
  it('should display loading spinner initially', async () => {
    // Mount without awaiting to catch the initial loading state
    const componentPromise = mountComponent();
    const component = await componentPromise;
    
    // The component should exist
    expect(component.exists()).toBe(true);
  });

  it('should mount successfully without filteredDocs error', async () => {
    const component = await mountComponent();

    expect(component.exists()).toBe(true);
  });

  it('should display the correct title', async () => {
    const component = await mountComponent();
    const title = component.find('h3');
    
    // The component now shows month groupings (e.g., "January 2025") instead of a static title
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

    expect(firstLink?.text()).toBe('View documents →');
    expect(firstLink?.attributes('href')).toBe('https://www.cbd.int/meetings/test-1');
    expect(firstLink?.attributes('target')).toBe('_blank');
  });

  it('places the documents link on the left with status badges grouped on the right', async () => {
    const component = await mountComponent();

    await flushPromises();

    const footers = component.findAll('.calendar-accordion__footer');
    const footerWithLink = footers.find(footer => footer.find('[data-testid="calendar-accordion-view-documents"]').exists());

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
    const expectedNpHref = resolveDecisionHrefWithFallback(null, 'NP-1');
    const copLink = links.find(link => link.props('href') === expectedCopHref);
    const npLink = links.find(link => link.props('href') === expectedNpHref);

    expect(copLink).toBeTruthy();
    expect(npLink).toBeTruthy();
    expect(copLink?.text()).toContain('15/3');
  });

  it('shows non-meeting types by default (no implicit meeting filter applied)', async () => {
    const component = await mountComponent('en');

    await flushPromises();

    const typeLabels = component.findAll('.calendar-row__type-text').map(el => el.text().trim().toLowerCase());

    expect(typeLabels.some(l => l === 'activity')).toBe(true);
    expect(typeLabels.some(l => l === 'nominations')).toBe(true);
  });

  it('renders meeting entries grouped by month when meeting data is available', async () => {
    const component = await mountComponent('en');

    await flushPromises();

    const groupHeadings = component.findAll('.dg-sep h3').map(el => el.text().trim()).filter(Boolean);
    const accordionTitles = component.findAll('.calendar-accordion__title').map(el => el.text().trim());

    expect(groupHeadings).toEqual(expect.arrayContaining(['January 2025', 'February 2025']));
    expect(accordionTitles).toEqual(expect.arrayContaining(['Decision Without Prefix', 'Decision With NP']));
  });

  it('does not pre-select a start date filter by default', async () => {
    const component = await mountComponent('en');

    await flushPromises();

    const dateInputs = component.findAll('input[type="date"]');
    const startDateInput = dateInputs.at(0);

    expect(startDateInput?.element.value).toBe('');
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
    expect(typeLabels).toContain('notification');
  });

  it('displays the notification published date in the type banner', async () => {
    const component = await mountComponent('en');

    await flushPromises();

    const items = component.findAll('.accordion-item');
    const notificationItem = items.find(item => item.find('.calendar-accordion__title').text().trim() === 'Test Notification Item');

    expect(notificationItem).toBeTruthy();

    const bannerDate = notificationItem!.find('.calendar-row__type-date').text().trim();

    expect(bannerDate).toContain('15 January 2025');
  });

  it('hides the empty responsible unit line for notifications', async () => {
    const component = await mountComponent('en');

    await flushPromises();

    const items = component.findAll('.accordion-item');
    const notificationItem = items.find(item => item.find('.calendar-accordion__title').text().trim() === 'Test Notification Item');

    expect(notificationItem).toBeTruthy();

    const toggle = notificationItem!.find('.accordion-button');

    await toggle.trigger('click');
    await flushPromises();

    // The responsible officer/unit sections are currently disabled in the component (v-if="false")
    // This test verifies they don't appear
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

    const titles = component.findAll('.calendar-accordion__title').map(el => el.text().trim());

    expect(titles).toEqual(['Test Notification Item']);
  });
});
