import { describe, it, expect, beforeEach } from 'vitest';
import type { CalendarDoc } from '../../types/calendar';
import {
  buildDocsFromNotifications,
  buildNotificationDetailsFromSnapshot,
  buildNotificationExcerpt,
  buildNotificationLink,
  deriveNameFromUrl,
  getNotificationKeys,
  mapNotificationRecordToDoc,
  normalizeNotificationList,
  notificationDisplayEntries,
  parseNotificationAttachments,
  resolveNotificationUrl,
  selectNotificationTitle,
  setNotificationStores,
} from '../notifications';

const snapshotRecord = {
  symbol: '2024-001',
  urls: ['https://www.cbd.int/test'],
  recipients: ['Party A'],
  themes: ['Theme'],
  files: [
    { url: '/doc.pdf', name: 'Doc.pdf' },
  ],
  title: 'Notification Title',
};

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

  it('maps snapshot records to documents and details', () => {
    const doc = mapNotificationRecordToDoc(snapshotRecord, 0);
    expect(doc.schema).toBe('notification');

    const details = buildNotificationDetailsFromSnapshot(snapshotRecord, '2024-001');
    expect(details?.key).toBe('2024-001');
  });

  it('collects notification keys and display entries', () => {
    const doc = mapNotificationRecordToDoc(snapshotRecord, 0);
    const keys = getNotificationKeys(doc as CalendarDoc);
    expect(keys).toEqual(['2024-001']);
    const entries = notificationDisplayEntries(doc as CalendarDoc);
    expect(entries[0]?.key).toBe('2024-001');
  });

  it('builds docs from snapshot array', () => {
    const { docs } = buildDocsFromNotifications([snapshotRecord]);
    expect(docs.length).toBe(1);
  });
});
