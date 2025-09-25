import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { flushPromises } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import CalendarActivitiesActions from '../../app/components/calendar-activities-actions.vue';
import DecisionLink from '../../app/components/decision-link.vue';
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
vi.mock('../../composables/useQueryIndex', () => ({
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

const decisionEntriesMock = vi.hoisted(() => vi.fn((record: Record<string, unknown>) => {
  const id = record._id ?? record.id;

  if (id === 'test-1') {
    return [
      {
        label: '15/3',
        href: 'https://www.cbd.int/decisions/?m=cop-15-3',
      },
    ];
  }
  if (id === 'test-2') {
    return [
      {
        label: 'NP-1',
        href: 'https://www.cbd.int/decisions/?m=np-1',
      },
    ];
  }
  return [];
})) as ReturnType<typeof vi.fn>;

vi.mock('../../shared/utils/decision-links', async () => {
  const _actual = await vi.importActual<typeof import('../../shared/utils/decision-links')>('../../shared/utils/decision-links');

  return {
    ..._actual,
    extractDecisionEntries: decisionEntriesMock,
  };
});

// Provide markdown table with two non-meeting activity types to ensure they are visible by default
vi.mock('../../composables/useCalendarMarkdown', () => ({
  useCalendarMarkdown: vi.fn().mockResolvedValue(`| Title | Description | Type | Action Required by Parties | Subject | Status | Status_narrative | Startdate | Enddate | Associatedbody | AgendaItem | COPDecision | COPParagraph_no | COPParagraph_type | Responsible_Unit | Responsible_Officer | Funding_source | Funding_allocated | Actors | Actors_comments | GBF_Targets | Related_documents | Outcome |\n|-------|-------------|------|----------------------------|---------|--------|------------------|-----------|---------|----------------|------------|-------------|-----------------|-------------------|------------------|---------------------|----------------|-------------------|--------|-----------------|-------------|--------------------|---------|\n| Sample Activity | | Activity | Y | Sample Subject | Confirmed | | 1-Jan-2025 | 2-Jan-2025 | SBSTTA | | 15/3 | | | UNIT | Officer | | | | | | | |\n| Second Item | | Nominations | N | Another Subject | Completed | | 5-Feb-2025 | 6-Feb-2025 | SBSTTA | | 15/4 | | | UNIT | Officer | | | | | | | |`)
}));

vi.mock('../../shared/data/meetings.js', () => ({
  meetings: [
    {
      _id: 'test-1',
      id: 'test-1',
      title_EN_t: 'Decision Without Prefix',
      type_s: 'Meeting',
      subject_EN_s: 'Subject',
      startDate_dt: '2025-01-01T00:00:00Z',
      endDate_dt: '2025-01-02T00:00:00Z',
      copDecision_s: '15/3',
      status_s: 'Confirmed'
    },
    {
      _id: 'test-2',
      id: 'test-2',
      title_EN_t: 'Decision With NP',
      type_s: 'Meeting',
      subject_EN_s: 'Subject',
      startDate_dt: '2025-02-01T00:00:00Z',
      endDate_dt: '2025-02-02T00:00:00Z',
      copDecision_s: 'NP-1',
      status_s: 'Confirmed'
    }
  ]
}));

describe('CalendarActivitiesActions Component', () => {
  beforeEach(() => {
    decisionEntriesMock.mockClear();
  });

  it('should mount successfully without filteredDocs error', async () => {
    const component = await mountComponent();

    expect(component.exists()).toBe(true);
  });

  it('should display the correct title', async () => {
    const component = await mountComponent();
    const title = component.find('h2');

    expect(title.text()).toBe('Activities & Actions Explorer - Accordion View');
  });

  it('renders a type strip with a centered label', async () => {
    const component = await mountComponent();
    await flushPromises();

    const typeStrip = component.find('.calendar-row__type-strip');

    expect(typeStrip.exists()).toBe(true);
    expect(typeStrip.text().trim().length).toBeGreaterThan(0);
  });

  it('prefixes COP for decisions without reserved tokens in English', async () => {
    const component = await mountComponent('en');

    await flushPromises();

    const links = component.findAllComponents(DecisionLink);
    const copLink = links.find(link => link.text() === 'COP 15/3');
    const npLink = links.find(link => link.text() === 'NP-1');

    expect(copLink).toBeTruthy();
    expect(npLink).toBeTruthy();
    expect(copLink?.props('href')).toBe('https://www.cbd.int/decisions/?m=cop-15-3');
    expect(npLink?.props('href')).toBe('https://www.cbd.int/decisions/?m=np-1');
  });

  it('uses localized COP prefix when locale is French', async () => {
    const component = await mountComponent('fr');


    await flushPromises();

    const links = component.findAllComponents(DecisionLink);
    const copLink = links.find(link => link.text() === 'CdP 15/3');
    const npLink = links.find(link => link.text() === 'NP-1');

    expect(copLink).toBeTruthy();
    expect(npLink).toBeTruthy();
  });

  it('shows non-meeting types by default (no implicit meeting filter applied)', async () => {
    const component = await mountComponent('en');

    await flushPromises();

    const typeLabels = component.findAll('.calendar-row__type-strip').map(el => el.text().trim().toLowerCase());

    expect(typeLabels.some(l => l === 'activity')).toBe(true);
    expect(typeLabels.some(l => l === 'nominations')).toBe(true);
  });
});
