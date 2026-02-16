import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { createI18n } from 'vue-i18n';
import CalendarNotificationCard from '../../app/components/calendar/calendar-notification-card.vue';
import { subjectLabelMap } from '../../shared/utils/subjects';
import en from '../../i18n/locales/en.json';

function createI18nPlugin(locale: string = 'en') {
  return createI18n({
    legacy: false,
    locale,
    fallbackLocale: 'en',
    messages: { en },
  });
}

describe('CalendarNotificationCard', () => {
  beforeEach(() => {
    subjectLabelMap.value = {
      'CBD-SUBJECT-TEST': 'Test Subject',
    };
  });

  afterEach(() => {
    subjectLabelMap.value = {};
  });

  it('renders thematic areas using subject labels and fallbacks', async () => {
    const entry = {
      key: '2024-099',
      loading: false,
      details: {
        key: '2024-099',
        title: 'Test Notification',
        actionRequired: false,
        recipients: [],
        themes: ['CBD-SUBJECT-TEST', 'CBD-SUBJECT-UNKNOWN'],
        attachments: [],
        link: 'https://www.cbd.int/notifications/2024-099',
      },
    };

    const wrapper = await mountSuspended(CalendarNotificationCard, {
      props: { entry },
      global: {
        plugins: [createI18nPlugin()],
      },
    });

    expect(wrapper.text()).toContain('Test Subject');
    expect(wrapper.text()).toContain('Unknown');
    expect(wrapper.findAll('.calendar-pill').length).toBe(2);
  });
});
