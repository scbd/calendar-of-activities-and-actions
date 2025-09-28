import { describe, it, expect } from 'vitest';
import { DateTime } from 'luxon';
import type { CalendarDoc } from '../../types/calendar';
import {
  coerceIsoDate,
  formatDateRange,
  formatNotificationDate,
  parseFlexibleDate,
  safeDate,
} from '../date';

describe('date utilities', () => {
  it('parses flexible dates with short years', () => {
    const iso = parseFlexibleDate('1-Jan-24');
    expect(iso).toBe('2024-01-01T00:00:00.000Z');
  });

  it('coerces iso date values', () => {
    expect(coerceIsoDate('2024-05-01')).toBe('2024-05-01T00:00:00.000Z');
    expect(coerceIsoDate('invalid')).toBeUndefined();
  });

  it('formats notification dates', () => {
    expect(formatNotificationDate('2024-05-01')).toBe('1 May 2024');
    expect(formatNotificationDate('invalid')).toBeNull();
  });

  it('parses safe dates', () => {
    const dt = safeDate('2024-05-01');
    expect(dt).toBeInstanceOf(DateTime);
    expect(dt?.toISODate()).toBe('2024-05-01');
  });

  it('formats date ranges for meetings and notifications', () => {
    const meeting: CalendarDoc = {
      id: 'meeting-1',
      startDate: '2024-05-01T00:00:00.000Z',
      endDate: '2024-05-03T00:00:00.000Z',
    } as CalendarDoc;

    expect(formatDateRange(meeting)).toBe('1–3 May 2024');

    const notification: CalendarDoc = {
      id: 'notification-1',
      type: 'Notification',
      publishedDate: '2024-06-01T00:00:00.000Z',
    } as CalendarDoc;

    expect(formatDateRange(notification)).toBe('1 June 2024');
  });
});
