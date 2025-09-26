import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { flushPromises } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import CalendarActivitiesActions from '../../app/components/calendar-activities-actions.vue';
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
}));

// Provide markdown table with two non-meeting activity types to ensure they are visible by default
vi.mock('../../app/composables/use-calendar-markdown', () => ({
  useCalendarMarkdown: vi.fn().mockResolvedValue(`| Title | Description | Type | Action Required by Parties | Subject | Status | Status_narrative | Startdate | Enddate | Associatedbody | AgendaItem | COPDecision | COPParagraph_no | COPParagraph_type | Responsible_Unit | Responsible_Officer | Funding_source | Funding_allocated | Actors | Actors_comments | GBF_Targets | Related_documents | Outcome |\n|-------|-------------|------|----------------------------|---------|--------|------------------|-----------|---------|----------------|------------|-------------|-----------------|-------------------|------------------|---------------------|----------------|-------------------|--------|-----------------|-------------|--------------------|---------|\n| Sample Activity | | Activity | Y | Sample Subject | Confirmed | | 1-Jan-2025 | 2-Jan-2025 | SBSTTA | | 15/3 | | | UNIT | Officer | | | | | | | |\n| Second Item | | Nominations | N | Another Subject | Completed | | 5-Feb-2025 | 6-Feb-2025 | SBSTTA | | 15/4 | | | UNIT | Officer | | | | | | | |`)
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

describe('CalendarActivitiesActions Component', () => {
  it('should mount successfully without filteredDocs error', async () => {
    const component = await mountComponent();

    expect(component.exists()).toBe(true);
  });

  it('should display the correct title', async () => {
    const component = await mountComponent();
    const title = component.find('h2');

    expect(title.text()).toBe('Activities & Actions Explorer - Activities grouped in meetings');
  });

  it('renders a type strip with a centered label', async () => {
    const component = await mountComponent();

    await flushPromises();

    const typeStrip = component.find('[data-testid="calendar-row-type-strip"]');

    expect(typeStrip.exists()).toBe(true);
    expect(typeStrip.text().trim().length).toBeGreaterThan(0);
  });

  it('renders a meeting documents link when meeting URLs are provided', async () => {
    const component = await mountComponent();

    // Wait for asynchronous data normalization to complete
    await flushPromises();

    const documentLinks = component.findAll('.links a');

    expect(documentLinks.length).toBeGreaterThan(0);
    const firstLink = documentLinks[0];

    expect(firstLink?.text()).toBe('Documents »');
    expect(firstLink?.attributes('href')).toBe('https://www.cbd.int/meetings/test-1');
  });

  it('renders the meeting documents link alongside the status badges in the same row', async () => {
    const component = await mountComponent();

    await flushPromises();

    const rows = component.findAll('.calendar-row');

    expect(rows.length).toBeGreaterThan(0);
    const firstRow = rows[0];

    expect(firstRow.find('[data-testid="calendar-row-type-strip"]').exists()).toBe(true);
    expect(firstRow.find('.links a').exists()).toBe(true);
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

    const typeLabels = component.findAll('[data-testid="calendar-row-type-strip"]').map(el => el.text().trim().toLowerCase());

    expect(typeLabels.some(l => l === 'activity')).toBe(true);
    expect(typeLabels.some(l => l === 'nominations')).toBe(true);
  });
});
