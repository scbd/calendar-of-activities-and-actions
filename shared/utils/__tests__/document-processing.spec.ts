import { describe, it, expect } from 'vitest';
import type { CalendarDoc } from '../../types/calendar';
import {
  collectCountryEntries,
  collectGlobalTargetEntries,
  collectValueLabelPairs,
  getDocBooleanValue,
  getDocCountries,
  getDocDecisionLabels,
  getDocGlobalTargets,
  getDocRaw,
  getDocStringValue,
  getDocSubjects,
  getDocSubsidiaryBodies,
} from '../document-processing';
import { rawDocMap } from '../calendar-document-normalizer';

describe('document processing utilities', () => {
  it('retrieves raw docs from the weak map', () => {
    const doc = { id: 'doc' } as CalendarDoc;
    const raw = { original: true };

    rawDocMap.set(doc, raw);

    expect(getDocRaw(doc)).toBe(raw);
  });

  it('resolves string and boolean values', () => {
    const doc = { id: 'doc', status: ' Active ' } as CalendarDoc;

    expect(getDocStringValue(doc, 'status')).toBe('Active');

    const booleanDoc = { id: 'doc', actionRequired: 'yes' } as CalendarDoc;

    expect(getDocBooleanValue(booleanDoc, 'actionRequired')).toBe(true);
  });

  it('collects subjects and bodies from docs and raw data', () => {
    const doc = { id: 'doc', subjectEn: 'A, B', subsidiaryBodies: ['Body A'] } as CalendarDoc;

    expect(getDocSubjects(doc)).toEqual(['A', 'B']);
    expect(getDocSubsidiaryBodies(doc)).toEqual(['Body A']);
  });

  it('collects decision labels using decision entries helper', () => {
    const doc = { id: 'doc', decision: 'CBD/COP/15/1' } as unknown as CalendarDoc;
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
      gbfTargets: ['T1'],
      countries: ['CA'],
    } as CalendarDoc;

    expect(collectGlobalTargetEntries(doc)[0]?.value).toBe('T1');
    expect(collectCountryEntries(doc)[0]?.value).toBe('CA');
    expect(getDocGlobalTargets(doc)).toEqual(['T1']);
    expect(getDocCountries(doc)).toEqual(['CA']);
  });
});
