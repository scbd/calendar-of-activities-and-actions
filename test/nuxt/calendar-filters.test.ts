import { describe, it, expect } from 'vitest';
import { nextTick } from 'vue';
import Multiselect from 'vue-multiselect';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import CalendarFilters from '../../app/components/calendar-filters.vue';

describe('CalendarFilters Component', () => {
  it('should mount successfully', async () => {
    const wrapper = await mountSuspended(CalendarFilters, {
      props: {
        availableTypes: ['Meeting', 'Workshop'],
        availableSubjects: ['Biodiversity', 'Climate'],
        availableStatuses: ['Confirmed', 'Tentative'],
        availableSubsidiaryBodies: ['SBSTTA', 'SBI'],
        availableCopDecisions: ['COP-15', 'COP-16'],
      },
    });

    expect(wrapper.exists()).toBe(true);
  });

  it('should emit filter updates when select changes', async () => {
    const wrapper = await mountSuspended(CalendarFilters, {
      props: {
        availableTypes: ['Meeting', 'Workshop'],
        availableSubjects: ['Biodiversity', 'Climate'],
        availableStatuses: ['Confirmed', 'Tentative'],
        availableSubsidiaryBodies: ['SBSTTA', 'SBI'],
        availableCopDecisions: ['COP-15', 'COP-16'],
      },
    });

    // Simulate selecting a type
  const typeSelect = wrapper.findComponent(Multiselect);
  // vue-multiselect is a custom component; simulate v-model update event
  typeSelect.vm.$emit('update:modelValue', ['Meeting']);
  await nextTick();

    expect(wrapper.emitted('update:filters')).toBeTruthy();
  const emissions = wrapper.emitted('update:filters')!;
    const emittedFilters = emissions[emissions.length - 1][0];
    expect(emittedFilters.types).toEqual(['Meeting']);
  });

  it('should clear all filters when clear button is clicked', async () => {
    const wrapper = await mountSuspended(CalendarFilters, {
      props: {
        availableTypes: ['Meeting', 'Workshop'],
        availableSubjects: ['Biodiversity', 'Climate'],
        availableStatuses: ['Confirmed', 'Tentative'],
        availableSubsidiaryBodies: ['SBSTTA', 'SBI'],
        availableCopDecisions: ['COP-15', 'COP-16'],
      },
    });

    // Set some filters first
    const typeSelect = wrapper.find('#type-filter');
    await typeSelect.setValue(['Meeting']);

    // Clear filters
    const clearButton = wrapper.find('button');
    await clearButton.trigger('click');

    const emittedFilters = wrapper.emitted('update:filters')[1][0]; // Second emission after clear
    expect(emittedFilters.types).toEqual([]);
    expect(emittedFilters.subjects).toEqual([]);
    expect(emittedFilters.statuses).toEqual([]);
    expect(emittedFilters.subsidiaryBodies).toEqual([]);
    expect(emittedFilters.copDecisions).toEqual([]);
    expect(emittedFilters.startDate).toBe('');
    expect(emittedFilters.endDate).toBe('');
    expect(emittedFilters.actionRequired).toBe(false);
  });
});