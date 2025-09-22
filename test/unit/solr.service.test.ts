import { describe, it, expect } from 'vitest';
import { buildSelectBody, collectAllFieldNames, getTextFieldForLocale } from '../../shared/services/solr';

describe('Solr Service', () => {
  it('buildSelectBody should create default meeting query with locale', () => {
    const body = buildSelectBody({ locale: 'en', schema: 'meeting', start: 0, rows: 10, sinceUpdatedDateISO: '2025-03-12T00:00:00.000Z' });
    expect(body.df).toBe(getTextFieldForLocale('en'));
    expect(body.fq).toContain('_state_s:public');
    expect(body.fq.find((f) => f.includes('schema_s'))).toContain('meeting');
    expect(body.q).toContain('updatedDate_dt:[');
    expect(body.rows).toBe(10);
    expect(body.sort).toBe('updatedDate_dt desc');
  });

  it('collectAllFieldNames returns unique sorted keys', () => {
    const fields = collectAllFieldNames([
      { a: 1, b: 2 },
      { b: 3, c: 4 },
    ]);
    expect(fields).toEqual(['a', 'b', 'c']);
  });
});
