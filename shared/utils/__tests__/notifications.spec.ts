import { describe, it, expect, beforeEach } from 'vitest';
import type { CalendarDoc, NotificationDoc } from '../../types/calendar';
import {
  buildNotificationExcerpt,
  buildNotificationLink,
  deriveNameFromUrl,
  getNotificationKeys,
  normalizeNotificationList,
  notificationDisplayEntries,
  parseNotificationAttachments,
  resolveNotificationUrl,
  selectNotificationTitle,
  setNotificationStores,
} from '../notifications';

describe('notification utilities', () => {
  beforeEach(() => {
    setNotificationStores({
      getDetails: () => ({ '2024-001': { key: '2024-001', title: 'Notification', actionRequired: false, recipients: [], thematicAreas: [], attachments: [], link: '' } }),
      getLoading: () => ({ '2024-001': false }),
      getErrors: () => ({}),
    });
  });

  it('resolves URLs and filenames', () => {
    expect(resolveNotificationUrl('/test')).toContain('https://');
    expect(deriveNameFromUrl('https://site/doc.pdf')).toBe('doc.pdf');
  });

  it('normalizes notification lists', () => {
    expect(normalizeNotificationList([' A ', 'B', 'A'])).toEqual(['A', 'B']);
  });

  it('parses notification attachments', () => {
    const attachments = parseNotificationAttachments(['{"url":"/file.pdf"}']);

    expect(attachments[0]?.url).toContain('https://');
  });

  it('builds excerpts and titles', () => {
    expect(buildNotificationExcerpt('<p>Hello</p>')).toBe('Hello');
    expect(selectNotificationTitle('2024-001', { title: 'Title' }, null)).toBe('Title');
    expect(buildNotificationLink('2024-001')).toContain('2024-001');
  });

  it('collects notification keys from normalized SOLR doc', () => {
    const doc: NotificationDoc = {
      id: 'n1',
      schema: 'notification',
      identifier: 'n1',
      symbol: '2024-001',
      notifications: ['2024-002'],
    };
    const keys = getNotificationKeys(doc as CalendarDoc);

    expect(keys).toContain('2024-001');
  });

  it('returns display entries for non-notification docs with keys', () => {
    const doc = {
      id: 'a1',
      schema: 'calendarActivity',
      identifier: 'a1',
      notifications: ['2024-001'],
    } as unknown as CalendarDoc;

    const entries = notificationDisplayEntries(doc);

    expect(entries[0]?.key).toBe('2024-001');
  });
});
