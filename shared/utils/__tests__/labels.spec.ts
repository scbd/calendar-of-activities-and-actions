import { describe, it, expect, beforeEach } from 'vitest';
import type { CalendarDoc } from '../../types/calendar';
import {
  configureLabelLocalization,
  displaySubjectLabels,
  getCopLabel,
  normalizeDecisionLabel,
  resolveCountryLabel,
  responsibleOfficerLabel,
  responsibleUnitLabel,
  setRegionDisplayNames,
  setSubjectLabelMap,
} from '../labels';

const regionNames = typeof Intl.DisplayNames === 'function'
  ? new Intl.DisplayNames(['en'], { type: 'region' })
  : null;

describe('label utilities', () => {
  beforeEach(() => {
    configureLabelLocalization({
      te: key => key === 'calendar.labels.cop',
      t: key => (key === 'calendar.labels.cop' ? 'COP (EN)' : undefined),
    });
    setSubjectLabelMap({ A: 'Subject A' });
    setRegionDisplayNames(regionNames);
  });

  it('resolves country labels using display names', () => {
    const label = resolveCountryLabel('ca');

    expect(label === 'CA' || label === 'Canada').toBe(true);
  });

  it('maps subject labels from configured map', () => {
    const doc = { id: 'doc', subjects: ['A'] } as CalendarDoc;

    expect(displaySubjectLabels(doc)).toEqual(['Subject A']);
  });

  it('normalizes decision labels with COP prefix', () => {
    expect(normalizeDecisionLabel('5/1')).toBe('COP (EN) 5/1');
    expect(normalizeDecisionLabel('COP 15/1')).toBe('COP 15/1');
  });

  it('resolves responsible labels', () => {
    const doc = {
      id: 'doc',
      responsibleUnit: 'Unit A',
      responsibleOfficer: 'Officer B',
    } as CalendarDoc;

    expect(responsibleUnitLabel(doc)).toBe('Unit A');
    expect(responsibleOfficerLabel(doc)).toBe('Officer B');
  });

  it('returns localized cop label', () => {
    expect(getCopLabel()).toBe('COP (EN)');
  });
});
