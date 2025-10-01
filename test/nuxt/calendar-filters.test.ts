import { describe, it, expect } from 'vitest';
import { nextTick } from 'vue';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import Multiselect from 'vue-multiselect';
import { createI18n } from 'vue-i18n';
import CalendarFilters from '../../app/components/calendar/calendar-filters.vue';
import en from '../../i18n/locales/en.json';
import fr from '../../i18n/locales/fr.json';

const defaultProps = {
  // availableTypes now ignored by component logic; kept for compatibility
  availableTypes: ['Meeting', 'Workshop'],
  availableSubjects: ['Biodiversity', 'Climate'],
  availableStatuses: ['Confirmed', 'Tentative'],
  availableSubsidiaryBodies: ['SBSTTA', 'SBI'],
  availableCopDecisions: ['COP-15', 'COP-16'],
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
    expect(latest?.copDecisions).toEqual([]);
    expect(latest?.activityTypes).toEqual([]);
    expect(latest?.globalTargets).toEqual([]);
    expect(latest?.countries).toEqual([]);
    expect(latest?.startDate).toBe('');
    expect(latest?.endDate).toBe('');
    expect(latest?.actionRequired).toBe(false);
    expect(latest?.searchText).toBe('');
    expect(latest?.sort).toEqual(['startDate:asc']);
  });

  it('provides the canonical schema options', async () => {
    const wrapper = await mountFilters();
    const typeSelect = wrapper.findComponent(Multiselect);
    const options = typeSelect.props('options') as Array<{ value: string; label: string }>;

    expect(options.map(option => option.value)).toEqual(['meeting', 'notification', 'activity']);
    expect(options.map(option => option.label)).toEqual(['Meeting', 'Notification', 'Activity']);
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
