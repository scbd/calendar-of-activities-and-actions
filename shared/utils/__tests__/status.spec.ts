import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { CalendarDoc } from '../../types/calendar';
import {
  configureStatusLocalization,
  normalizeStatusKey,
  normalizeStatusLabel,
  shouldDisplayCompleted,
  statusColor,
} from '../status';

describe('status utilities', () => {
  beforeEach(() => {
    configureStatusLocalization({
      te: key => key === 'calendar.status.confirm' || key === 'calendar.status.confirmed',
      t: key => (key === 'calendar.status.confirm' ? 'Confirm' : 'Confirmed'),
    });
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-10T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('normalizes status keys', () => {
    expect(normalizeStatusKey('Confirmed')).toBe('CONFIRM');
    expect(normalizeStatusKey(' in progress ')).toBe('IN_PROGRESS');
  });

  it('resolves localized status labels', () => {
    expect(normalizeStatusLabel('confirm')).toBe('Confirm');
    expect(normalizeStatusLabel(undefined, 'Fallback')).toBe('Fallback');
  });

  it('determines completion display based on dates', () => {
    const doc = {
      id: 'doc-1',
      startDate: '2024-06-05T00:00:00.000Z',
      endDate: '2024-06-06T00:00:00.000Z',
    } as CalendarDoc;

    expect(shouldDisplayCompleted(doc, 'CONFIRM')).toBe(true);
  });

  it('calculates status colors', () => {
    const doc = {
      id: 'doc-2',
      status: 'Confirmed',
      statusKey: 'CONFIRM',
      startDate: '2024-06-05T00:00:00.000Z',
      endDate: '2024-06-06T00:00:00.000Z',
    } as CalendarDoc;

    expect(statusColor(doc)).toBe('success');
  });
});
