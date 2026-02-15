import { describe, it, expect, vi } from 'vitest';
import { nextTick } from 'vue';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import Multiselect from 'vue-multiselect';
import { createI18n } from 'vue-i18n';
import CalendarFilters from '../../app/components/calendar/calendar-filters.vue';
import en from '../../i18n/locales/en.json';
import fr from '../../i18n/locales/fr.json';
import type { ParsedFacets } from 'shared/types/calendar';

// Mock thesaurus service to prevent HTTP calls in tests
vi.mock('../../shared/services/thesaurus', () => ({
  getDomainTerms: vi.fn().mockResolvedValue([]),
  loadDomainOptions: vi.fn().mockResolvedValue([]),
}));

const defaultFacets: ParsedFacets = {
  schema: [
    { value: 'meeting', count: 10 },
    { value: 'notification', count: 5 },
    { value: 'calendarActivity', count: 3 },
  ],
  subjects: [],
  status: [],
  subsidiaryBody: [],
  governingBody: [],
  decisions: [],
  type: [],
  gbfTargets: [],
  gbfSections: [],
  eventCountry: [],
};

const defaultProps = {
  facets: defaultFacets,
};

function createI18nPlugin() {
  return createI18n({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    messages: { en, fr },
  });
}

async function mountFilters(props = defaultProps) {
  return mountSuspended(CalendarFilters, {
    props,
    global: {
      plugins: [createI18nPlugin()],
    },
  });
}

describe('CalendarFilters Component', () => {
  it('mounts successfully', async () => {
    const wrapper = await mountFilters();

    expect(wrapper.exists()).toBe(true);
  });

  it('emits filter updates when schema selection changes', async () => {
    const wrapper = await mountFilters();
    const selects = wrapper.findAllComponents(Multiselect);
    const typeSelect = selects[0];

    typeSelect.vm.$emit('update:modelValue', ['meeting']);
    await nextTick();
    await nextTick(); // allow watchEffect + updateFilters cycle

    const emissions = wrapper.emitted('update:filters');

    expect(emissions).toBeTruthy();
    const latest = emissions?.[emissions.length - 1]?.[0];

    expect(latest?.types).toEqual(['meeting']);
  });

  it('clears all filters when the clear button is clicked', async () => {
    const wrapper = await mountFilters();
    const selects = wrapper.findAllComponents(Multiselect);
    const typeSelect = selects[0];

    typeSelect.vm.$emit('update:modelValue', ['meeting']);
    await nextTick();

    const actionRequiredToggle = wrapper.find('#action-required-filter');

    await actionRequiredToggle.setValue(true);
    await nextTick();

    const clearButton = wrapper.find('button');

    await clearButton.trigger('click');
    await nextTick();

    const emissions = wrapper.emitted('update:filters');

    expect(emissions).toBeTruthy();
    const latest = emissions?.[emissions.length - 1]?.[0];

    expect(latest?.types).toEqual([]);
    expect(latest?.subjects).toEqual([]);
    expect(latest?.statuses).toEqual([]);
    expect(latest?.subsidiaryBodies).toEqual([]);
    expect(latest?.governingBodies).toEqual([]);
    expect(latest?.copDecisions).toEqual([]);
    expect(latest?.gbfSections).toEqual([]);
    expect(latest?.activityTypes).toEqual([]);
    expect(latest?.globalTargets).toEqual([]);
    expect(latest?.countries).toEqual([]);
    expect(latest?.startDate).toBe('');
    expect(latest?.endDate).toBe('');
    expect(latest?.actionRequired).toBe(false);
    expect(latest?.searchText).toBe('');
    expect(latest?.sort).toEqual(['startDate:asc']);
  });

  it('provides the canonical schema options from SOLR facets', async () => {
    const wrapper = await mountFilters();
    const typeSelect = wrapper.findComponent(Multiselect);
    const options = typeSelect.props('options') as Array<{ value: string; label: string; count?: number }>;

    expect(options.map(option => option.value)).toEqual(['meeting', 'notification', 'calendarActivity']);
    expect(options.every(option => typeof option.count === 'number')).toBe(true);
  });

  it('emits search text updates when typing into the search field', async () => {
    const wrapper = await mountFilters();
    const searchInput = wrapper.find('#search-filter');

    await searchInput.setValue(' biodiversity ');
    await nextTick();
    await nextTick();

    const emissions = wrapper.emitted('update:filters');

    expect(emissions).toBeTruthy();
    const latest = emissions?.[emissions.length - 1]?.[0];

    expect(latest?.searchText).toBe('biodiversity');
  });
});
