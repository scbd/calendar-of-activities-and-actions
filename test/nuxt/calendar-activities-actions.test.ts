import { describe, it, expect, vi } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import CalendarActivitiesActions from '../../app/components/calendar-activities-actions.vue';

// Mock the useQueryIndex composable to prevent actual API calls
vi.mock('../../composables/useQueryIndex', () => ({
  useQueryIndex: () => ({
    data: { value: null },
    error: { value: null },
    pending: { value: false }
  })
}));

describe('CalendarActivitiesActions Component', () => {
  it('should mount successfully without filteredDocs error', async () => {
    const component = await mountSuspended(CalendarActivitiesActions);
    expect(component.exists()).toBe(true);
  });

  it('should display the correct title', async () => {
    const component = await mountSuspended(CalendarActivitiesActions);
    const title = component.find('h2');
    expect(title.text()).toBe('Activities & Actions Explorer');
  });
});
