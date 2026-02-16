import { describe, it, expect, beforeEach } from 'vitest';
import {
  getNotificationKeys,
  notificationDisplayEntries,
  setNotificationStores,
} from '../../shared/utils/notifications';
import type { CalendarDoc } from '../../shared/types/calendar';

describe('notification utilities integration', () => {
  beforeEach(() => {
    const details = {
      '2024-001': {
        key: '2024-001',
        title: 'Seeded Notification',
        actionRequired: false,
        recipients: [],
        themes: [],
        attachments: [],
        link: 'https://www.cbd.int/notifications/2024-001',
      },
    };

    setNotificationStores({
      getDetails: () => details,
      getLoading: () => ({}),
      getErrors: () => ({}),
    });
  });

  it('returns display entries for seeded notifications', () => {
    const doc = {
      id: 'a1',
      schema: 'calendarActivity',
      identifier: 'a1',
      notificationKey: '2024-001',
      notificationKeys: ['2024-001'],
      notifications: [],
    } as unknown as CalendarDoc;

    const entries = notificationDisplayEntries(doc as CalendarDoc);

    expect(entries.length).toBe(1);
    expect(entries[0]?.key).toBe('2024-001');
  });

  it('extracts unique notification keys from SOLR-normalized doc', () => {
    const doc = {
      id: 'n1',
      schema: 'notification',
      identifier: 'n1',
      symbol: '2024-050',
      notifications: ['2024-055'],
      relatedDocuments: ['NTF 2024-050'],
    } as unknown as CalendarDoc;

    const keys = getNotificationKeys(doc as CalendarDoc);

    expect(keys).toContain('2024-050');
    expect(keys).toContain('2024-055');
  });
});
