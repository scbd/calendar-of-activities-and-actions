import { describe, it, expect, vi } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { flushPromises } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import CalendarActivitiesActions from '../../app/components/calendar-activities-actions.vue';
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

vi.mock('../../shared/utils/decision-links', () => ({
  extractDecisionEntries: () => [],
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

    const typeBadge = component.find('.badge.bg-secondary');
    expect(typeBadge.exists()).toBe(true);
    expect(typeBadge.text().trim().length).toBeGreaterThan(0);
  });

  it('prefixes COP for decisions without reserved tokens in English', async () => {
    const component = await mountComponent('en');
    await flushPromises();

    const decisionParagraphs = component.findAll('p').filter(paragraph => paragraph.text().includes('Decision:'));
    const decisionTexts = decisionParagraphs.map(paragraph => paragraph.text());

    expect(decisionTexts).toContain('Decision: COP 15/3');
    expect(decisionTexts).toContain('Decision: NP-1');
  });

  it('uses localized COP prefix when locale is French', async () => {
    const component = await mountComponent('fr');
    await flushPromises();

    const decisionParagraphs = component.findAll('p').filter(paragraph => paragraph.text().includes('Decision:'));
    const decisionTexts = decisionParagraphs.map(paragraph => paragraph.text());

    expect(decisionTexts).toContain('Decision: CdP 15/3');
    expect(decisionTexts).toContain('Decision: NP-1');
  });
});
