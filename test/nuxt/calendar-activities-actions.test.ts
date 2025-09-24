import { describe, it, expect, vi } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { createI18n } from 'vue-i18n';
import CalendarActivitiesActions from '../../app/components/calendar-activities-actions.vue';
import en from '../../i18n/locales/en.json';
import fr from '../../i18n/locales/fr.json';

function createI18nPlugin() {
  return createI18n({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    messages: { en, fr },
  });
}

async function mountComponent() {
  return mountSuspended(CalendarActivitiesActions, {
    global: {
      plugins: [createI18nPlugin()],
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

describe('CalendarActivitiesActions Component', () => {
  it('should mount successfully without filteredDocs error', async () => {
    const component = await mountComponent();
    expect(component.exists()).toBe(true);
  });

  it('should display the correct title', async () => {
    const component = await mountComponent();
    const title = component.find('h2');
    expect(title.text()).toBe('Activities & Actions Explorer');
  });

  it('renders a type strip with a centered label', async () => {
    const component = await mountComponent();
    const typeStrip = component.find('[data-testid="calendar-row-type-strip"]');
    expect(typeStrip.exists()).toBe(true);
    expect(typeStrip.classes()).toContain('d-flex');
    expect(typeStrip.classes()).toContain('justify-content-center');

    const typeLabel = typeStrip.find('[data-testid="calendar-row-type-text"]');
    expect(typeLabel.exists()).toBe(true);
    expect(typeLabel.text().trim().length).toBeGreaterThan(0);
  });
});
