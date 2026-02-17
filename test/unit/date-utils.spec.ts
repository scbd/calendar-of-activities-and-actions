import { describe, it, expect } from 'vitest';
import { DateTime } from 'luxon';
import type { CalendarDoc } from '../../shared/types/calendar';
import {
  coerceIsoDate,
  formatDateRange,
  formatNotificationDate,
  getQuarter,
  isQuarterStart,
  parseFlexibleDate,
  safeDate,
} from '../../shared/utils/date';

describe('date utilities', () => {
  it('parses flexible dates with short years', () => {
    const iso = parseFlexibleDate('1-Jan-24');

    expect(iso).toBe('2024-01-01T00:00:00.000Z');
  });

  it('coerces iso date values', () => {
    expect(coerceIsoDate('2024-05-01T00:00:00.000Z')).toBe('2024-05-01T00:00:00.000Z');
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

    expect(formatDateRange(meeting)).toBe('1 - 3 May 2024');

    const notification: CalendarDoc = {
      id: 'notification-1',
      type: 'Notification',
      date: '2024-06-01T00:00:00.000Z',
    } as unknown as CalendarDoc;

    expect(formatDateRange(notification)).toBe('1 June 2024');
  });

  describe('getQuarter', () => {
    it('returns Q1 for Jan–Mar', () => {
      expect(getQuarter(DateTime.utc(2024, 1, 15))).toBe(1);
      expect(getQuarter(DateTime.utc(2024, 3, 31))).toBe(1);
    });

    it('returns Q2 for Apr–Jun', () => {
      expect(getQuarter(DateTime.utc(2024, 4, 1))).toBe(2);
      expect(getQuarter(DateTime.utc(2024, 6, 30))).toBe(2);
    });

    it('returns Q3 for Jul–Sep', () => {
      expect(getQuarter(DateTime.utc(2024, 7, 1))).toBe(3);
      expect(getQuarter(DateTime.utc(2024, 9, 30))).toBe(3);
    });

    it('returns Q4 for Oct–Dec', () => {
      expect(getQuarter(DateTime.utc(2024, 10, 1))).toBe(4);
      expect(getQuarter(DateTime.utc(2024, 12, 31))).toBe(4);
    });
  });

  describe('isQuarterStart', () => {
    it('returns true for quarter start dates', () => {
      expect(isQuarterStart(DateTime.utc(2024, 1, 1))).toBe(true);
      expect(isQuarterStart(DateTime.utc(2024, 4, 1))).toBe(true);
      expect(isQuarterStart(DateTime.utc(2024, 7, 1))).toBe(true);
      expect(isQuarterStart(DateTime.utc(2024, 10, 1))).toBe(true);
    });

    it('returns false for non-quarter-start dates', () => {
      expect(isQuarterStart(DateTime.utc(2024, 1, 2))).toBe(false);
      expect(isQuarterStart(DateTime.utc(2024, 2, 1))).toBe(false);
      expect(isQuarterStart(DateTime.utc(2024, 5, 1))).toBe(false);
    });
  });

  describe('formatDateRange – tentative calendarActivity quarter labels', () => {
    it('shows Q label with year when start equals end and status is tentative', () => {
      const doc = {
        id: 'act-1',
        schema: 'calendarActivity',
        status: 'tentative',
        startDate: '2024-01-15T00:00:00.000Z',
        endDate: '2024-01-15T00:00:00.000Z',
      } as unknown as CalendarDoc;

      expect(formatDateRange(doc)).toBe('Q1 2024');
    });

    it('shows Q4 with year for a tentative activity in October', () => {
      const doc = {
        id: 'act-2',
        schema: 'calendarActivity',
        status: 'NCHM-EVENT-STATUS-TENTATIVE',
        startDate: '2024-10-10T00:00:00.000Z',
        endDate: '2024-10-10T00:00:00.000Z',
      } as unknown as CalendarDoc;

      expect(formatDateRange(doc)).toBe('Q4 2024');
    });

    it('shows Q1 - Q2 with year when spanning two quarters same year', () => {
      const doc = {
        id: 'act-3',
        schema: 'calendarActivity',
        status: 'tentative',
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2024-06-30T00:00:00.000Z',
      } as unknown as CalendarDoc;

      expect(formatDateRange(doc)).toBe('Q1 - Q2 2024');
    });

    it('shows Q3 - Q4 with year when spanning Q3 to Q4', () => {
      const doc = {
        id: 'act-4',
        schema: 'calendarActivity',
        status: 'tentat',
        startDate: '2024-07-01T00:00:00.000Z',
        endDate: '2024-12-31T00:00:00.000Z',
      } as unknown as CalendarDoc;

      expect(formatDateRange(doc)).toBe('Q3 - Q4 2024');
    });

    it('shows quarter range for tentative even when start is not a quarter boundary', () => {
      const doc = {
        id: 'act-5',
        schema: 'calendarActivity',
        status: 'tentative',
        startDate: '2024-01-15T00:00:00.000Z',
        endDate: '2024-06-30T00:00:00.000Z',
      } as unknown as CalendarDoc;

      expect(formatDateRange(doc)).toBe('Q1 - Q2 2024');
    });

    it('shows cross-year quarter range with both years', () => {
      const doc = {
        id: 'act-cross',
        schema: 'calendarActivity',
        status: 'tentative',
        startDate: '2025-10-01T00:00:00.000Z',
        endDate: '2026-03-15T00:00:00.000Z',
      } as unknown as CalendarDoc;

      expect(formatDateRange(doc)).toBe('Q4 2025 - Q1 2026');
    });

    it('shows single quarter when both dates fall in same quarter', () => {
      const doc = {
        id: 'act-same-q',
        schema: 'calendarActivity',
        status: 'tentative',
        startDate: '2026-04-10T00:00:00.000Z',
        endDate: '2026-05-20T00:00:00.000Z',
      } as unknown as CalendarDoc;

      expect(formatDateRange(doc)).toBe('Q2 2026');
    });

    it('shows Q2 - Q3 for March-to-June tentative activity', () => {
      const doc = {
        id: 'act-mar-jun',
        schema: 'calendarActivity',
        status: 'tentative',
        startDate: '2026-04-01T00:00:00.000Z',
        endDate: '2026-07-01T00:00:00.000Z',
      } as unknown as CalendarDoc;

      expect(formatDateRange(doc)).toBe('Q2 - Q3 2026');
    });

    it('shows normal date for confirmed calendarActivity (not tentative)', () => {
      const doc = {
        id: 'act-6',
        schema: 'calendarActivity',
        status: 'confirmed',
        startDate: '2024-01-15T00:00:00.000Z',
        endDate: '2024-01-15T00:00:00.000Z',
      } as unknown as CalendarDoc;

      expect(formatDateRange(doc)).toBe('15 January 2024');
    });
  });

  describe('formatDateRange – hyphen spacing', () => {
    it('uses space-hyphen-space for same-month ranges', () => {
      const doc = {
        id: 'doc-1',
        startDate: '2024-05-01T00:00:00.000Z',
        endDate: '2024-05-15T00:00:00.000Z',
      } as CalendarDoc;

      expect(formatDateRange(doc)).toBe('1 - 15 May 2024');
    });

    it('uses space-hyphen-space for cross-month same-year ranges', () => {
      const doc = {
        id: 'doc-2',
        startDate: '2024-03-15T00:00:00.000Z',
        endDate: '2024-06-20T00:00:00.000Z',
      } as CalendarDoc;

      expect(formatDateRange(doc)).toBe('15 March - 20 June 2024');
    });

    it('uses space-hyphen-space for cross-year ranges', () => {
      const doc = {
        id: 'doc-3',
        startDate: '2024-11-01T00:00:00.000Z',
        endDate: '2025-02-28T00:00:00.000Z',
      } as CalendarDoc;

      expect(formatDateRange(doc)).toBe('1 November 2024 - 28 February 2025');
    });
  });
});
