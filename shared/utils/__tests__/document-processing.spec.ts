import { describe, it, expect } from 'vitest';
import type { CalendarDoc } from '../../types/calendar';
import {
  collectCountryEntries,
  collectGlobalTargetEntries,
  collectValueLabelPairs,
  getDocBooleanValue,
  getDocCountries,
  getDocDecisionIdentifiers,
  getDocDecisionLabels,
  getDocGbfSections,
  getDocGlobalTargets,
  getDocGoverningBodies,
  getDocRaw,
  getDocStringValue,
  getDocSubjects,
  getDocSubsidiaryBodies,
} from '../document-processing';

describe('document processing utilities', () => {
  it('getDocRaw always returns null (deprecated)', () => {
    const doc = { id: 'doc', schema: 'calendarActivity', identifier: 'doc' } as CalendarDoc;

    expect(getDocRaw(doc)).toBeNull();
  });

  it('resolves string and boolean values', () => {
    const doc = { id: 'doc', schema: 'calendarActivity', identifier: 'doc', status: ' Active ' } as unknown as CalendarDoc;

    expect(getDocStringValue(doc, 'status')).toBe('Active');

    const booleanDoc = { id: 'doc', schema: 'calendarActivity', identifier: 'doc', actionRequired: 'yes' } as unknown as CalendarDoc;

    expect(getDocBooleanValue(booleanDoc, 'actionRequired')).toBe(true);
  });

  it('collects subjects and subsidiary bodies from docs', () => {
    const doc = { id: 'doc', schema: 'calendarActivity', identifier: 'doc', subjects: ['A', 'B'], subsidiaryBody: ['Body A'] } as unknown as CalendarDoc;

    expect(getDocSubjects(doc)).toEqual(['A', 'B']);
    expect(getDocSubsidiaryBodies(doc)).toEqual(['Body A']);
  });

  it('extracts governing bodies and gbf sections', () => {
    const doc = { id: 'doc', schema: 'calendarActivity', identifier: 'doc', governingBody: ['CBD'], gbfSections: ['SEC-A'] } as unknown as CalendarDoc;

    expect(getDocGoverningBodies(doc)).toEqual(['CBD']);
    expect(getDocGbfSections(doc)).toEqual(['SEC-A']);
  });

  it('collects decision identifiers and labels', () => {
    const doc = { id: 'doc', schema: 'calendarActivity', identifier: 'doc', decisions: ['CAL-DECISION-COP-15-4', 'CAL-DECISION-CP-11-7'] } as unknown as CalendarDoc;

    expect(getDocDecisionIdentifiers(doc)).toEqual(['CAL-DECISION-COP-15-4', 'CAL-DECISION-CP-11-7']);

    const labels = getDocDecisionLabels(doc);

    expect(labels).toEqual(['COP 15/4', 'CP-11/7']);
  });

  it('uses label map when provided to getDocDecisionLabels', () => {
    const doc = { id: 'doc', schema: 'calendarActivity', identifier: 'doc', decisions: ['CAL-DECISION-COP-15-4'] } as unknown as CalendarDoc;
    const labelMap = new Map([['CAL-DECISION-COP-15-4', '15/4']]);

    expect(getDocDecisionLabels(doc, labelMap)).toEqual(['15/4']);
  });

  it('falls back to extractDecisionEntries for legacy docs without decisions array', () => {
    const doc = { id: 'doc', schema: 'calendarActivity', identifier: 'doc', copDecision: 'CBD/COP/15/1' } as unknown as CalendarDoc;
    const labels = getDocDecisionLabels(doc);

    expect(Array.isArray(labels)).toBe(true);
  });

  it('builds value/label pairs and aggregates targets and countries', () => {
    expect(collectValueLabelPairs(['A', 'B'], ['Label A', 'Label B'])).toEqual([
      { value: 'A', label: 'Label A' },
      { value: 'B', label: 'Label B' },
    ]);

    const doc = {
      id: 'doc',
      schema: 'calendarActivity',
      identifier: 'doc',
      gbfTargets: ['T1'],
      countries: ['CA'],
    } as unknown as CalendarDoc;

    expect(collectGlobalTargetEntries(doc)[0]?.value).toBe('T1');
    expect(collectCountryEntries(doc)[0]?.value).toBe('CA');
    expect(getDocGlobalTargets(doc)).toEqual(['T1']);
    expect(getDocCountries(doc)).toEqual(['CA']);
  });
});
