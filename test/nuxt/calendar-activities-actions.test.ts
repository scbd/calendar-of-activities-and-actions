import { describe, it, expect } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import CalendarActivitiesActions from '../../components/calendar-activities-actions.vue';

describe('CalendarActivitiesActions Component', () => {
  it('should mount successfully', async () => {
    const component = await mountSuspended(CalendarActivitiesActions, {
      // no props required for static scaffold
    });

    expect(component.exists()).toBe(true);
  });

  it('should display the correct title', async () => {
    const component = await mountSuspended(CalendarActivitiesActions);

    const title = component.find('h2');
    expect(title.text()).toBe('Activities & Actions Explorer');
  });

  it('should render static scaffold elements', async () => {
    const component = await mountSuspended(CalendarActivitiesActions);

    // Scaffold note
    expect(component.text()).toContain('This is a static scaffolding example');

    // Table and headers
    const tableWrapper = component.find('.table-responsive');
    const table = component.find('table');
    expect(tableWrapper.exists()).toBe(true);
    expect(table.exists()).toBe(true);
    const headers = component.findAll('th').map((th) => th.text());
    expect(headers).toEqual(['Title', 'Type', 'Status']);

    // Example row
    const cells = component.findAll('tbody td').map((td) => td.text());
    expect(cells).toContain('Example Item');
  });

  it('should render simple pagination controls', async () => {
    const component = await mountSuspended(CalendarActivitiesActions);
    const buttons = component.findAll('button').map((b) => b.text());
    expect(buttons).toContain('Prev');
    expect(buttons).toContain('Next');
    expect(component.text()).toContain('Page 1 / 1');
  });
});