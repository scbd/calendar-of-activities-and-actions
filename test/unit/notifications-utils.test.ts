import { describe, it, expect, beforeEach } from 'vitest';
import {
  getNotificationKeys,
  mapNotificationRecordToDoc,
  notificationDisplayEntries,
  setNotificationStores,
} from '../../shared/utils/notifications';
import type { CalendarDoc } from '../../shared/types/calendar';

const baseRecord = {
  symbol: '2024-001',
  urls: ['https://www.cbd.int/notifications/2024-001'],
  recipients: [],
  themes: [],
  files: [],
};

describe('notification utilities integration', () => {
  beforeEach(() => {
    const details = {
      '2024-001': {
        key: '2024-001',
        title: 'Seeded Notification',
        actionRequired: false,
        recipients: [],
        thematicAreas: [],
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
      schema: 'activity',
      notificationKey: '2024-001',
      notificationKeys: ['2024-001'],
    } as unknown as CalendarDoc;

    const entries = notificationDisplayEntries(doc as CalendarDoc);

    expect(entries.length).toBe(1);
    expect(entries[0]?.key).toBe('2024-001');
  });

  it('extracts unique notification keys from prefixed strings', () => {
    const doc = mapNotificationRecordToDoc({
      ...baseRecord,
      symbol: '2024-050',
      relatedDocuments: ['NTF 2024-050, NTF 2024-055', '2024-050'],
      urls: ['https://www.cbd.int/notifications/2024-050'],
    }, 1);

    const keys = getNotificationKeys(doc as CalendarDoc);

    expect(keys).toEqual(['2024-050', '2024-055']);
  });
});
